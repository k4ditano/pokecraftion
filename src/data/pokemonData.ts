export interface PokemonBattleData {
  types: string[]
  moves: string[]
  baseHp: number
  baseAtk: number
  baseDef: number
  baseSpd: number
}

export const POKEMON_DATA: Record<number, PokemonBattleData> = {
  1: {
    types: ['grass', 'poison'],
    moves: ['tackle', 'vineWhip'],
    baseHp: 45,
    baseAtk: 49,
    baseDef: 49,
    baseSpd: 45,
  },
  4: {
    types: ['fire'],
    moves: ['scratch', 'ember'],
    baseHp: 39,
    baseAtk: 52,
    baseDef: 43,
    baseSpd: 65,
  },
  7: {
    types: ['water'],
    moves: ['tackle', 'waterGun'],
    baseHp: 44,
    baseAtk: 48,
    baseDef: 65,
    baseSpd: 43,
  },
  16: {
    types: ['normal', 'flying'],
    moves: ['tackle', 'gust'],
    baseHp: 40,
    baseAtk: 45,
    baseDef: 40,
    baseSpd: 56,
  },
  19: {
    types: ['normal'],
    moves: ['tackle', 'quickAttack', 'bite'],
    baseHp: 30,
    baseAtk: 56,
    baseDef: 35,
    baseSpd: 72,
  },
  25: {
    types: ['electric'],
    moves: ['quickAttack', 'thundershock'],
    baseHp: 35,
    baseAtk: 55,
    baseDef: 40,
    baseSpd: 90,
  },
  74: {
    types: ['rock', 'ground'],
    moves: ['tackle', 'rockThrow'],
    baseHp: 40,
    baseAtk: 80,
    baseDef: 100,
    baseSpd: 20,
  },
  95: {
    types: ['rock', 'ground'],
    moves: ['tackle', 'rockThrow'],
    baseHp: 35,
    baseAtk: 45,
    baseDef: 160,
    baseSpd: 70,
  },
}

const FALLBACK: PokemonBattleData = {
  types: ['normal'],
  moves: ['tackle'],
  baseHp: 40,
  baseAtk: 40,
  baseDef: 40,
  baseSpd: 40,
}

export function getPokemonData(id: number): PokemonBattleData {
  return POKEMON_DATA[id] ?? FALLBACK
}
