import type { IngredientDef, Vec2 } from '../game/types'

function generateSCurve(
  length: number,
  amplitude: number,
  samples: number,
): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    out.push({ x: t * length, y: Math.sin(t * Math.PI * 2) * amplitude })
  }
  return out
}

function generateArc(length: number, peak: number, samples: number): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    out.push({ x: t * length, y: 4 * peak * t * (1 - t) })
  }
  return out
}

const SPRITE_BASE =
  'https://raw.githubusercontent.com/msikma/pokesprite/master/items'

export const INGREDIENTS: Record<string, IngredientDef> = {
  straight: {
    id: 'straight',
    name: 'Piedra Hoja',
    color: 0x4a8a3d,
    path: [
      { x: 0, y: 0 },
      { x: 130, y: 0 },
    ],
    sprite: `${SPRITE_BASE}/evo-item/leaf-stone.png`,
  },
  scurve: {
    id: 'scurve',
    name: 'Piedra Agua',
    color: 0x6aa8c4,
    path: generateSCurve(170, 42, 48),
    sprite: `${SPRITE_BASE}/evo-item/water-stone.png`,
  },
  jump: {
    id: 'jump',
    name: 'Piedra Fuego',
    color: 0xcf4640,
    path: generateArc(150, -65, 36),
    sprite: `${SPRITE_BASE}/evo-item/fire-stone.png`,
  },
}

export function getIngredient(id: string): IngredientDef | undefined {
  return INGREDIENTS[id]
}
