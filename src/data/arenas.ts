import type { EventEffect, RunNode } from '../game/types'

export type ArenaTier = 'gym' | 'elite' | 'champion'

export interface ArenaDef {
  id: string
  name: string
  leaderName: string
  leaderTeam: { defId: number; name: string; level: number; move?: string }[]
  rewardGold: number
  rewardIngredients: { id: string; qty: number }[]
  midLevel: number
  tier: ArenaTier
}

// 8 gyms + 4 Elite Four + 1 Champion
export const ARENAS: ArenaDef[] = [
  {
    id: 'gym-1',
    name: 'Gym 1 · Roca',
    leaderName: 'Brock',
    leaderTeam: [
      { defId: 74, name: 'Geodude', level: 10 },
      { defId: 95, name: 'Onix', level: 12 },
    ],
    rewardGold: 25,
    rewardIngredients: [
      { id: 'straight', qty: 2 },
      { id: 'jump', qty: 1 },
    ],
    midLevel: 6,
    tier: 'gym',
  },
  {
    id: 'gym-2',
    name: 'Gym 2 · Agua',
    leaderName: 'Misty',
    leaderTeam: [
      { defId: 7, name: 'Squirtle', level: 14 },
      { defId: 7, name: 'Squirtle', level: 16 },
    ],
    rewardGold: 30,
    rewardIngredients: [{ id: 'scurve', qty: 3 }],
    midLevel: 10,
    tier: 'gym',
  },
  {
    id: 'gym-3',
    name: 'Gym 3 · Eléctrico',
    leaderName: 'Surge',
    leaderTeam: [
      { defId: 25, name: 'Pikachu', level: 18 },
      { defId: 25, name: 'Pikachu', level: 20 },
    ],
    rewardGold: 35,
    rewardIngredients: [{ id: 'thunder', qty: 3 }],
    midLevel: 14,
    tier: 'gym',
  },
  {
    id: 'gym-4',
    name: 'Gym 4 · Planta',
    leaderName: 'Erika',
    leaderTeam: [
      { defId: 1, name: 'Bulbasaur', level: 22 },
      { defId: 1, name: 'Bulbasaur', level: 24 },
    ],
    rewardGold: 40,
    rewardIngredients: [{ id: 'straight', qty: 4 }],
    midLevel: 18,
    tier: 'gym',
  },
  {
    id: 'gym-5',
    name: 'Gym 5 · Veneno',
    leaderName: 'Koga',
    leaderTeam: [
      { defId: 19, name: 'Rattata', level: 26 },
      { defId: 1, name: 'Bulbasaur', level: 28 },
    ],
    rewardGold: 45,
    rewardIngredients: [{ id: 'moon', qty: 3 }],
    midLevel: 22,
    tier: 'gym',
  },
  {
    id: 'gym-6',
    name: 'Gym 6 · Psíquico',
    leaderName: 'Sabrina',
    leaderTeam: [
      { defId: 25, name: 'Pikachu', level: 30 },
      { defId: 16, name: 'Pidgey', level: 32 },
    ],
    rewardGold: 55,
    rewardIngredients: [{ id: 'thunder', qty: 4 }],
    midLevel: 26,
    tier: 'gym',
  },
  {
    id: 'gym-7',
    name: 'Gym 7 · Fuego',
    leaderName: 'Blaine',
    leaderTeam: [
      { defId: 4, name: 'Charmander', level: 34 },
      { defId: 4, name: 'Charmander', level: 36 },
    ],
    rewardGold: 65,
    rewardIngredients: [{ id: 'jump', qty: 4 }],
    midLevel: 30,
    tier: 'gym',
  },
  {
    id: 'gym-8',
    name: 'Gym 8 · Tierra',
    leaderName: 'Giovanni',
    leaderTeam: [
      { defId: 74, name: 'Geodude', level: 38 },
      { defId: 95, name: 'Onix', level: 41 },
    ],
    rewardGold: 80,
    rewardIngredients: [
      { id: 'moon', qty: 3 },
      { id: 'thunder', qty: 3 },
    ],
    midLevel: 34,
    tier: 'gym',
  },
  // Elite Four
  {
    id: 'e4-1',
    name: 'Alto Mando · Hielo',
    leaderName: 'Lorelei',
    leaderTeam: [
      { defId: 7, name: 'Squirtle', level: 44 },
      { defId: 25, name: 'Pikachu', level: 45 },
    ],
    rewardGold: 100,
    rewardIngredients: [{ id: 'scurve', qty: 4 }],
    midLevel: 40,
    tier: 'elite',
  },
  {
    id: 'e4-2',
    name: 'Alto Mando · Lucha',
    leaderName: 'Bruno',
    leaderTeam: [
      { defId: 74, name: 'Geodude', level: 46 },
      { defId: 95, name: 'Onix', level: 47 },
    ],
    rewardGold: 110,
    rewardIngredients: [{ id: 'jump', qty: 4 }],
    midLevel: 42,
    tier: 'elite',
  },
  {
    id: 'e4-3',
    name: 'Alto Mando · Fantasma',
    leaderName: 'Ágata',
    leaderTeam: [
      { defId: 19, name: 'Rattata', level: 48 },
      { defId: 1, name: 'Bulbasaur', level: 49 },
    ],
    rewardGold: 120,
    rewardIngredients: [{ id: 'moon', qty: 4 }],
    midLevel: 44,
    tier: 'elite',
  },
  {
    id: 'e4-4',
    name: 'Alto Mando · Dragón',
    leaderName: 'Lance',
    leaderTeam: [
      { defId: 16, name: 'Pidgey', level: 50 },
      { defId: 95, name: 'Onix', level: 52 },
    ],
    rewardGold: 140,
    rewardIngredients: [{ id: 'thunder', qty: 4 }],
    midLevel: 46,
    tier: 'elite',
  },
  // Champion
  {
    id: 'champion',
    name: 'Campeón',
    leaderName: 'Azul',
    leaderTeam: [
      { defId: 4, name: 'Charmander', level: 55 },
      { defId: 25, name: 'Pikachu', level: 55 },
      { defId: 95, name: 'Onix', level: 56 },
    ],
    rewardGold: 250,
    rewardIngredients: [
      { id: 'straight', qty: 5 },
      { id: 'scurve', qty: 5 },
      { id: 'jump', qty: 5 },
      { id: 'thunder', qty: 5 },
      { id: 'moon', qty: 5 },
    ],
    midLevel: 50,
    tier: 'champion',
  },
]

export function buildArenaPath(arena: ArenaDef): RunNode[] {
  const lvl = arena.midLevel
  const bossType: 'boss' | 'elite' =
    arena.tier === 'gym' || arena.tier === 'champion' ? 'boss' : 'elite'
  return [
    {
      id: `${arena.id}-m1`,
      type: 'trainer',
      label: 'Joven entrenador',
      trainerName: 'Joven',
      pokemons: [{ defId: 19, name: 'Rattata', level: Math.max(2, lvl - 2) }],
      reward: { gold: 8, ingredients: [{ id: 'straight', qty: 1 }] },
    },
    {
      id: `${arena.id}-evt`,
      type: 'event',
      label: 'Encuentro',
      description:
        'Un anciano alquimista te ofrece consejo a cambio de un favor.',
      options: [
        {
          label: '+1 Menta Azul',
          effect: {
            kind: 'gainIngredient',
            id: 'scurve',
            name: 'Menta Azul',
            qty: 1,
          } as EventEffect,
        },
        {
          label: '+5 monedas',
          effect: { kind: 'gainGold', amount: 5 } as EventEffect,
        },
      ],
    },
    {
      id: `${arena.id}-shop`,
      type: 'merchant',
      label: 'Mercader del camino',
      offers: [
        { id: 'straight', name: 'Menta Verde', qty: 2, price: 6 },
        { id: 'scurve', name: 'Menta Azul', qty: 1, price: 8 },
        { id: 'seed-straight', name: 'Semilla Verde', qty: 2, price: 5 },
        { id: 'seed-jump', name: 'Semilla Roja', qty: 1, price: 14 },
      ],
    },
    {
      id: `${arena.id}-m2`,
      type: 'trainer',
      label: 'Domador',
      trainerName: 'Domador',
      pokemons: [{ defId: 16, name: 'Pidgey', level: lvl }],
      reward: { gold: 12, ingredients: [{ id: 'thunder', qty: 1 }] },
    },
    {
      id: `${arena.id}-elite`,
      type: 'elite',
      label: `Élite del Gym`,
      trainerName: 'Veterano',
      pokemons: [
        { defId: 25, name: 'Pikachu', level: lvl + 2 },
        { defId: 74, name: 'Geodude', level: lvl + 2 },
      ],
      reward: {
        gold: 20,
        ingredients: [{ id: 'moon', qty: 1 }],
      },
    },
    {
      id: arena.id,
      type: bossType,
      label: arena.name,
      trainerName: arena.leaderName,
      pokemons: arena.leaderTeam,
      reward: {
        gold: arena.rewardGold,
        ingredients: arena.rewardIngredients,
      },
    },
  ]
}

export function arenaFor(idx: number): ArenaDef {
  return ARENAS[Math.min(Math.max(0, idx), ARENAS.length - 1)]
}
