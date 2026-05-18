import type { Collectible, Hazard, Portal, Vec2 } from '../game/types'
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

function arcHazards(
  center: Vec2,
  radius: number,
  startAngle: number,
  endAngle: number,
  count: number,
  hazardR = 14,
): Hazard[] {
  const out: Hazard[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const a = startAngle + (endAngle - startAngle) * t
    const jit = (Math.random() - 0.5) * 8
    out.push(
      makeHazard(
        {
          x: center.x + Math.cos(a) * (radius + jit),
          y: center.y + Math.sin(a) * (radius + jit),
        },
        hazardR,
        a + Math.PI / 2 + (Math.random() - 0.5) * 0.4,
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

function ringHazards(
  center: Vec2,
  radius: number,
  count: number,
  gaps: { angle: number; width: number }[] = [],
  hazardR = 14,
): Hazard[] {
  const out: Hazard[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    let skip = false
    for (const g of gaps) {
      let diff = Math.abs(a - g.angle)
      if (diff > Math.PI) diff = Math.PI * 2 - diff
      if (diff < g.width / 2) {
        skip = true
        break
      }
    }
    if (skip) continue
    out.push(
      makeHazard(
        {
          x: center.x + Math.cos(a) * radius,
          y: center.y + Math.sin(a) * radius,
        },
        hazardR,
        a + Math.PI / 2,
      ),
    )
  }
  return out
}

export const STARTER_INVENTORY: InventoryItem[] = [
  { id: 'straight', name: 'Hierba lineal', qty: 4 },
  { id: 'scurve', name: 'Baya curva', qty: 3 },
  { id: 'jump', name: 'Piedra salto', qty: 2 },
]

export const STARTER_PLAYER_POS = { ...MAP_CENTER }

export const STARTER_PORTALS: Portal[] = [
  {
    id: 'portal-1',
    a: { x: 220, y: 540 },
    b: { x: 1700, y: 540 },
    color: 0x7c5cc4,
    radius: 16,
  },
]

export const STARTER_HAZARDS: Hazard[] = [
  // Wall of bones between pozo and Bulbasaur (forces curve or jump)
  ...lineHazards({ x: 580, y: 380 }, { x: 760, y: 480 }, 6, 12),
  ...lineHazards({ x: 580, y: 700 }, { x: 760, y: 600 }, 6, 12),

  // Arc guarding Charmander (north of him, forces approach from south)
  ...arcHazards(
    { x: 1460, y: 300 },
    140,
    -Math.PI * 0.85,
    -Math.PI * 0.15,
    7,
    13,
  ),

  // Arc guarding Pikachu (south of him, forces approach from north)
  ...arcHazards(
    { x: 460, y: 780 },
    140,
    Math.PI * 0.15,
    Math.PI * 0.85,
    7,
    13,
  ),

  // Blob cluster near Squirtle — chaotic zone
  ...blobHazards({ x: 1320, y: 870 }, 90, 9, 12),

  // Scattered ring around pozo with 4 cardinal gaps
  ...ringHazards(
    { x: MAP_CENTER.x, y: MAP_CENTER.y },
    260,
    14,
    [
      { angle: 0, width: 1.0 },
      { angle: Math.PI / 2, width: 1.0 },
      { angle: Math.PI, width: 1.0 },
      { angle: -Math.PI / 2, width: 1.0 },
    ],
    12,
  ),

  // Diagonal bone-trail northeast quadrant
  ...lineHazards({ x: 1100, y: 200 }, { x: 1380, y: 80 }, 5, 10, 12),

  // Bone-blob in corner near Pidgey
  ...blobHazards({ x: 900, y: 100 }, 60, 5, 11),
]

export const STARTER_COLLECTIBLES: Collectible[] = [
  {
    id: 'col-1',
    kind: 'pokemon',
    defId: 1,
    label: 'Bulbasaur',
    pos: { x: 460, y: 300 },
    radius: 18,
  },
  {
    id: 'col-2',
    kind: 'pokemon',
    defId: 4,
    label: 'Charmander',
    pos: { x: 1460, y: 300 },
    radius: 18,
  },
  {
    id: 'col-3',
    kind: 'pokemon',
    defId: 7,
    label: 'Squirtle',
    pos: { x: 1460, y: 780 },
    radius: 18,
  },
  {
    id: 'col-4',
    kind: 'pokemon',
    defId: 25,
    label: 'Pikachu',
    pos: { x: 460, y: 780 },
    radius: 18,
  },
  {
    id: 'col-5',
    kind: 'pokemon',
    defId: 16,
    label: 'Pidgey',
    pos: { x: 960, y: 180 },
    radius: 18,
  },
  {
    id: 'col-6',
    kind: 'pokemon',
    defId: 19,
    label: 'Rattata',
    pos: { x: 960, y: 900 },
    radius: 18,
  },
]
