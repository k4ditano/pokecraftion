export type MoveKind = 'physical' | 'special'

export interface MoveDef {
  id: string
  name: string
  type: string
  power: number
  accuracy: number
  kind: MoveKind
}

export const MOVES: Record<string, MoveDef> = {
  tackle: {
    id: 'tackle',
    name: 'Placaje',
    type: 'normal',
    power: 40,
    accuracy: 100,
    kind: 'physical',
  },
  scratch: {
    id: 'scratch',
    name: 'Arañazo',
    type: 'normal',
    power: 40,
    accuracy: 100,
    kind: 'physical',
  },
  quickAttack: {
    id: 'quickAttack',
    name: 'Ataque Rápido',
    type: 'normal',
    power: 40,
    accuracy: 100,
    kind: 'physical',
  },
  bite: {
    id: 'bite',
    name: 'Mordisco',
    type: 'normal',
    power: 60,
    accuracy: 100,
    kind: 'physical',
  },
  ember: {
    id: 'ember',
    name: 'Ascuas',
    type: 'fire',
    power: 40,
    accuracy: 100,
    kind: 'special',
  },
  waterGun: {
    id: 'waterGun',
    name: 'Pistola Agua',
    type: 'water',
    power: 40,
    accuracy: 100,
    kind: 'special',
  },
  vineWhip: {
    id: 'vineWhip',
    name: 'Látigo Cepa',
    type: 'grass',
    power: 45,
    accuracy: 100,
    kind: 'physical',
  },
  thundershock: {
    id: 'thundershock',
    name: 'Impactrueno',
    type: 'electric',
    power: 40,
    accuracy: 100,
    kind: 'special',
  },
  gust: {
    id: 'gust',
    name: 'Tornado',
    type: 'flying',
    power: 40,
    accuracy: 100,
    kind: 'special',
  },
  rockThrow: {
    id: 'rockThrow',
    name: 'Lanzarrocas',
    type: 'rock',
    power: 50,
    accuracy: 90,
    kind: 'physical',
  },
}

export function getMove(id: string): MoveDef | undefined {
  return MOVES[id]
}
