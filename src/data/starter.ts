import type { Collectible } from '../game/types'
import type { InventoryItem } from '../state/gameStore'

export const STARTER_INVENTORY: InventoryItem[] = [
  { id: 'straight', name: 'Hierba lineal', qty: 4 },
  { id: 'scurve', name: 'Baya curva', qty: 3 },
  { id: 'jump', name: 'Piedra salto', qty: 2 },
]

export const STARTER_PLAYER_POS = { x: 140, y: 270 }

export const STARTER_COLLECTIBLES: Collectible[] = [
  {
    id: 'col-1',
    kind: 'pokemon',
    defId: 1,
    label: 'Bulbasaur',
    pos: { x: 360, y: 200 },
    radius: 28,
  },
  {
    id: 'col-2',
    kind: 'pokemon',
    defId: 4,
    label: 'Charmander',
    pos: { x: 520, y: 340 },
    radius: 28,
  },
  {
    id: 'col-3',
    kind: 'pokemon',
    defId: 7,
    label: 'Squirtle',
    pos: { x: 700, y: 180 },
    radius: 28,
  },
  {
    id: 'col-4',
    kind: 'pokemon',
    defId: 25,
    label: 'Pikachu',
    pos: { x: 820, y: 380 },
    radius: 28,
  },
  {
    id: 'col-5',
    kind: 'pokemon',
    defId: 16,
    label: 'Pidgey',
    pos: { x: 600, y: 90 },
    radius: 28,
  },
  {
    id: 'col-6',
    kind: 'pokemon',
    defId: 19,
    label: 'Rattata',
    pos: { x: 280, y: 440 },
    radius: 28,
  },
]
