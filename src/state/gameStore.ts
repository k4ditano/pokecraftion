import { create } from 'zustand'
import type { Collectible, Hazard, Portal, Vec2 } from '../game/types'
import { getIngredient } from '../data/ingredients'
import { slicePathByFraction, transformPath } from '../game/pathUtils'
import {
  MAP_CENTER,
  MOVE_SPEED,
  WATER_INITIAL,
  WATER_SPEED,
  WATER_STEP_DISTANCE,
} from '../data/map'
import {
  STARTER_COLLECTIBLES,
  STARTER_HAZARDS,
  STARTER_INVENTORY,
  STARTER_PLAYER_POS,
  STARTER_PORTALS,
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

export interface CauldronState {
  ingredientId: string
  grind: number
}

export interface PendingMovement {
  waypoints: Vec2[]
  speed: number
  kind: 'ingredient' | 'water'
}

interface GameState {
  phase: GamePhase
  party: PartyMember[]
  inventory: InventoryItem[]
  collectibles: Collectible[]
  portals: Portal[]
  hazards: Hazard[]
  playerPos: Vec2

  water: number
  cauldron: CauldronState | null
  aimAngle: number
  pendingMovement: PendingMovement | null

  setPhase: (phase: GamePhase) => void
  addToParty: (member: PartyMember) => void
  addItem: (item: InventoryItem) => void

  setPlayerPos: (pos: Vec2) => void
  collectItem: (collectibleId: string) => void

  addToCauldron: (ingredientId: string) => void
  cancelCauldron: () => void
  incrementGrind: (delta: number) => void
  setAim: (angle: number) => void
  pourCauldron: () => void
  pourWater: () => void
  consumePendingMovement: () => void
  damageFromHazard: () => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'map',
  party: [],
  inventory: STARTER_INVENTORY.map((i) => ({ ...i })),
  collectibles: STARTER_COLLECTIBLES.map((c) => ({ ...c })),
  portals: STARTER_PORTALS.map((p) => ({ ...p })),
  hazards: STARTER_HAZARDS.map((h) => ({ ...h })),
  playerPos: { ...STARTER_PLAYER_POS },

  water: WATER_INITIAL,
  cauldron: null,
  aimAngle: 0,
  pendingMovement: null,

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

  addToCauldron: (id) =>
    set((state) => {
      if (state.cauldron) return {}
      if (state.pendingMovement) return {}
      const item = state.inventory.find((i) => i.id === id)
      if (!item || item.qty <= 0) return {}
      const nextInv = state.inventory
        .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
      return {
        inventory: nextInv,
        cauldron: { ingredientId: id, grind: 0 },
      }
    }),

  cancelCauldron: () =>
    set((state) => {
      if (!state.cauldron) return {}
      const id = state.cauldron.ingredientId
      const def = getIngredient(id)
      const existing = state.inventory.find((i) => i.id === id)
      const nextInv = existing
        ? state.inventory.map((i) =>
            i.id === id ? { ...i, qty: i.qty + 1 } : i,
          )
        : [
            ...state.inventory,
            { id, name: def?.name ?? id, qty: 1 },
          ]
      return { cauldron: null, inventory: nextInv }
    }),

  incrementGrind: (delta) =>
    set((state) =>
      state.cauldron
        ? {
            cauldron: {
              ...state.cauldron,
              grind: Math.max(0, Math.min(1, state.cauldron.grind + delta)),
            },
          }
        : {},
    ),

  setAim: (angle) => set({ aimAngle: angle }),

  pourCauldron: () =>
    set((state) => {
      if (!state.cauldron || state.pendingMovement) return {}
      const def = getIngredient(state.cauldron.ingredientId)
      if (!def) return {}
      if (state.cauldron.grind <= 0) return {}
      const sliced = slicePathByFraction(def.path, state.cauldron.grind)
      const waypoints = transformPath(sliced, state.playerPos, state.aimAngle)
      return {
        cauldron: null,
        pendingMovement: { waypoints, speed: MOVE_SPEED, kind: 'ingredient' },
      }
    }),

  pourWater: () =>
    set((state) => {
      if (state.pendingMovement || state.cauldron) return {}
      if (state.water <= 0) return {}
      const dx = MAP_CENTER.x - state.playerPos.x
      const dy = MAP_CENTER.y - state.playerPos.y
      const d = Math.hypot(dx, dy)
      if (d < 1) {
        return { water: state.water - 1 }
      }
      const stepDist = Math.min(WATER_STEP_DISTANCE, d)
      const target = {
        x: state.playerPos.x + (dx / d) * stepDist,
        y: state.playerPos.y + (dy / d) * stepDist,
      }
      return {
        water: state.water - 1,
        pendingMovement: {
          waypoints: [{ ...state.playerPos }, target],
          speed: WATER_SPEED,
          kind: 'water',
        },
      }
    }),

  consumePendingMovement: () => set({ pendingMovement: null }),

  damageFromHazard: () =>
    set((state) => ({ water: Math.max(0, state.water - 1) })),
}))
