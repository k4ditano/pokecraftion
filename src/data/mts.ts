import type { MtItem } from '../game/types'

type MtDef = Omit<MtItem, 'qty'>

export const MT_DEFS: Record<string, MtDef> = {
  'mt-ember': { id: 'mt-ember', name: 'MT Ascuas', moveId: 'ember' },
  'mt-waterGun': {
    id: 'mt-waterGun',
    name: 'MT Pistola Agua',
    moveId: 'waterGun',
  },
  'mt-thundershock': {
    id: 'mt-thundershock',
    name: 'MT Impactrueno',
    moveId: 'thundershock',
  },
  'mt-vineWhip': {
    id: 'mt-vineWhip',
    name: 'MT Látigo Cepa',
    moveId: 'vineWhip',
  },
  'mt-bite': { id: 'mt-bite', name: 'MT Mordisco', moveId: 'bite' },
  'mt-rockThrow': {
    id: 'mt-rockThrow',
    name: 'MT Lanzarrocas',
    moveId: 'rockThrow',
  },
  'mt-gust': { id: 'mt-gust', name: 'MT Tornado', moveId: 'gust' },
}

export const STARTER_MTS: MtItem[] = [
  { ...MT_DEFS['mt-ember'], qty: 1 },
  { ...MT_DEFS['mt-waterGun'], qty: 1 },
  { ...MT_DEFS['mt-thundershock'], qty: 1 },
]

export function getMtDef(id: string): MtDef | undefined {
  return MT_DEFS[id]
}
