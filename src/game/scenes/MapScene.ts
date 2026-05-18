import Phaser from 'phaser'
import { useGameStore } from '../../state/gameStore'
import { getIngredient } from '../../data/ingredients'
import { spriteUrlFor } from '../../services/pokeapi'
import { slicePathByFraction, transformPath } from '../pathUtils'
import {
  MAP_CENTER,
  MAP_HEIGHT,
  MAP_WIDTH,
} from '../../data/map'
import type { Hazard, Portal, Vec2 } from '../types'

const PLAYER_RADIUS = 10
const FOG_CELL = 20
const FOG_COLS = Math.ceil(MAP_WIDTH / FOG_CELL)
const FOG_ROWS = Math.ceil(MAP_HEIGHT / FOG_CELL)
const VISION_RADIUS = 160
const VISION_FADE = 50 // outer ring partial reveal
// Pixel palette (sketchy.jsx pixel mode)
const FOG_COLOR = 0x2a2540
const FOG_ALPHA = 0.78
const FOG_ALPHA_EDGE = 0.42
const BG_HEX = '#d8e3c4'
const INK_HEX = 0x2a2540
const PAPER_HEX = 0xfff5dc
const ACCENT_HEX = 0xcf4640
const MAGIC_HEX = 0x7c5cc4
const WATER_HEX = 0x6aa8c4
const PAWN_COLOR = 0x2a2540
const PAWN_OUTLINE = 0xfff5dc

interface ActiveMovement {
  waypoints: Vec2[]
  segIdx: number
  segT: number
  speed: number
  hitHazards: Set<string>
}

export class MapScene extends Phaser.Scene {
  private playerPawn!: Phaser.GameObjects.Arc
  private centerMarker!: Phaser.GameObjects.Arc
  private previewGfx!: Phaser.GameObjects.Graphics
  private fogGfx!: Phaser.GameObjects.Graphics
  private hazardGfx!: Phaser.GameObjects.Graphics
  private portalGfx!: Phaser.GameObjects.Graphics
  private revealedCells = new Set<string>()
  private edgeCells = new Set<string>()
  private fogDirty = true
  private collectibleSprites = new Map<string, Phaser.GameObjects.Image>()
  private collectibleLabels = new Map<string, Phaser.GameObjects.Text>()
  private movement: ActiveMovement | null = null
  private unsubStore: (() => void) | null = null

  constructor() {
    super('MapScene')
  }

  preload(): void {
    this.load.crossOrigin = 'anonymous'
    const collectibles = useGameStore.getState().collectibles
    for (const c of collectibles) {
      if (c.kind === 'pokemon') {
        this.load.image(`pkmn-${c.defId}`, spriteUrlFor(Number(c.defId)))
      }
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_HEX)

    this.drawGrassTexture()

    const { width } = this.scale
    this.add
      .text(width / 2, 18, 'BREW · MAP', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '11px',
        color: '#2a2540',
      })
      .setOrigin(0.5, 0)
      .setDepth(12)

    this.centerMarker = this.add.circle(
      MAP_CENTER.x,
      MAP_CENTER.y,
      28,
      WATER_HEX,
      0.85,
    )
    this.centerMarker.setStrokeStyle(3, INK_HEX, 1)
    this.centerMarker.setDepth(1)
    this.add
      .text(MAP_CENTER.x, MAP_CENTER.y + 36, 'pozo', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        color: '#2a2540',
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0)
      .setDepth(1)

    this.portalGfx = this.add.graphics()
    this.portalGfx.setDepth(2)
    this.drawPortals()

    this.hazardGfx = this.add.graphics()
    this.hazardGfx.setDepth(2)
    this.drawHazards()

    this.renderCollectibles()

    this.fogGfx = this.add.graphics()
    this.fogGfx.setDepth(8)

    this.previewGfx = this.add.graphics()
    this.previewGfx.setDepth(9)

    const start = useGameStore.getState().playerPos
    this.playerPawn = this.add.circle(
      start.x,
      start.y,
      PLAYER_RADIUS,
      PAWN_COLOR,
    )
    this.playerPawn.setStrokeStyle(3, PAWN_OUTLINE)
    this.playerPawn.setDepth(10)

    this.revealAround(start)
    this.redrawFog()

    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerdown', this.onPointerDown, this)

    this.unsubStore = useGameStore.subscribe((state, prev) => {
      if (state.collectibles !== prev.collectibles) this.renderCollectibles()
      if (state.playerPos !== prev.playerPos && !this.movement) {
        this.playerPawn.setPosition(state.playerPos.x, state.playerPos.y)
        this.revealAround(state.playerPos)
      }
      if (state.pendingMovement !== prev.pendingMovement) {
        if (state.pendingMovement && !this.movement) {
          this.beginMovement(
            state.pendingMovement.waypoints,
            state.pendingMovement.speed,
          )
        }
      }
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubStore?.()
      this.unsubStore = null
      this.input.off('pointermove', this.onPointerMove, this)
      this.input.off('pointerdown', this.onPointerDown, this)
    })
  }

  override update(_time: number, delta: number): void {
    this.drawCauldronPreview()

    if (this.fogDirty) this.redrawFog()

    if (!this.movement) return
    const { waypoints, segIdx, speed } = this.movement
    if (segIdx >= waypoints.length - 1) return

    const a = waypoints[segIdx]
    const b = waypoints[segIdx + 1]
    const segLen = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)
    if (segLen === 0) {
      this.movement.segIdx++
      this.movement.segT = 0
      return
    }

    const nextT = this.movement.segT + (speed * (delta / 1000)) / segLen

    if (nextT >= 1) {
      this.movement.segIdx++
      this.movement.segT = 0
      this.playerPawn.setPosition(b.x, b.y)
      this.revealAround(b)
      this.checkPortalAt(b)
      this.checkHazardsAt(b)
      this.checkCollisions(b)
      if (!this.movement) return
      if (this.movement.segIdx >= waypoints.length - 1) {
        this.finishMovement(waypoints[waypoints.length - 1])
      }
    } else {
      this.movement.segT = nextT
      const px = Phaser.Math.Linear(a.x, b.x, nextT)
      const py = Phaser.Math.Linear(a.y, b.y, nextT)
      this.playerPawn.setPosition(px, py)
      const pos = { x: px, y: py }
      this.revealAround(pos)
      this.checkPortalAt(pos)
      this.checkHazardsAt(pos)
      this.checkCollisions(pos)
    }
  }

  private finishMovement(pos: Vec2): void {
    this.movement = null
    const store = useGameStore.getState()
    store.setPlayerPos({ x: pos.x, y: pos.y })
    store.consumePendingMovement()
  }

  private beginMovement(waypoints: Vec2[], speed: number): void {
    if (waypoints.length < 2) {
      useGameStore.getState().consumePendingMovement()
      return
    }
    this.movement = {
      waypoints,
      segIdx: 0,
      segT: 0,
      speed,
      hitHazards: new Set(),
    }
    this.previewGfx.clear()
  }

  private revealAround(pos: Vec2): void {
    const reach = Math.ceil(VISION_RADIUS / FOG_CELL) + 1
    const cx = Math.floor(pos.x / FOG_CELL)
    const cy = Math.floor(pos.y / FOG_CELL)
    const outer = VISION_RADIUS + VISION_FADE
    for (let dy = -reach - 3; dy <= reach + 3; dy++) {
      for (let dx = -reach - 3; dx <= reach + 3; dx++) {
        const col = cx + dx
        const row = cy + dy
        if (col < 0 || row < 0 || col >= FOG_COLS || row >= FOG_ROWS) continue
        const ccx = col * FOG_CELL + FOG_CELL / 2
        const ccy = row * FOG_CELL + FOG_CELL / 2
        const d = Math.hypot(ccx - pos.x, ccy - pos.y)
        const key = `${col},${row}`
        if (d <= VISION_RADIUS) {
          if (!this.revealedCells.has(key)) {
            this.revealedCells.add(key)
            this.edgeCells.delete(key)
            this.fogDirty = true
          }
        } else if (d <= outer) {
          if (!this.revealedCells.has(key) && !this.edgeCells.has(key)) {
            this.edgeCells.add(key)
            this.fogDirty = true
          }
        }
      }
    }
  }

  private redrawFog(): void {
    this.fogGfx.clear()
    for (let row = 0; row < FOG_ROWS; row++) {
      for (let col = 0; col < FOG_COLS; col++) {
        const key = `${col},${row}`
        if (this.revealedCells.has(key)) continue
        const alpha = this.edgeCells.has(key) ? FOG_ALPHA_EDGE : FOG_ALPHA
        this.fogGfx.fillStyle(FOG_COLOR, alpha)
        this.fogGfx.fillRect(
          col * FOG_CELL,
          row * FOG_CELL,
          FOG_CELL,
          FOG_CELL,
        )
      }
    }
    this.fogDirty = false
  }

  private drawPortals(): void {
    const portals = useGameStore.getState().portals
    this.portalGfx.clear()
    for (const p of portals) {
      this.drawPortalEnd(p, p.a)
      this.drawPortalEnd(p, p.b)
    }
  }

  private drawPortalEnd(_p: Portal, pos: Vec2): void {
    this.portalGfx.fillStyle(MAGIC_HEX, 1)
    this.portalGfx.fillCircle(pos.x, pos.y, _p.radius)
    this.portalGfx.lineStyle(3, INK_HEX, 1)
    this.portalGfx.strokeCircle(pos.x, pos.y, _p.radius)
    this.portalGfx.fillStyle(PAPER_HEX, 1)
    this.portalGfx.fillCircle(pos.x, pos.y, 4)
    this.portalGfx.lineStyle(2, INK_HEX, 1)
    this.portalGfx.strokeCircle(pos.x, pos.y, 4)
  }

  private drawHazards(): void {
    const hazards = useGameStore.getState().hazards
    this.hazardGfx.clear()
    for (const h of hazards) {
      this.drawHazard(h)
    }
  }

  private drawHazard(h: Hazard): void {
    const { x, y } = h.pos
    const r = h.radius
    this.hazardGfx.fillStyle(PAPER_HEX, 1)
    this.hazardGfx.fillRect(x - r - 2, y - r - 2, (r + 2) * 2, (r + 2) * 2)
    this.hazardGfx.lineStyle(3, INK_HEX, 1)
    this.hazardGfx.strokeRect(x - r - 2, y - r - 2, (r + 2) * 2, (r + 2) * 2)
    this.hazardGfx.lineStyle(3, ACCENT_HEX, 1)
    this.hazardGfx.beginPath()
    this.hazardGfx.moveTo(x - r + 2, y - r + 2)
    this.hazardGfx.lineTo(x + r - 2, y + r - 2)
    this.hazardGfx.moveTo(x + r - 2, y - r + 2)
    this.hazardGfx.lineTo(x - r + 2, y + r - 2)
    this.hazardGfx.strokePath()
  }

  private drawGrassTexture(): void {
    const gfx = this.add.graphics()
    gfx.setDepth(0)
    gfx.fillStyle(0xb8c8a0, 1)
    for (let y = 0; y < MAP_HEIGHT; y += 6) {
      for (let x = 0; x < MAP_WIDTH; x += 6) {
        gfx.fillRect(x, y, 1, 1)
      }
    }
    gfx.fillStyle(0xa8bb88, 1)
    for (let y = 3; y < MAP_HEIGHT; y += 6) {
      for (let x = 3; x < MAP_WIDTH; x += 6) {
        gfx.fillRect(x, y, 1, 1)
      }
    }
  }

  private renderCollectibles(): void {
    const list = useGameStore.getState().collectibles
    const currentIds = new Set(list.map((c) => c.id))

    for (const [id, sprite] of this.collectibleSprites) {
      if (!currentIds.has(id)) {
        sprite.destroy()
        this.collectibleSprites.delete(id)
        this.collectibleLabels.get(id)?.destroy()
        this.collectibleLabels.delete(id)
      }
    }

    for (const c of list) {
      if (this.collectibleSprites.has(c.id)) continue
      const textureKey = `pkmn-${c.defId}`
      if (!this.textures.exists(textureKey)) continue
      const sprite = this.add.image(c.pos.x, c.pos.y, textureKey)
      sprite.setScale(1.4)
      sprite.setDepth(3)
      this.collectibleSprites.set(c.id, sprite)

      const label = this.add
        .text(c.pos.x, c.pos.y + 26, c.label.toUpperCase(), {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          color: '#524a72',
          letterSpacing: 2,
        })
        .setOrigin(0.5, 0)
      label.setDepth(3)
      this.collectibleLabels.set(c.id, label)
    }
  }

  private drawCauldronPreview(): void {
    if (this.movement) return
    const state = useGameStore.getState()
    this.previewGfx.clear()
    if (!state.cauldron) return
    const def = getIngredient(state.cauldron.ingredientId)
    if (!def) return

    const fullRotated = transformPath(
      def.path,
      state.playerPos,
      state.aimAngle,
    )

    if (fullRotated.length >= 2) {
      this.previewGfx.lineStyle(2, def.color, 0.25)
      this.previewGfx.beginPath()
      this.previewGfx.moveTo(fullRotated[0].x, fullRotated[0].y)
      for (let i = 1; i < fullRotated.length; i++) {
        this.previewGfx.lineTo(fullRotated[i].x, fullRotated[i].y)
      }
      this.previewGfx.strokePath()
      const ghostEnd = fullRotated[fullRotated.length - 1]
      this.previewGfx.fillStyle(def.color, 0.3)
      this.previewGfx.fillCircle(ghostEnd.x, ghostEnd.y, 5)
    }

    if (state.cauldron.grind > 0) {
      const sliced = slicePathByFraction(def.path, state.cauldron.grind)
      if (sliced.length >= 2) {
        const ground = transformPath(sliced, state.playerPos, state.aimAngle)
        this.previewGfx.lineStyle(3, def.color, 0.95)
        this.previewGfx.beginPath()
        this.previewGfx.moveTo(ground[0].x, ground[0].y)
        for (let i = 1; i < ground.length; i++) {
          this.previewGfx.lineTo(ground[i].x, ground[i].y)
        }
        this.previewGfx.strokePath()
        const end = ground[ground.length - 1]
        this.previewGfx.fillStyle(def.color, 1)
        this.previewGfx.fillCircle(end.x, end.y, 6)
      }
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.movement) return
    if (!pointer.isDown) return
    this.aimAt(pointer.x, pointer.y)
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.movement) return
    this.aimAt(pointer.x, pointer.y)
  }

  private aimAt(x: number, y: number): void {
    const state = useGameStore.getState()
    const origin = state.playerPos
    const angle = Math.atan2(y - origin.y, x - origin.x)
    state.setAim(angle)
  }

  private checkCollisions(pos: Vec2): void {
    const store = useGameStore.getState()
    for (const c of store.collectibles) {
      if (overlaps(pos, c.pos, c.radius)) {
        store.collectItem(c.id)
      }
    }
  }

  private checkPortalAt(pos: Vec2): void {
    if (!this.movement) return
    const portals = useGameStore.getState().portals
    for (const p of portals) {
      if (overlaps(pos, p.a, p.radius)) {
        this.teleport(p.b)
        return
      }
      if (overlaps(pos, p.b, p.radius)) {
        this.teleport(p.a)
        return
      }
    }
  }

  private teleport(target: Vec2): void {
    if (!this.movement) return
    this.playerPawn.setPosition(target.x, target.y)
    this.cameras.main.flash(180, 180, 110, 240)
    this.revealAround(target)
    this.finishMovement(target)
  }

  private checkHazardsAt(pos: Vec2): void {
    if (!this.movement) return
    const hazards = useGameStore.getState().hazards
    for (const h of hazards) {
      if (this.movement.hitHazards.has(h.id)) continue
      if (overlaps(pos, h.pos, h.radius)) {
        this.movement.hitHazards.add(h.id)
        useGameStore.getState().damageFromHazard()
        this.cameras.main.shake(160, 0.008)
        this.cameras.main.flash(120, 255, 60, 60)
      }
    }
  }
}

function overlaps(a: Vec2, b: Vec2, radius: number): boolean {
  const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)
  return d < radius + PLAYER_RADIUS
}
