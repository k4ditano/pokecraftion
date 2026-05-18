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

export const INGREDIENTS: Record<string, IngredientDef> = {
  straight: {
    id: 'straight',
    name: 'Hierba lineal',
    color: 0x2ecc71,
    path: [
      { x: 0, y: 0 },
      { x: 280, y: 0 },
    ],
  },
  scurve: {
    id: 'scurve',
    name: 'Baya curva',
    color: 0x9b59b6,
    path: generateSCurve(320, 70, 64),
  },
  jump: {
    id: 'jump',
    name: 'Piedra salto',
    color: 0xe74c3c,
    path: generateArc(280, -110, 40),
  },
}

export function getIngredient(id: string): IngredientDef | undefined {
  return INGREDIENTS[id]
}
