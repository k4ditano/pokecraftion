import { create } from 'zustand'
import type {
  Collectible,
  EventEffect,
  Hazard,
  Portal,
  RunNode,
  Vec2,
} from '../game/types'
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
import { STARTER_GOLD, STARTER_PATH } from '../data/runPath'
import {
  aiPickMove,
  buildBattlePokemon,
  buildEnemyParty,
  computeDamage,
  effectivenessLabel,
  type BattlePokemon,
} from '../battle/battle'
import { getMove } from '../data/moves'

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

export interface BattleState {
  nodeId: string
  playerParty: BattlePokemon[]
  enemyParty: BattlePokemon[]
  playerActiveIdx: number
  enemyActiveIdx: number
  messages: string[]
  result: 'win' | 'loss' | null
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

  gold: number
  pathNodes: RunNode[]
  currentNodeIdx: number
  isPathOpen: boolean
  runComplete: boolean

  battle: BattleState | null

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

  openPath: () => void
  closePath: () => void
  resolveTrainerNode: (nodeId: string) => void
  buyMerchantOffer: (nodeId: string, offerIdx: number) => void
  finishMerchant: (nodeId: string) => void
  applyEventOption: (nodeId: string, optionIdx: number) => void

  startBattle: (nodeId: string) => void
  chooseBattleMove: (moveIdx: number) => void
  nextBattleMessage: () => void
  endBattle: () => void
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

  gold: STARTER_GOLD,
  pathNodes: STARTER_PATH.map((n) => ({ ...n })),
  currentNodeIdx: 0,
  isPathOpen: false,
  runComplete: false,

  battle: null,

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

  openPath: () =>
    set((state) => {
      if (state.pendingMovement || state.cauldron) return {}
      return { isPathOpen: true }
    }),

  closePath: () => set({ isPathOpen: false }),

  resolveTrainerNode: (nodeId) =>
    set((state) => {
      const node = state.pathNodes[state.currentNodeIdx]
      if (!node || node.id !== nodeId) return {}
      if (node.type !== 'trainer' && node.type !== 'elite' && node.type !== 'boss') {
        return {}
      }
      const nextInv = applyIngredientGains(state.inventory, node.reward.ingredients)
      const nextIdx = state.currentNodeIdx + 1
      const complete = nextIdx >= state.pathNodes.length
      return {
        inventory: nextInv,
        gold: state.gold + node.reward.gold,
        currentNodeIdx: nextIdx,
        runComplete: complete,
      }
    }),

  buyMerchantOffer: (nodeId, offerIdx) =>
    set((state) => {
      const node = state.pathNodes[state.currentNodeIdx]
      if (!node || node.id !== nodeId || node.type !== 'merchant') return {}
      const offer = node.offers[offerIdx]
      if (!offer) return {}
      if (state.gold < offer.price) return {}
      const updatedOffers = node.offers.filter((_, i) => i !== offerIdx)
      const newNodes = state.pathNodes.map((n, i) =>
        i === state.currentNodeIdx && n.type === 'merchant'
          ? { ...n, offers: updatedOffers }
          : n,
      )
      return {
        gold: state.gold - offer.price,
        inventory: applyIngredientGains(state.inventory, [
          { id: offer.id, qty: offer.qty },
        ]),
        pathNodes: newNodes,
      }
    }),

  finishMerchant: (nodeId) =>
    set((state) => {
      const node = state.pathNodes[state.currentNodeIdx]
      if (!node || node.id !== nodeId || node.type !== 'merchant') return {}
      const nextIdx = state.currentNodeIdx + 1
      return {
        currentNodeIdx: nextIdx,
        runComplete: nextIdx >= state.pathNodes.length,
      }
    }),

  applyEventOption: (nodeId, optionIdx) =>
    set((state) => {
      const node = state.pathNodes[state.currentNodeIdx]
      if (!node || node.id !== nodeId || node.type !== 'event') return {}
      const option = node.options[optionIdx]
      if (!option) return {}
      const patch = applyEffect(state, option.effect)
      const nextIdx = state.currentNodeIdx + 1
      return {
        ...patch,
        currentNodeIdx: nextIdx,
        runComplete: nextIdx >= state.pathNodes.length,
      }
    }),

  startBattle: (nodeId) =>
    set((state) => {
      const node = state.pathNodes[state.currentNodeIdx]
      if (!node || node.id !== nodeId) return {}
      if (
        node.type !== 'trainer' &&
        node.type !== 'elite' &&
        node.type !== 'boss'
      ) {
        return {}
      }
      if (state.party.length === 0) return {}
      const playerParty = state.party.map((m) =>
        buildBattlePokemon(m.pokemonId, m.name, m.level),
      )
      const enemyParty = buildEnemyParty(node.pokemons)
      return {
        battle: {
          nodeId,
          playerParty,
          enemyParty,
          playerActiveIdx: 0,
          enemyActiveIdx: 0,
          messages: [
            `${node.trainerName} te reta a un combate.`,
            `¡Adelante, ${playerParty[0].name}!`,
          ],
          result: null,
        },
        isPathOpen: false,
      }
    }),

  chooseBattleMove: (moveIdx) =>
    set((state) => {
      const battle = state.battle
      if (!battle || battle.result) return {}
      if (battle.messages.length > 0) return {}

      const playerParty = battle.playerParty.map((p) => ({ ...p }))
      const enemyParty = battle.enemyParty.map((p) => ({ ...p }))
      let pIdx = battle.playerActiveIdx
      let eIdx = battle.enemyActiveIdx
      const pActive = playerParty[pIdx]
      const eActive = enemyParty[eIdx]
      const messages: string[] = []
      let result: 'win' | 'loss' | null = null

      const playerMoveId = pActive.moves[moveIdx]
      const enemyMoveId = aiPickMove(eActive)
      const order: ('player' | 'enemy')[] =
        pActive.speed >= eActive.speed ? ['player', 'enemy'] : ['enemy', 'player']

      for (const side of order) {
        if (result) break
        const attacker = side === 'player' ? playerParty[pIdx] : enemyParty[eIdx]
        const defender = side === 'player' ? enemyParty[eIdx] : playerParty[pIdx]
        const moveId = side === 'player' ? playerMoveId : enemyMoveId
        const move = getMove(moveId)
        if (!move) continue
        messages.push(`${attacker.name} usa ${move.name}.`)
        const result1 = computeDamage(attacker, defender, moveId)
        if (!result1.hit) {
          messages.push('¡Falló!')
          continue
        }
        if (result1.effectiveness === 0) {
          messages.push('No tiene efecto…')
          continue
        }
        defender.hp = Math.max(0, defender.hp - result1.damage)
        messages.push(`Inflige ${result1.damage} de daño.`)
        const effLabel = effectivenessLabel(result1.effectiveness)
        if (effLabel) messages.push(effLabel + '.')

        if (defender.hp <= 0) {
          messages.push(`${defender.name} se debilita.`)
          if (side === 'player') {
            const next = nextAlive(enemyParty, eIdx)
            if (next === -1) {
              result = 'win'
              messages.push('¡Has ganado el combate!')
            } else {
              eIdx = next
              messages.push(`Rival envía a ${enemyParty[eIdx].name}.`)
            }
          } else {
            const next = nextAlive(playerParty, pIdx)
            if (next === -1) {
              result = 'loss'
              messages.push('Te has quedado sin Pokémon.')
            } else {
              pIdx = next
              messages.push(`Envías a ${playerParty[pIdx].name}.`)
            }
          }
          break
        }
      }

      return {
        battle: {
          ...battle,
          playerParty,
          enemyParty,
          playerActiveIdx: pIdx,
          enemyActiveIdx: eIdx,
          messages,
          result,
        },
      }
    }),

  nextBattleMessage: () =>
    set((state) => {
      if (!state.battle) return {}
      if (state.battle.messages.length === 0) return {}
      return {
        battle: {
          ...state.battle,
          messages: state.battle.messages.slice(1),
        },
      }
    }),

  endBattle: () =>
    set((state) => {
      const battle = state.battle
      if (!battle) return {}
      if (battle.result === 'win') {
        const node = state.pathNodes.find((n) => n.id === battle.nodeId)
        if (
          node &&
          (node.type === 'trainer' ||
            node.type === 'elite' ||
            node.type === 'boss')
        ) {
          const inventory = applyIngredientGains(
            state.inventory,
            node.reward.ingredients,
          )
          const nextIdx = state.currentNodeIdx + 1
          return {
            inventory,
            gold: state.gold + node.reward.gold,
            currentNodeIdx: nextIdx,
            runComplete: nextIdx >= state.pathNodes.length,
            battle: null,
          }
        }
      }
      return { battle: null }
    }),
}))

function nextAlive(party: BattlePokemon[], currentIdx: number): number {
  for (let i = currentIdx + 1; i < party.length; i++) {
    if (party[i].hp > 0) return i
  }
  for (let i = 0; i < currentIdx; i++) {
    if (party[i].hp > 0) return i
  }
  return -1
}

function applyIngredientGains(
  inventory: InventoryItem[],
  gains: { id: string; qty: number }[],
): InventoryItem[] {
  let next = inventory
  for (const g of gains) {
    const existing = next.find((i) => i.id === g.id)
    if (existing) {
      next = next.map((i) =>
        i.id === g.id ? { ...i, qty: i.qty + g.qty } : i,
      )
    } else {
      const def = getIngredient(g.id)
      next = [...next, { id: g.id, name: def?.name ?? g.id, qty: g.qty }]
    }
  }
  return next
}

function applyEffect(
  state: GameState,
  effect: EventEffect,
): Partial<GameState> {
  switch (effect.kind) {
    case 'gainIngredient':
      return {
        inventory: applyIngredientGains(state.inventory, [
          { id: effect.id, qty: effect.qty },
        ]),
      }
    case 'gainGold':
      return { gold: state.gold + effect.amount }
    case 'loseWater':
      return { water: Math.max(0, state.water - effect.amount) }
    case 'gainWater':
      return { water: state.water + effect.amount }
  }
}
