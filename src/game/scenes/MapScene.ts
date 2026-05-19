import Phaser from 'phaser'
import { useGameStore } from '../../state/gameStore'
import { getIngredient, INGREDIENTS } from '../../data/ingredients'
import { getSeed } from '../../data/seeds'
import { spriteUrlFor } from '../../services/pokeapi'
import { slicePathByFraction, transformPath } from '../pathUtils'
import {
  MAP_CENTER,
  MAP_HEIGHT,
  MAP_WIDTH,
} from '../../data/map'
import { STARTER_DECOR } from '../../data/starter'
import type { Portal, Vec2 } from '../types'

const PLAYER_RADIUS = 9
const FOG_CELL = 14
const FOG_COLS = Math.ceil(MAP_WIDTH / FOG_CELL)
const FOG_ROWS = Math.ceil(MAP_HEIGHT / FOG_CELL)
const VISION_RADIUS = 220
const VISION_FADE_INNER = 35
const VISION_FADE_OUTER = 75
// Pixel palette (sketchy.jsx pixel mode)
const FOG_COLOR = 0x2a2540
const FOG_ALPHA = 1.0
const FOG_ALPHA_EDGE_INNER = 0.6
const FOG_ALPHA_EDGE_OUTER = 0.88
const BG_HEX = '#d8e3c4'
const INK_HEX = 0x2a2540
const PAPER_HEX = 0xfff5dc
const MAGIC_HEX = 0x7c5cc4

interface ActiveMovement {
  waypoints: Vec2[]
  segIdx: number
  segT: number
  speed: number
  hitHazards: Set<string>
}

export class MapScene extends Phaser.Scene {
  private playerPawn!: Phaser.GameObjects.Image
  private centerMarker!: Phaser.GameObjects.Image
  private previewGfx!: Phaser.GameObjects.Graphics
  private fogGfx!: Phaser.GameObjects.Graphics
  private hazardGfx!: Phaser.GameObjects.Graphics
  private portalGfx!: Phaser.GameObjects.Graphics
  private revealedCells = new Set<string>()
  private edgeInnerCells = new Set<string>()
  private edgeOuterCells = new Set<string>()
  private fogDirty = true
  private trailGfx!: Phaser.GameObjects.Graphics
  private trail: Vec2[] = []
  private trailLastTs = 0
  private collectibleSprites = new Map<string, Phaser.GameObjects.Image>()
  private collectibleLabels = new Map<string, Phaser.GameObjects.Text>()
  private plotContainers = new Map<string, Phaser.GameObjects.Container>()
  private movement: ActiveMovement | null = null
  private waterAcc = 0
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
      } else if (c.kind === 'item') {
        this.load.image(
          `item-${c.defId}`,
          `https://raw.githubusercontent.com/msikma/pokesprite/master/items/medicine/${c.defId}.png`,
        )
      }
    }
    for (const id of Object.keys(INGREDIENTS)) {
      const def = INGREDIENTS[id]
      if (def.sprite) this.load.image(`mint-${id}`, def.sprite)
    }
    this.load.image('pawn', '/assets/mapcell-0.png')
    this.load.image('pozo', '/assets/mapcell-1.png')
    this.load.image('plot-dirt', '/assets/mapcell-2.png')
    this.load.image('plot-sap-1', '/assets/mapcell-3.png')
    this.load.image('plot-sap-2', '/assets/mapcell-4.png')
    this.load.image('plot-ripe', '/assets/mapcell-5.png')
    for (let i = 0; i < 6; i++) {
      this.load.image(`bone-${i}`, `/assets/bone-${i}.png`)
    }
    for (let i = 0; i < 16; i++) {
      this.load.image(`decor-${i}`, `/assets/decor-${i}.png`)
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

    this.centerMarker = this.add.image(MAP_CENTER.x, MAP_CENTER.y, 'pozo')
    this.centerMarker.setScale(0.32)
    this.centerMarker.setDepth(1)
    this.add
      .text(MAP_CENTER.x, MAP_CENTER.y + 58, 'pozo', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
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

    // Decorations scattered across the map (under everything else)
    for (const d of STARTER_DECOR) {
      const tex = `decor-${d.sprite}`
      if (this.textures.exists(tex)) {
        const sprite = this.add.image(d.pos.x, d.pos.y, tex)
        sprite.setScale(d.scale ?? 0.16)
        sprite.setDepth(1)
      }
    }

    // Pawn trail (under preview but above everything else map-side)
    this.trailGfx = this.add.graphics()
    this.trailGfx.setDepth(7)

    this.renderPlots()

    this.renderCollectibles()

    this.fogGfx = this.add.graphics()
    this.fogGfx.setDepth(8)

    this.previewGfx = this.add.graphics()
    this.previewGfx.setDepth(9)

    const start = useGameStore.getState().playerPos
    this.playerPawn = this.add.image(start.x, start.y, 'pawn')
    this.playerPawn.setScale(0.18)
    this.playerPawn.setDepth(10)

    this.revealAround(start)
    this.redrawFog()

    // No pointer aim — ingredient paths are fixed orientations

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
    })
  }

  override update(time: number, delta: number): void {
    this.drawCauldronPreview()
    this.renderPlots()
    this.updateTrail(time)

    if (this.fogDirty) this.redrawFog()

    if (!this.movement && useGameStore.getState().isWatering) {
      this.tickWaterFlow(delta)
      return
    }

    if (!this.movement) return

    // Hold-to-pour: abort ingredient movement when user releases.
    // Water movement runs to completion (single discrete step).
    const store = useGameStore.getState()
    if (
      store.pendingMovement?.kind === 'ingredient' &&
      !store.isPouring
    ) {
      const cur = { x: this.playerPawn.x, y: this.playerPawn.y }
      this.finishMovement(cur)
      return
    }

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

  private tickWaterFlow(delta: number): void {
    const store = useGameStore.getState()
    if (store.water <= 0) {
      store.stopWaterFlow()
      this.waterAcc = 0
      return
    }
    const dt = delta / 1000
    const pawnX = this.playerPawn.x
    const pawnY = this.playerPawn.y
    const dx = MAP_CENTER.x - pawnX
    const dy = MAP_CENTER.y - pawnY
    const d = Math.hypot(dx, dy)
    if (d > 2) {
      const speed = 32
      const step = Math.min(speed * dt, d)
      const nx = pawnX + (dx / d) * step
      const ny = pawnY + (dy / d) * step
      this.playerPawn.setPosition(nx, ny)
      this.revealAround({ x: nx, y: ny })
      this.checkHazardsAt({ x: nx, y: ny })
      store.setPlayerPos({ x: nx, y: ny })
    }
    this.waterAcc += dt
    if (this.waterAcc >= 2.4) {
      const units = Math.floor(this.waterAcc / 2.4)
      this.waterAcc -= units * 2.4
      store.consumeWater(units)
    }
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
    const inner = VISION_RADIUS + VISION_FADE_INNER
    const outer = inner + VISION_FADE_OUTER
    const extra = Math.ceil((VISION_FADE_INNER + VISION_FADE_OUTER) / FOG_CELL)
    for (let dy = -reach - extra; dy <= reach + extra; dy++) {
      for (let dx = -reach - extra; dx <= reach + extra; dx++) {
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
            this.edgeInnerCells.delete(key)
            this.edgeOuterCells.delete(key)
            this.fogDirty = true
          }
        } else if (d <= inner) {
          if (!this.revealedCells.has(key) && !this.edgeInnerCells.has(key)) {
            this.edgeInnerCells.add(key)
            this.edgeOuterCells.delete(key)
            this.fogDirty = true
          }
        } else if (d <= outer) {
          if (
            !this.revealedCells.has(key) &&
            !this.edgeInnerCells.has(key) &&
            !this.edgeOuterCells.has(key)
          ) {
            this.edgeOuterCells.add(key)
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
        let alpha = FOG_ALPHA
        if (this.edgeInnerCells.has(key)) alpha = FOG_ALPHA_EDGE_INNER
        else if (this.edgeOuterCells.has(key)) alpha = FOG_ALPHA_EDGE_OUTER
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
    let i = 0
    for (const h of hazards) {
      const variant = simpleHash(h.id) % 6
      const tex = `bone-${variant}`
      if (this.textures.exists(tex)) {
        const sprite = this.add.image(h.pos.x, h.pos.y, tex)
        sprite.setScale(0.09 + (i % 3) * 0.01)
        sprite.setRotation((h.angle ?? 0) + Math.PI / 2)
        sprite.setDepth(2)
      } else {
        // fallback ink dot
        this.hazardGfx.fillStyle(INK_HEX, 1)
        this.hazardGfx.fillCircle(h.pos.x, h.pos.y, 6)
      }
      i++
    }
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
      const textureKey =
        c.kind === 'pokemon' ? `pkmn-${c.defId}` : `item-${c.defId}`
      if (!this.textures.exists(textureKey)) continue
      const sprite = this.add.image(c.pos.x, c.pos.y, textureKey)
      sprite.setScale(c.kind === 'pokemon' ? 1.0 : 1.6)
      sprite.setDepth(3)
      if (c.kind === 'item') {
        this.tweens.add({
          targets: sprite,
          y: c.pos.y - 4,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }
      this.collectibleSprites.set(c.id, sprite)

      const label = this.add
        .text(c.pos.x, c.pos.y + 22, c.label.toUpperCase(), {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '11px',
          color: '#524a72',
          letterSpacing: 2,
        })
        .setOrigin(0.5, 0)
      label.setDepth(3)
      this.collectibleLabels.set(c.id, label)
    }
  }

  private drawCauldronPreview(): void {
    const state = useGameStore.getState()
    this.previewGfx.clear()
    if (!state.cauldron) return
    const def = getIngredient(state.cauldron.ingredientId)
    if (!def) return

    // While pouring, the active path is locked in this.movement.waypoints.
    if (this.movement) {
      this.drawDashed(this.movement.waypoints, 0x000000, 1, 7, 12, 8)
      const last = this.movement.waypoints[this.movement.waypoints.length - 1]
      this.previewGfx.fillStyle(0x000000, 1)
      this.previewGfx.fillCircle(last.x, last.y, 7)
      return
    }

    const fullPath = transformPath(def.path, state.playerPos, 0)

    if (fullPath.length >= 2) {
      this.drawDashed(fullPath, 0x000000, 0.45, 5, 10, 8)
      const ghostEnd = fullPath[fullPath.length - 1]
      this.previewGfx.fillStyle(0x000000, 0.5)
      this.previewGfx.fillCircle(ghostEnd.x, ghostEnd.y, 6)
    }

    if (state.cauldron.grind > 0) {
      const sliced = slicePathByFraction(def.path, state.cauldron.grind)
      if (sliced.length >= 2) {
        const ground = transformPath(sliced, state.playerPos, 0)
        this.drawDashed(ground, 0x000000, 1, 7, 12, 8)
        const end = ground[ground.length - 1]
        this.previewGfx.fillStyle(0x000000, 1)
        this.previewGfx.fillCircle(end.x, end.y, 7)
      }
    }
  }

  private drawDashed(
    pts: Vec2[],
    color: number,
    alpha: number,
    width: number,
    dashLen: number,
    gapLen: number,
  ): void {
    if (pts.length < 2) return
    this.previewGfx.lineStyle(width, color, alpha)
    const period = dashLen + gapLen
    let phase = 0
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy)
      if (len === 0) continue
      const nx = dx / len
      const ny = dy / len
      let d = -phase
      while (d < len) {
        const start = Math.max(0, d)
        const end = Math.min(d + dashLen, len)
        if (end > start) {
          this.previewGfx.beginPath()
          this.previewGfx.moveTo(a.x + nx * start, a.y + ny * start)
          this.previewGfx.lineTo(a.x + nx * end, a.y + ny * end)
          this.previewGfx.strokePath()
        }
        d += period
      }
      phase = ((phase + len) % period + period) % period
    }
  }

  private checkCollisions(pos: Vec2): void {
    const store = useGameStore.getState()
    for (const c of store.collectibles) {
      if (c.kind !== 'item') continue
      if (overlaps(pos, c.pos, c.radius)) {
        this.spawnSparkles(c.pos.x, c.pos.y, 0xfff5dc)
        store.collectItem(c.id)
      }
    }
  }

  private renderPlots(): void {
    const state = useGameStore.getState()
    const now = performance.now()
    for (const plot of state.plots) {
      let c = this.plotContainers.get(plot.id)
      if (!c) {
        c = this.add.container(plot.pos.x, plot.pos.y)
        c.setDepth(2)
        c.setSize(60, 60)
        c.setInteractive(
          new Phaser.Geom.Rectangle(-30, -30, 60, 60),
          Phaser.Geom.Rectangle.Contains,
        )
        c.on('pointerdown', () => this.handlePlotClick(plot.id))
        if (this.textures.exists('plot-dirt')) {
          const dirt = this.add.image(0, 0, 'plot-dirt')
          dirt.setScale(0.18)
          c.add(dirt)
        } else {
          const dirt = this.add.rectangle(0, 0, 52, 52, 0x8b5a2b)
          dirt.setStrokeStyle(3, INK_HEX)
          c.add(dirt)
        }
        this.plotContainers.set(plot.id, c)
      }
      while (c.length > 1) c.removeAt(1, true)

      if (plot.seedId && plot.plantedAtMs != null) {
        const seed = getSeed(plot.seedId)
        if (!seed) continue
        const growth = Math.min(1, (now - plot.plantedAtMs) / seed.growthMs)
        const ing = getIngredient(seed.ingredientId)
        if (growth >= 1) {
          const tex = `mint-${seed.ingredientId}`
          if (this.textures.exists(tex)) {
            const sprite = this.add.image(0, -6, tex)
            sprite.setScale(2)
            c.add(sprite)
            const glow = this.add.circle(0, -2, 28, ing?.color ?? 0xffffff, 0.22)
            c.addAt(glow, 0)
          }
        } else {
          // Sapling — use sap-1 then sap-2 based on growth
          const stage = growth > 0.5 ? 'plot-sap-2' : 'plot-sap-1'
          if (this.textures.exists(stage)) {
            const sap = this.add.image(0, -4, stage)
            sap.setScale(0.13 + 0.05 * growth)
            c.add(sap)
          } else {
            const r = 4 + 10 * growth
            const sap = this.add.circle(0, 6 - 4 * growth, r, ing?.color ?? 0x4a8a3d)
            sap.setStrokeStyle(2, INK_HEX)
            c.add(sap)
          }
          // Occasionally drift a tiny growth sparkle upward
          if (Math.random() < 0.012) {
            this.spawnGrowSparkle(
              plot.pos.x + (Math.random() - 0.5) * 26,
              plot.pos.y - 4,
              ing?.color ?? 0x4a8a3d,
            )
          }
        }
      } else {
        // Empty + has seeds → show "+" hint
        const hasSeeds = Object.values(state.seeds).some((q) => q > 0)
        if (hasSeeds) {
          const plus = this.add.text(0, 0, '+', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: '#fff5dc',
            stroke: '#2a2540',
            strokeThickness: 3,
          })
          plus.setOrigin(0.5)
          c.add(plus)
        }
      }
    }
  }

  private spawnGrowSparkle(x: number, y: number, color: number): void {
    const sp = this.add.circle(x, y, 2, color)
    sp.setStrokeStyle(1, 0x2a2540)
    sp.setDepth(13)
    this.tweens.add({
      targets: sp,
      y: y - 28,
      alpha: 0,
      duration: 850 + Math.random() * 200,
      ease: 'Cubic.easeOut',
      onComplete: () => sp.destroy(),
    })
  }

  private handlePlotClick(plotId: string): void {
    const state = useGameStore.getState()
    const plot = state.plots.find((p) => p.id === plotId)
    if (!plot) return
    if (plot.seedId && plot.plantedAtMs != null) {
      const seed = getSeed(plot.seedId)
      if (!seed) return
      const ripe = performance.now() - plot.plantedAtMs >= seed.growthMs
      if (ripe) {
        const ing = getIngredient(seed.ingredientId)
        this.spawnSparkles(plot.pos.x, plot.pos.y, ing?.color ?? 0xffeb3b)
        state.harvestPlot(plotId)
      }
      return
    }
    // Empty plot — plant first available seed
    const firstSeedId = Object.keys(state.seeds).find(
      (id) => (state.seeds[id] ?? 0) > 0,
    )
    if (firstSeedId) state.plantSeed(plotId, firstSeedId)
  }

  private spawnSparkles(x: number, y: number, color: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3
      const dist = 40 + Math.random() * 30
      const sp = this.add.circle(x, y, 4, color)
      sp.setStrokeStyle(2, 0x2a2540)
      sp.setDepth(15)
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 600 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => sp.destroy(),
      })
    }
  }

  private updateTrail(time: number): void {
    if (this.movement) {
      if (time - this.trailLastTs > 28) {
        this.trailLastTs = time
        this.trail.push({ x: this.playerPawn.x, y: this.playerPawn.y })
        if (this.trail.length > 30) this.trail.shift()
      }
    } else if (this.trail.length > 0) {
      // Fade out tail after movement ends
      if (time - this.trailLastTs > 30) {
        this.trailLastTs = time
        this.trail.shift()
      }
    }
    this.trailGfx.clear()
    const n = this.trail.length
    if (n < 2) return
    for (let i = 1; i < n; i++) {
      const a = this.trail[i - 1]
      const b = this.trail[i]
      const alpha = (i / n) * 0.55
      this.trailGfx.lineStyle(4, 0x2a2540, alpha)
      this.trailGfx.beginPath()
      this.trailGfx.moveTo(a.x, a.y)
      this.trailGfx.lineTo(b.x, b.y)
      this.trailGfx.strokePath()
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
    const src = { x: this.playerPawn.x, y: this.playerPawn.y }
    this.spawnPortalBurst(src.x, src.y)
    this.spawnPortalBurst(target.x, target.y)
    this.playerPawn.setPosition(target.x, target.y)
    this.cameras.main.flash(180, 180, 110, 240)
    this.revealAround(target)
    this.finishMovement(target)
  }

  private spawnPortalBurst(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.2
      const dist = 45 + Math.random() * 25
      const sp = this.add.circle(x, y, 5 + Math.random() * 3, 0x7c5cc4)
      sp.setStrokeStyle(2, 0x2a2540)
      sp.setDepth(16)
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 550 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => sp.destroy(),
      })
    }
  }

  private checkHazardsAt(pos: Vec2): void {
    const hazards = useGameStore.getState().hazards
    const hitSet = this.movement?.hitHazards
    for (const h of hazards) {
      if (hitSet && hitSet.has(h.id)) continue
      if (overlaps(pos, h.pos, h.radius)) {
        hitSet?.add(h.id)
        useGameStore.getState().damageFromHazard()
        this.cameras.main.shake(160, 0.008)
        this.cameras.main.flash(120, 255, 60, 60)
        this.spawnBoneFragments(h.pos.x, h.pos.y)
      }
    }
  }

  private spawnBoneFragments(x: number, y: number): void {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 22 + Math.random() * 30
      const sp = this.add.rectangle(x, y, 8, 5, 0xf6e8c3)
      sp.setStrokeStyle(2, 0x2a2540)
      sp.setDepth(15)
      sp.setRotation(Math.random() * Math.PI)
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        rotation: sp.rotation + (Math.random() - 0.5) * Math.PI * 2,
        duration: 480 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => sp.destroy(),
      })
    }
  }
}

function overlaps(a: Vec2, b: Vec2, radius: number): boolean {
  const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)
  return d < radius + PLAYER_RADIUS
}

function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
