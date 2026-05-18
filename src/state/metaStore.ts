import { create } from 'zustand'
import { loadMeta, saveMeta, resetMeta } from '../services/db'

export interface UpgradeDef {
  id: string
  name: string
  desc: string
  baseCost: number
  apply: 'ingredient' | 'water' | 'gold' | 'mt'
  payload: { id?: string; amount?: number; mtId?: string }
}

export const UPGRADES: Record<string, UpgradeDef> = {
  'inv-straight': {
    id: 'inv-straight',
    name: 'Bolsillo lineal',
    desc: '+1 Hierba lineal al inicio de cada run',
    baseCost: 4,
    apply: 'ingredient',
    payload: { id: 'straight', amount: 1 },
  },
  'inv-scurve': {
    id: 'inv-scurve',
    name: 'Bolsillo curva',
    desc: '+1 Baya curva al inicio de cada run',
    baseCost: 6,
    apply: 'ingredient',
    payload: { id: 'scurve', amount: 1 },
  },
  'inv-jump': {
    id: 'inv-jump',
    name: 'Bolsillo salto',
    desc: '+1 Piedra salto al inicio de cada run',
    baseCost: 10,
    apply: 'ingredient',
    payload: { id: 'jump', amount: 1 },
  },
  water: {
    id: 'water',
    name: 'Cantimplora',
    desc: '+1 Agua inicial',
    baseCost: 8,
    apply: 'water',
    payload: { amount: 1 },
  },
  gold: {
    id: 'gold',
    name: 'Bolsa pesada',
    desc: '+5 oro inicial',
    baseCost: 5,
    apply: 'gold',
    payload: { amount: 5 },
  },
  'mt-ember': {
    id: 'mt-ember',
    name: 'MT Ascuas extra',
    desc: '+1 MT Ascuas al inicio de cada run',
    baseCost: 12,
    apply: 'mt',
    payload: { mtId: 'mt-ember' },
  },
  'mt-waterGun': {
    id: 'mt-waterGun',
    name: 'MT Pistola Agua extra',
    desc: '+1 MT Pistola Agua al inicio de cada run',
    baseCost: 12,
    apply: 'mt',
    payload: { mtId: 'mt-waterGun' },
  },
  'mt-thundershock': {
    id: 'mt-thundershock',
    name: 'MT Impactrueno extra',
    desc: '+1 MT Impactrueno al inicio de cada run',
    baseCost: 12,
    apply: 'mt',
    payload: { mtId: 'mt-thundershock' },
  },
}

export function upgradeCost(id: string, currentLevel: number): number {
  const def = UPGRADES[id]
  if (!def) return Infinity
  return def.baseCost * (currentLevel + 1)
}

interface MetaState {
  essences: number
  unlocks: Record<string, number>
  ready: boolean
  loadFromDb: () => Promise<void>
  addEssences: (n: number) => void
  buyUpgrade: (id: string) => void
  resetAll: () => Promise<void>
}

export const useMetaStore = create<MetaState>((set, get) => ({
  essences: 0,
  unlocks: {},
  ready: false,

  loadFromDb: async () => {
    const meta = await loadMeta()
    set({
      essences: meta.essences,
      unlocks: meta.unlocks,
      ready: true,
    })
  },

  addEssences: (n) => {
    if (n <= 0) return
    set((state) => {
      const next = state.essences + n
      void saveMeta(next, state.unlocks)
      return { essences: next }
    })
  },

  buyUpgrade: (id) => {
    const state = get()
    const def = UPGRADES[id]
    if (!def) return
    const lvl = state.unlocks[id] ?? 0
    const cost = upgradeCost(id, lvl)
    if (state.essences < cost) return
    const newUnlocks = { ...state.unlocks, [id]: lvl + 1 }
    const newEssences = state.essences - cost
    void saveMeta(newEssences, newUnlocks)
    set({ essences: newEssences, unlocks: newUnlocks })
  },

  resetAll: async () => {
    await resetMeta()
    set({ essences: 0, unlocks: {} })
  },
}))
