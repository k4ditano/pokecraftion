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
    name: 'Bolsillo verde',
    desc: '+1 Menta Verde al inicio de cada run',
    baseCost: 4,
    apply: 'ingredient',
    payload: { id: 'straight', amount: 1 },
  },
  'inv-scurve': {
    id: 'inv-scurve',
    name: 'Bolsillo azul',
    desc: '+1 Menta Azul al inicio de cada run',
    baseCost: 6,
    apply: 'ingredient',
    payload: { id: 'scurve', amount: 1 },
  },
  'inv-jump': {
    id: 'inv-jump',
    name: 'Bolsillo rojo',
    desc: '+1 Menta Roja al inicio de cada run',
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
  medals: number
  bossesDefeated: string[]
  ready: boolean
  loadFromDb: () => Promise<void>
  addEssences: (n: number) => void
  buyUpgrade: (id: string) => void
  awardMedal: (bossId: string) => void
  resetAll: () => Promise<void>
}

function persist(state: MetaState): void {
  void saveMeta({
    essences: state.essences,
    unlocks: state.unlocks,
    medals: state.medals,
    bossesDefeated: state.bossesDefeated,
  })
}

export const useMetaStore = create<MetaState>((set, get) => ({
  essences: 0,
  unlocks: {},
  medals: 0,
  bossesDefeated: [],
  ready: false,

  loadFromDb: async () => {
    const meta = await loadMeta()
    set({
      essences: meta.essences,
      unlocks: meta.unlocks,
      medals: meta.medals,
      bossesDefeated: meta.bossesDefeated,
      ready: true,
    })
  },

  addEssences: (n) => {
    if (n <= 0) return
    set((state) => {
      const next = { ...state, essences: state.essences + n }
      persist(next)
      return { essences: next.essences }
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
    const merged = { ...state, essences: newEssences, unlocks: newUnlocks }
    persist(merged)
    set({ essences: newEssences, unlocks: newUnlocks })
  },

  awardMedal: (bossId) => {
    set((state) => {
      if (state.bossesDefeated.includes(bossId)) return {}
      const newBosses = [...state.bossesDefeated, bossId]
      const newMedals = state.medals + 1
      const merged = {
        ...state,
        medals: newMedals,
        bossesDefeated: newBosses,
      }
      persist(merged)
      return { medals: newMedals, bossesDefeated: newBosses }
    })
  },

  resetAll: async () => {
    await resetMeta()
    set({ essences: 0, unlocks: {}, medals: 0, bossesDefeated: [] })
  },
}))
