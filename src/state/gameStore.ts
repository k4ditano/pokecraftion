import { create } from 'zustand'
import type { Collectible, Vec2 } from '../game/types'
import {
  STARTER_COLLECTIBLES,
  STARTER_INVENTORY,
  STARTER_PLAYER_POS,
} from '../data/starter'

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
  selectedIngredientId: string | null
  playerPos: Vec2
  collectibles: Collectible[]

  setPhase: (phase: GamePhase) => void
  addToParty: (member: PartyMember) => void
  addItem: (item: InventoryItem) => void

  selectIngredient: (id: string | null) => void
  consumeIngredient: (id: string) => void
  setPlayerPos: (pos: Vec2) => void
  collectItem: (collectibleId: string) => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'map',
  party: [],
  inventory: STARTER_INVENTORY.map((i) => ({ ...i })),
  selectedIngredientId: null,
  playerPos: { ...STARTER_PLAYER_POS },
  collectibles: STARTER_COLLECTIBLES.map((c) => ({ ...c })),

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

  selectIngredient: (id) => set({ selectedIngredientId: id }),
  consumeIngredient: (id) =>
    set((state) => {
      const current = state.inventory.find((i) => i.id === id)
      if (!current || current.qty <= 0) return {}
      const nextInventory = state.inventory
        .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
      const stillHas = nextInventory.some((i) => i.id === id)
      return {
        inventory: nextInventory,
        selectedIngredientId: stillHas ? state.selectedIngredientId : null,
      }
    }),
  setPlayerPos: (pos) => set({ playerPos: pos }),
  collectItem: (collectibleId) =>
    set((state) => {
      const target = state.collectibles.find((c) => c.id === collectibleId)
      if (!target) return {}
      const newParty =
        target.kind === 'pokemon' && state.party.length < 6
          ? [
              ...state.party,
              {
                pokemonId: Number(target.defId),
                name: target.label,
                level: 5,
                hp: 20,
                maxHp: 20,
              },
            ]
          : state.party
      return {
        collectibles: state.collectibles.filter((c) => c.id !== collectibleId),
        party: newParty,
      }
    }),
}))
