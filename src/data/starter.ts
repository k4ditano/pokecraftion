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
    a: { x: 130, y: 270 },
    b: { x: 830, y: 270 },
    color: 0xb16dff,
    radius: 22,
  },
]

export const STARTER_HAZARDS: Hazard[] = [
  { id: 'haz-1', pos: { x: 370, y: 220 }, radius: 18 },
  { id: 'haz-2', pos: { x: 590, y: 220 }, radius: 18 },
  { id: 'haz-3', pos: { x: 370, y: 320 }, radius: 18 },
  { id: 'haz-4', pos: { x: 590, y: 320 }, radius: 18 },
  { id: 'haz-5', pos: { x: 160, y: 100 }, radius: 18 },
  { id: 'haz-6', pos: { x: 800, y: 440 }, radius: 18 },
]

export const STARTER_COLLECTIBLES: Collectible[] = [
  {
    id: 'col-1',
    kind: 'pokemon',
    defId: 1,
    label: 'Bulbasaur',
    pos: { x: 240, y: 130 },
    radius: 28,
  },
  {
    id: 'col-2',
    kind: 'pokemon',
    defId: 4,
    label: 'Charmander',
    pos: { x: 760, y: 130 },
    radius: 28,
  },
  {
    id: 'col-3',
    kind: 'pokemon',
    defId: 7,
    label: 'Squirtle',
    pos: { x: 760, y: 410 },
    radius: 28,
  },
  {
    id: 'col-4',
    kind: 'pokemon',
    defId: 25,
    label: 'Pikachu',
    pos: { x: 240, y: 410 },
    radius: 28,
  },
  {
    id: 'col-5',
    kind: 'pokemon',
    defId: 16,
    label: 'Pidgey',
    pos: { x: 480, y: 90 },
    radius: 28,
  },
  {
    id: 'col-6',
    kind: 'pokemon',
    defId: 19,
    label: 'Rattata',
    pos: { x: 480, y: 460 },
    radius: 28,
  },
]
