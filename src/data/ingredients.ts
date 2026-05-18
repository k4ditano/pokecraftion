import type { IngredientDef, Vec2 } from '../game/types'

function generateSCurve(
  length: number,
  amplitude: number,
  samples: number,
  axis: 'x' | 'y' = 'x',
): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const along = t * length
    const wave = Math.sin(t * Math.PI * 2) * amplitude
    out.push(axis === 'x' ? { x: along, y: wave } : { x: wave, y: along })
  }
  return out
}

function generateArc(
  length: number,
  peak: number,
  samples: number,
  axis: 'x' | 'y' = 'x',
): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const along = t * length
    const arc = 4 * peak * t * (1 - t)
    out.push(axis === 'x' ? { x: along, y: arc } : { x: arc, y: along })
  }
  return out
}

function generateZigzag(
  length: number,
  amplitude: number,
  zigs: number,
  samples: number,
): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const x = t * length
    const phase = t * zigs * 2
    const y = (Math.abs(phase % 2 - 1) * 2 - 1) * amplitude
    out.push({ x, y })
  }
  return out
}

function rotatePath(path: Vec2[], radians: number): Vec2[] {
  const c = Math.cos(radians)
  const s = Math.sin(radians)
  return path.map((p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c }))
}

const SPRITE_BASE =
  'https://raw.githubusercontent.com/msikma/pokesprite/master/items'

// Each ingredient has a FIXED orientation. Player cannot rotate it.
// Difficulty = picking the right stone for the direction you need.

export const INGREDIENTS: Record<string, IngredientDef> = {
  straight: {
    id: 'straight',
    name: 'Menta Verde',
    color: 0x6cb054,
    // Straight line going EAST
    path: [
      { x: 0, y: 0 },
      { x: 150, y: 0 },
    ],
    sprite: `${SPRITE_BASE}/mint/speed.png`,
  },
  scurve: {
    id: 'scurve',
    name: 'Menta Azul',
    color: 0x3a6a9c,
    // S-curve going SOUTH (vertical wave)
    path: generateSCurve(180, 44, 48, 'y'),
    sprite: `${SPRITE_BASE}/mint/defense.png`,
  },
  jump: {
    id: 'jump',
    name: 'Menta Roja',
    color: 0xcf4640,
    // Parabolic arc launching NORTH-WEST (up + left)
    path: rotatePath(generateArc(170, -85, 36), Math.PI * 0.75),
    sprite: `${SPRITE_BASE}/mint/attack.png`,
  },
  thunder: {
    id: 'thunder',
    name: 'Menta Aqua',
    color: 0x4ac9d4,
    // Zigzag going EAST with sharp Y oscillation
    path: generateZigzag(180, 38, 4, 48),
    sprite: `${SPRITE_BASE}/mint/special-attack.png`,
  },
  moon: {
    id: 'moon',
    name: 'Menta Rosa',
    color: 0xe89bc4,
    // Parabolic arc launching SOUTH-WEST (down + left)
    path: rotatePath(generateArc(170, -85, 36), Math.PI * 1.25),
    sprite: `${SPRITE_BASE}/mint/special-defense.png`,
  },
}

export function getIngredient(id: string): IngredientDef | undefined {
  return INGREDIENTS[id]
}
