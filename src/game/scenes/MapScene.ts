import Phaser from 'phaser'
import { useGameStore } from '../../state/gameStore'
import { getIngredient } from '../../data/ingredients'
import { spriteUrlFor } from '../../services/pokeapi'
import type { Collectible, Vec2 } from '../types'

const PLAYER_RADIUS = 14
const MOVE_SPEED = 220

interface Movement {
  waypoints: Vec2[]
  segIdx: number
  segT: number
}

export class MapScene extends Phaser.Scene {
  private playerPawn!: Phaser.GameObjects.Arc
  private previewGfx!: Phaser.GameObjects.Graphics
  private collectibleSprites = new Map<string, Phaser.GameObjects.Image>()
  private collectibleLabels = new Map<string, Phaser.GameObjects.Text>()
  private movement: Movement | null = null
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
    this.cameras.main.setBackgroundColor('#1f2a1a')

    const { width } = this.scale
    this.add
      .text(width / 2, 24, 'MAPA — selecciona ingrediente y apunta', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5, 0)

    this.previewGfx = this.add.graphics()
    this.renderCollectibles()

    const start = useGameStore.getState().playerPos
    this.playerPawn = this.add.circle(
      start.x,
      start.y,
      PLAYER_RADIUS,
      0xffeb3b,
    )
    this.playerPawn.setStrokeStyle(3, 0x000000)
    this.playerPawn.setDepth(10)

    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerdown', this.onPointerDown, this)

    this.unsubStore = useGameStore.subscribe((state, prev) => {
      if (state.collectibles !== prev.collectibles) this.renderCollectibles()
      if (state.playerPos !== prev.playerPos && !this.movement) {
        this.playerPawn.setPosition(state.playerPos.x, state.playerPos.y)
      }
      if (state.selectedIngredientId !== prev.selectedIngredientId) {
        if (!state.selectedIngredientId) this.previewGfx.clear()
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
    if (!this.movement) return
    const { waypoints, segIdx } = this.movement
    if (segIdx >= waypoints.length - 1) return

    const a = waypoints[segIdx]
    const b = waypoints[segIdx + 1]
    const segLen = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)
    if (segLen === 0) {
      this.movement.segIdx++
      this.movement.segT = 0
      return
    }

    const nextT = this.movement.segT + (MOVE_SPEED * (delta / 1000)) / segLen

    if (nextT >= 1) {
      this.movement.segIdx++
      this.movement.segT = 0
      this.playerPawn.setPosition(b.x, b.y)
      this.checkCollisions(b)
      if (this.movement.segIdx >= waypoints.length - 1) {
        const last = waypoints[waypoints.length - 1]
        this.movement = null
        useGameStore.getState().setPlayerPos({ x: last.x, y: last.y })
      }
    } else {
      this.movement.segT = nextT
      const px = Phaser.Math.Linear(a.x, b.x, nextT)
      const py = Phaser.Math.Linear(a.y, b.y, nextT)
      this.playerPawn.setPosition(px, py)
      this.checkCollisions({ x: px, y: py })
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
      sprite.setScale(2)
      this.collectibleSprites.set(c.id, sprite)

      const label = this.add
        .text(c.pos.x, c.pos.y + 36, c.label, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#dddddd',
        })
        .setOrigin(0.5, 0)
      this.collectibleLabels.set(c.id, label)
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.movement) return
    const state = useGameStore.getState()
    const selectedId = state.selectedIngredientId
    if (!selectedId) {
      this.previewGfx.clear()
      return
    }
    const def = getIngredient(selectedId)
    if (!def) return

    const origin = state.playerPos
    const angle = Math.atan2(pointer.y - origin.y, pointer.x - origin.x)
    this.drawPreview(origin, def.path, angle, def.color)
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.movement) return
    const state = useGameStore.getState()
    const selectedId = state.selectedIngredientId
    if (!selectedId) return
    const def = getIngredient(selectedId)
    if (!def) return

    const origin = state.playerPos
    const angle = Math.atan2(pointer.y - origin.y, pointer.x - origin.x)
    const waypoints = transformPath(def.path, origin, angle)

    this.previewGfx.clear()
    state.consumeIngredient(selectedId)
    this.movement = { waypoints, segIdx: 0, segT: 0 }
  }

  private drawPreview(
    origin: Vec2,
    path: Vec2[],
    angle: number,
    color: number,
  ): void {
    const waypoints = transformPath(path, origin, angle)
    this.previewGfx.clear()
    this.previewGfx.lineStyle(3, color, 0.85)
    this.previewGfx.beginPath()
    this.previewGfx.moveTo(waypoints[0].x, waypoints[0].y)
    for (let i = 1; i < waypoints.length; i++) {
      this.previewGfx.lineTo(waypoints[i].x, waypoints[i].y)
    }
    this.previewGfx.strokePath()

    const end = waypoints[waypoints.length - 1]
    this.previewGfx.fillStyle(color, 1)
    this.previewGfx.fillCircle(end.x, end.y, 6)
  }

  private checkCollisions(pos: Vec2): void {
    const collectibles = useGameStore.getState().collectibles
    const store = useGameStore.getState()
    for (const c of collectibles) {
      if (overlaps(pos, c)) {
        store.collectItem(c.id)
      }
    }
  }
}

function overlaps(pos: Vec2, c: Collectible): boolean {
  const d = Phaser.Math.Distance.Between(pos.x, pos.y, c.pos.x, c.pos.y)
  return d < c.radius + PLAYER_RADIUS
}

function transformPath(path: Vec2[], origin: Vec2, angle: number): Vec2[] {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return path.map((p) => ({
    x: origin.x + p.x * cos - p.y * sin,
    y: origin.y + p.x * sin + p.y * cos,
  }))
}
