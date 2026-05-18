import type { Collectible, Hazard, Portal } from '../game/types'
import type { InventoryItem } from '../state/gameStore'
import { MAP_CENTER } from './map'

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
  { id: 'haz-1', pos: { x: 760, y: 420 }, radius: 12 },
  { id: 'haz-2', pos: { x: 1160, y: 420 }, radius: 12 },
  { id: 'haz-3', pos: { x: 760, y: 660 }, radius: 12 },
  { id: 'haz-4', pos: { x: 1160, y: 660 }, radius: 12 },
  { id: 'haz-5', pos: { x: 340, y: 220 }, radius: 12 },
  { id: 'haz-6', pos: { x: 1580, y: 860 }, radius: 12 },
  { id: 'haz-7', pos: { x: 1580, y: 220 }, radius: 12 },
  { id: 'haz-8', pos: { x: 340, y: 860 }, radius: 12 },
  { id: 'haz-9', pos: { x: 700, y: 540 }, radius: 12 },
  { id: 'haz-10', pos: { x: 1220, y: 540 }, radius: 12 },
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
