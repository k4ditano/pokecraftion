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
    a: { x: 140, y: 360 },
    b: { x: 1140, y: 360 },
    color: 0x7c5cc4,
    radius: 18,
  },
]

export const STARTER_HAZARDS: Hazard[] = [
  { id: 'haz-1', pos: { x: 520, y: 280 }, radius: 14 },
  { id: 'haz-2', pos: { x: 760, y: 280 }, radius: 14 },
  { id: 'haz-3', pos: { x: 520, y: 440 }, radius: 14 },
  { id: 'haz-4', pos: { x: 760, y: 440 }, radius: 14 },
  { id: 'haz-5', pos: { x: 220, y: 140 }, radius: 14 },
  { id: 'haz-6', pos: { x: 1060, y: 580 }, radius: 14 },
  { id: 'haz-7', pos: { x: 1060, y: 140 }, radius: 14 },
  { id: 'haz-8', pos: { x: 220, y: 580 }, radius: 14 },
]

export const STARTER_COLLECTIBLES: Collectible[] = [
  {
    id: 'col-1',
    kind: 'pokemon',
    defId: 1,
    label: 'Bulbasaur',
    pos: { x: 320, y: 200 },
    radius: 22,
  },
  {
    id: 'col-2',
    kind: 'pokemon',
    defId: 4,
    label: 'Charmander',
    pos: { x: 960, y: 200 },
    radius: 22,
  },
  {
    id: 'col-3',
    kind: 'pokemon',
    defId: 7,
    label: 'Squirtle',
    pos: { x: 960, y: 520 },
    radius: 22,
  },
  {
    id: 'col-4',
    kind: 'pokemon',
    defId: 25,
    label: 'Pikachu',
    pos: { x: 320, y: 520 },
    radius: 22,
  },
  {
    id: 'col-5',
    kind: 'pokemon',
    defId: 16,
    label: 'Pidgey',
    pos: { x: 640, y: 130 },
    radius: 22,
  },
  {
    id: 'col-6',
    kind: 'pokemon',
    defId: 19,
    label: 'Rattata',
    pos: { x: 640, y: 590 },
    radius: 22,
  },
]
