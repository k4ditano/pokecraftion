import type { Collectible, Hazard, Plot, Portal, Vec2 } from '../game/types'
import type { InventoryItem } from '../state/gameStore'
import { MAP_CENTER } from './map'

// ── Hazard pattern generators ──────────────────────────────────────────
// Hazards are bones scattered in patterns. Player must thread between
// them by choosing the right ingredient path. Each hazard checked for
// collision individually; clusters create gameplay-relevant zones.

let hazardIdCounter = 0
function nextHazardId(): string {
  return `haz-${++hazardIdCounter}`
}

function makeHazard(pos: Vec2, radius = 14, angle?: number): Hazard {
  return { id: nextHazardId(), pos, radius, angle }
}

function lineHazards(
  from: Vec2,
  to: Vec2,
  count: number,
  jitter = 8,
  radius = 14,
): Hazard[] {
  const out: Hazard[] = []
  const baseAngle = Math.atan2(to.y - from.y, to.x - from.x)
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const jx = (Math.random() - 0.5) * jitter * 2
    const jy = (Math.random() - 0.5) * jitter * 2
    out.push(
      makeHazard(
        {
          x: from.x + (to.x - from.x) * t + jx,
          y: from.y + (to.y - from.y) * t + jy,
        },
        radius,
        baseAngle + (Math.random() - 0.5) * 0.6,
      ),
    )
  }
  return out
}


function blobHazards(
  center: Vec2,
  spread: number,
  count: number,
  hazardR = 14,
): Hazard[] {
  const out: Hazard[] = []
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * spread
    out.push(
      makeHazard(
        { x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r },
        hazardR,
        Math.random() * Math.PI,
      ),
    )
  }
  return out
}

function spiralHazards(
  center: Vec2,
  startR: number,
  endR: number,
  turns: number,
  count: number,
  hazardR = 12,
): Hazard[] {
  const out: Hazard[] = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const a = t * Math.PI * 2 * turns
    const r = startR + (endR - startR) * t
    out.push(
      makeHazard(
        { x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r },
        hazardR,
        a,
      ),
    )
  }
  return out
}

function corridorHazards(
  from: Vec2,
  to: Vec2,
  count: number,
  width: number,
  hazardR = 12,
): Hazard[] {
  // Two parallel bone lines with given perpendicular width
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  if (len === 0) return []
  const nx = -dy / len
  const ny = dx / len
  const a = Math.atan2(dy, dx)
  const out: Hazard[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const cx = from.x + dx * t
    const cy = from.y + dy * t
    const jit = (Math.random() - 0.5) * 6
    out.push(
      makeHazard(
        { x: cx + nx * (width / 2) + jit, y: cy + ny * (width / 2) + jit },
        hazardR,
        a + Math.PI / 2,
      ),
    )
    out.push(
      makeHazard(
        { x: cx - nx * (width / 2) + jit, y: cy - ny * (width / 2) + jit },
        hazardR,
        a + Math.PI / 2,
      ),
    )
  }
  return out
}


export const STARTER_INVENTORY: InventoryItem[] = [
  { id: 'straight', name: 'Menta Verde', qty: 3 },
  { id: 'scurve', name: 'Menta Azul', qty: 3 },
  { id: 'jump', name: 'Menta Roja', qty: 2 },
  { id: 'thunder', name: 'Menta Aqua', qty: 2 },
  { id: 'moon', name: 'Menta Rosa', qty: 2 },
]

export const STARTER_PLAYER_POS = { ...MAP_CENTER }

export const STARTER_SEEDS: Record<string, number> = {
  'seed-straight': 2,
  'seed-scurve': 1,
}

export const STARTER_PLOTS: Plot[] = [
  // Always one within revealed area on spawn (≤200px from center)
  { id: 'plot-1', pos: { x: 1100, y: 480 } },
  // Scattered farther out, revealed via exploration
  { id: 'plot-2', pos: { x: 540, y: 760 } },
  { id: 'plot-3', pos: { x: 1380, y: 220 } },
  { id: 'plot-4', pos: { x: 380, y: 420 } },
]

export interface DecorDef {
  pos: Vec2
  sprite: number
  scale?: number
}

// Scattered decorations to break visual repetition. Positions avoid
// pozo, plots, portals, hazards and collectibles roughly.
export const STARTER_DECOR: DecorDef[] = [
  { pos: { x: 220, y: 260 }, sprite: 0 },   // grass tuft
  { pos: { x: 280, y: 970 }, sprite: 2 },   // rocks pile
  { pos: { x: 1700, y: 160 }, sprite: 4 },  // orange flower
  { pos: { x: 1820, y: 940 }, sprite: 6 },  // red mushroom
  { pos: { x: 1500, y: 980 }, sprite: 1 },  // pebble
  { pos: { x: 120, y: 460 }, sprite: 13 },  // fence
  { pos: { x: 1820, y: 480 }, sprite: 9 },  // log
  { pos: { x: 1420, y: 870 }, sprite: 10 }, // leaves pile
  { pos: { x: 200, y: 700 }, sprite: 5 },   // purple flower
  { pos: { x: 1180, y: 200 }, sprite: 12 }, // bramble berries
  { pos: { x: 880, y: 980 }, sprite: 7 },   // brown mushroom
  { pos: { x: 100, y: 900 }, sprite: 14 },  // acorns
  { pos: { x: 1750, y: 660 }, sprite: 3 },  // stump
  { pos: { x: 460, y: 980 }, sprite: 15 },  // fog wisp
  { pos: { x: 1740, y: 380 }, sprite: 0 },  // grass tuft
  { pos: { x: 180, y: 160 }, sprite: 5 },   // purple flower
  { pos: { x: 1340, y: 1000 }, sprite: 11 },// puddle
  { pos: { x: 660, y: 200 }, sprite: 14 },  // acorns
]

export const STARTER_PORTALS: Portal[] = [
  {
    id: 'portal-1',
    a: { x: 480, y: 540 },
    b: { x: 1440, y: 540 },
    color: 0x7c5cc4,
    radius: 14,
  },
]

const BONE_R = 7

export const STARTER_HAZARDS: Hazard[] = [
  // Two dense corner blobs (NW + SE) — long-distance gravity wells
  ...blobHazards({ x: 340, y: 220 }, 130, 50, BONE_R),
  ...blobHazards({ x: 1580, y: 880 }, 130, 50, BONE_R),

  // Spiral cluster top-right — forces curve to enter Charmander side
  ...spiralHazards({ x: 1480, y: 280 }, 40, 130, 1.5, 22, BONE_R),

  // Spiral cluster bottom-left — same opposite
  ...spiralHazards({ x: 380, y: 800 }, 40, 130, 1.5, 22, BONE_R),

  // Horizontal corridor blocking east-west traffic at mid-north
  ...corridorHazards({ x: 700, y: 320 }, { x: 1220, y: 320 }, 8, 36, BONE_R),
  // Horizontal corridor blocking east-west traffic at mid-south
  ...corridorHazards({ x: 700, y: 760 }, { x: 1220, y: 760 }, 8, 36, BONE_R),

  // Vertical line east of pozo
  ...lineHazards({ x: 1140, y: 420 }, { x: 1140, y: 660 }, 8, 8, BONE_R),
  // Vertical line west of pozo
  ...lineHazards({ x: 780, y: 420 }, { x: 780, y: 660 }, 8, 8, BONE_R),

  // Small mid-blobs centred between pozo and corners
  ...blobHazards({ x: 1280, y: 580 }, 36, 12, BONE_R),
  ...blobHazards({ x: 640, y: 580 }, 36, 12, BONE_R),

  // Sparse scatter at top edge
  ...blobHazards({ x: 960, y: 130 }, 220, 10, BONE_R),
  // Sparse scatter at bottom edge
  ...blobHazards({ x: 960, y: 970 }, 220, 10, BONE_R),
]

export const STARTER_COLLECTIBLES: Collectible[] = [
  {
    id: 'col-1',
    kind: 'pokemon',
    defId: 1,
    label: 'Bulbasaur',
    pos: { x: 700, y: 380 },
    radius: 18,
  },
  {
    id: 'col-2',
    kind: 'pokemon',
    defId: 4,
    label: 'Charmander',
    pos: { x: 1220, y: 380 },
    radius: 18,
  },
  {
    id: 'col-3',
    kind: 'pokemon',
    defId: 7,
    label: 'Squirtle',
    pos: { x: 1220, y: 700 },
    radius: 18,
  },
  {
    id: 'col-4',
    kind: 'pokemon',
    defId: 25,
    label: 'Pikachu',
    pos: { x: 700, y: 700 },
    radius: 18,
  },
  {
    id: 'col-5',
    kind: 'pokemon',
    defId: 16,
    label: 'Pidgey',
    pos: { x: 960, y: 260 },
    radius: 18,
  },
  {
    id: 'col-6',
    kind: 'pokemon',
    defId: 19,
    label: 'Rattata',
    pos: { x: 960, y: 820 },
    radius: 18,
  },
  // Rare candies — level up lowest party member
  {
    id: 'candy-1',
    kind: 'item',
    defId: 'rare-candy',
    label: 'Caramelo',
    pos: { x: 820, y: 540 },
    radius: 16,
  },
  {
    id: 'candy-2',
    kind: 'item',
    defId: 'rare-candy',
    label: 'Caramelo',
    pos: { x: 1100, y: 540 },
    radius: 16,
  },
]
