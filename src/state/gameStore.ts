import { create } from 'zustand'

export type GamePhase = 'menu' | 'map' | 'path' | 'battle'

export interface PartyMember {
  pokemonId: number
  name: string
  level: number
  hp: number
  maxHp: number
}

export interface InventoryItem {
  id: string
  name: string
  qty: number
}

interface GameState {
  phase: GamePhase
  party: PartyMember[]
  inventory: InventoryItem[]
  setPhase: (phase: GamePhase) => void
  addToParty: (member: PartyMember) => void
  addItem: (item: InventoryItem) => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  party: [],
  inventory: [],
  setPhase: (phase) => set({ phase }),
  addToParty: (member) =>
    set((state) => ({ party: [...state.party, member] })),
  addItem: (item) =>
    set((state) => {
      const existing = state.inventory.find((i) => i.id === item.id)
      if (existing) {
        return {
          inventory: state.inventory.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + item.qty } : i,
          ),
        }
      }
      return { inventory: [...state.inventory, item] }
    }),
}))
