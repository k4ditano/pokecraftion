import type { RunNode } from '../game/types'

export const STARTER_GOLD = 10

export const STARTER_PATH: RunNode[] = [
  {
    id: 'n1',
    type: 'trainer',
    label: 'Joven Brian',
    trainerName: 'Joven Brian',
    pokemons: [{ defId: 19, name: 'Rattata', level: 4 }],
    reward: {
      gold: 10,
      ingredients: [{ id: 'straight', qty: 1 }],
    },
  },
  {
    id: 'n2',
    type: 'event',
    label: 'Anciano alquimista',
    description:
      'Un anciano te ofrece compartir secretos a cambio de algo de agua.',
    options: [
      {
        label: 'Aceptar (−1 Agua, +1 Baya curva)',
        effect: { kind: 'gainIngredient', id: 'scurve', name: 'Baya curva', qty: 1 },
      },
      {
        label: 'Rechazar (+5 monedas)',
        effect: { kind: 'gainGold', amount: 5 },
      },
    ],
  },
  {
    id: 'n3',
    type: 'merchant',
    label: 'Mercader del bosque',
    offers: [
      { id: 'straight', name: 'Piedra Hoja', qty: 2, price: 6 },
      { id: 'scurve', name: 'Piedra Agua', qty: 1, price: 8 },
      { id: 'jump', name: 'Piedra Fuego', qty: 1, price: 12 },
    ],
  },
  {
    id: 'n4',
    type: 'trainer',
    label: 'Domadora Carla',
    trainerName: 'Carla',
    pokemons: [
      { defId: 16, name: 'Pidgey', level: 5 },
      { defId: 19, name: 'Rattata', level: 5 },
    ],
    reward: {
      gold: 15,
      ingredients: [{ id: 'jump', qty: 1 }],
    },
  },
  {
    id: 'n5',
    type: 'elite',
    label: 'Élite — Daniel',
    trainerName: 'Daniel el Cazador',
    pokemons: [
      { defId: 25, name: 'Pikachu', level: 8 },
      { defId: 19, name: 'Rattata', level: 7 },
    ],
    reward: {
      gold: 25,
      ingredients: [
        { id: 'scurve', qty: 2 },
        { id: 'jump', qty: 1 },
      ],
    },
  },
  {
    id: 'n6',
    type: 'boss',
    label: 'Jefe — Brock',
    trainerName: 'Líder Brock',
    pokemons: [
      { defId: 74, name: 'Geodude', level: 10 },
      { defId: 95, name: 'Onix', level: 12 },
    ],
    reward: {
      gold: 50,
      ingredients: [
        { id: 'straight', qty: 3 },
        { id: 'scurve', qty: 2 },
        { id: 'jump', qty: 2 },
      ],
    },
  },
]
