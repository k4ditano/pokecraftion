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
  // Four dense corner blobs — solid bone walls in each quadrant
  ...blobHazards({ x: 380, y: 220 }, 130, 55, BONE_R),
  ...blobHazards({ x: 1540, y: 220 }, 130, 55, BONE_R),
  ...blobHazards({ x: 380, y: 860 }, 120, 50, BONE_R),
  ...blobHazards({ x: 1540, y: 860 }, 120, 50, BONE_R),

  // Vertical pillar between pozo and Bulbasaur — forces curve
  ...blobHazards({ x: 830, y: 540 }, 50, 22, BONE_R),
  // Vertical pillar between pozo and Charmander
  ...blobHazards({ x: 1090, y: 540 }, 50, 22, BONE_R),

  // Top-center blob blocks direct north access
  ...blobHazards({ x: 960, y: 420 }, 55, 24, BONE_R),
  // Bottom-center blob blocks direct south access
  ...blobHazards({ x: 960, y: 660 }, 55, 24, BONE_R),

  // Diagonal trails connecting corner blobs (curve through them)
  ...lineHazards({ x: 540, y: 360 }, { x: 700, y: 320 }, 10, 6, BONE_R),
  ...lineHazards({ x: 1420, y: 360 }, { x: 1260, y: 320 }, 10, 6, BONE_R),
  ...lineHazards({ x: 540, y: 720 }, { x: 700, y: 760 }, 10, 6, BONE_R),
  ...lineHazards({ x: 1420, y: 720 }, { x: 1260, y: 760 }, 10, 6, BONE_R),

  // Two corridor blocks near Pidgey/Rattata
  ...blobHazards({ x: 820, y: 260 }, 40, 14, BONE_R),
  ...blobHazards({ x: 1100, y: 820 }, 40, 14, BONE_R),
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
]
