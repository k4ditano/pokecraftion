import type { SeedDef } from '../game/types'

export const SEEDS: Record<string, SeedDef> = {
  'seed-straight': {
    id: 'seed-straight',
    name: 'Semilla Verde',
    ingredientId: 'straight',
    growthMs: 28_000,
    yield: 2,
  },
  'seed-scurve': {
    id: 'seed-scurve',
    name: 'Semilla Azul',
    ingredientId: 'scurve',
    growthMs: 42_000,
    yield: 1,
  },
  'seed-jump': {
    id: 'seed-jump',
    name: 'Semilla Roja',
    ingredientId: 'jump',
    growthMs: 55_000,
    yield: 1,
  },
  'seed-thunder': {
    id: 'seed-thunder',
    name: 'Semilla Aqua',
    ingredientId: 'thunder',
    growthMs: 60_000,
    yield: 1,
  },
  'seed-moon': {
    id: 'seed-moon',
    name: 'Semilla Rosa',
    ingredientId: 'moon',
    growthMs: 60_000,
    yield: 1,
  },
}

export function getSeed(id: string): SeedDef | undefined {
  return SEEDS[id]
}
