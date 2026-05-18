import { create } from 'zustand'
import type {
  Collectible,
  EventEffect,
  Hazard,
  MtItem,
  Portal,
  RunNode,
  Vec2,
} from '../game/types'
import { getMtDef, STARTER_MTS } from '../data/mts'
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
  buildBattlePokemon,
  buildEnemyParty,
  computeDamage,
  defaultMoveFor,
  maxHpFor,
  type BattlePokemon,
} from '../battle/battle'
import { getMove } from '../data/moves'
import { getPokemonData } from '../data/pokemonData'

export type GamePhase = 'menu' | 'map' | 'path' | 'battle'

export interface PartyMember {
  pokemonId: number
  name: string
  level: number
  hp: number
  maxHp: number
  move: string
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

export interface LastAction {
  side: 'player' | 'enemy'
  moveType: string
  defenderIdx: number
  damage: number
  effectiveness: number
  ts: number
}

export interface BattleState {
  nodeId: string
  trainerName: string
  playerParty: BattlePokemon[]
  enemyParty: BattlePokemon[]
  playerActiveIdx: number
  enemyActiveIdx: number
  lastAction: LastAction | null
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

  mts: MtItem[]
  teamPanelIdx: number | null

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
  advanceBattleTurn: () => void
  endBattle: () => void

  healAtSpring: () => void

  openTeamPanel: (idx: number) => void
  closeTeamPanel: () => void
  applyMt: (mtId: string, partyIdx: number) => void

  restartRun: () => void
}

type InitialStateFields = Pick<
  GameState,
  | 'phase'
  | 'party'
  | 'inventory'
  | 'collectibles'
  | 'portals'
  | 'hazards'
  | 'playerPos'
  | 'water'
  | 'cauldron'
  | 'aimAngle'
  | 'pendingMovement'
  | 'gold'
  | 'pathNodes'
  | 'currentNodeIdx'
  | 'isPathOpen'
  | 'runComplete'
  | 'mts'
  | 'teamPanelIdx'
  | 'battle'
>

function buildInitialState(): InitialStateFields {
  return {
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
    pathNodes: JSON.parse(JSON.stringify(STARTER_PATH)) as RunNode[],
    currentNodeIdx: 0,
    isPathOpen: false,
    runComplete: false,
    mts: STARTER_MTS.map((m) => ({ ...m })),
    teamPanelIdx: null,
    battle: null,
  }
}

export const useGameStore = create<GameState>((set) => ({
  ...buildInitialState(),

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
          ? (() => {
              const lvl = 5
              const id = Number(target.defId)
              const maxHp = maxHpFor(id, lvl)
              return [
                ...state.party,
                {
                  pokemonId: id,
                  name: target.label,
                  level: lvl,
                  hp: maxHp,
                  maxHp,
                  move: defaultMoveFor(id),
                },
              ]
            })()
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
        buildBattlePokemon(m.pokemonId, m.name, m.level, m.move, m.hp),
      )
      const enemyParty = buildEnemyParty(node.pokemons)
      const firstAlive = playerParty.findIndex((p) => p.hp > 0)
      if (firstAlive === -1) return {}
      return {
        battle: {
          nodeId,
          trainerName: node.trainerName,
          playerParty,
          enemyParty,
          playerActiveIdx: firstAlive,
          enemyActiveIdx: 0,
          lastAction: null,
          result: null,
        },
        isPathOpen: false,
      }
    }),

  advanceBattleTurn: () =>
    set((state) => {
      const battle = state.battle
      if (!battle || battle.result) return {}

      const playerParty = battle.playerParty.map((p) => ({ ...p }))
      const enemyParty = battle.enemyParty.map((p) => ({ ...p }))
      let pIdx = battle.playerActiveIdx
      let eIdx = battle.enemyActiveIdx
      const pActive = playerParty[pIdx]
      const eActive = enemyParty[eIdx]
      let result: 'win' | 'loss' | null = null
      let lastAction: LastAction | null = null

      const playerMoveId = pActive.move
      const enemyMoveId = eActive.move
      const order: ('player' | 'enemy')[] =
        pActive.speed >= eActive.speed ? ['player', 'enemy'] : ['enemy', 'player']

      for (const side of order) {
        if (result) break
        const attacker = side === 'player' ? playerParty[pIdx] : enemyParty[eIdx]
        const defender = side === 'player' ? enemyParty[eIdx] : playerParty[pIdx]
        const moveId = side === 'player' ? playerMoveId : enemyMoveId
        const move = getMove(moveId)
        if (!move) continue
        const res = computeDamage(attacker, defender, moveId)
        const defenderIdx = side === 'player' ? eIdx : pIdx
        if (!res.hit || res.effectiveness === 0) {
          lastAction = {
            side,
            moveType: move.type,
            defenderIdx,
            damage: 0,
            effectiveness: res.effectiveness,
            ts: Date.now(),
          }
          continue
        }
        defender.hp = Math.max(0, defender.hp - res.damage)
        lastAction = {
          side,
          moveType: move.type,
          defenderIdx,
          damage: res.damage,
          effectiveness: res.effectiveness,
          ts: Date.now(),
        }

        if (defender.hp <= 0) {
          if (side === 'player') {
            const next = nextAlive(enemyParty, eIdx)
            if (next === -1) result = 'win'
            else eIdx = next
          } else {
            const next = nextAlive(playerParty, pIdx)
            if (next === -1) result = 'loss'
            else pIdx = next
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
          lastAction,
          result,
        },
      }
    }),

  healAtSpring: () =>
    set((state) => {
      const dx = state.playerPos.x - MAP_CENTER.x
      const dy = state.playerPos.y - MAP_CENTER.y
      if (Math.hypot(dx, dy) > 60) return {}
      if (state.water <= 0) return {}
      if (state.cauldron || state.pendingMovement) return {}
      const healed = state.party.map((m) => ({ ...m, hp: m.maxHp }))
      return { party: healed, water: state.water - 1 }
    }),

  openTeamPanel: (idx) =>
    set((state) => {
      if (idx < 0 || idx >= state.party.length) return {}
      return { teamPanelIdx: idx }
    }),

  closeTeamPanel: () => set({ teamPanelIdx: null }),

  applyMt: (mtId, partyIdx) =>
    set((state) => {
      const mt = state.mts.find((m) => m.id === mtId)
      if (!mt || mt.qty <= 0) return {}
      const member = state.party[partyIdx]
      if (!member) return {}
      const def = getMtDef(mtId)
      if (!def) return {}
      const move = getMove(def.moveId)
      if (!move) return {}
      const data = getPokemonData(member.pokemonId)
      if (!data.types.includes(move.type)) return {}
      const newParty = state.party.map((m, i) =>
        i === partyIdx ? { ...m, move: def.moveId } : m,
      )
      const newMts = state.mts
        .map((m) => (m.id === mtId ? { ...m, qty: m.qty - 1 } : m))
        .filter((m) => m.qty > 0)
      return { party: newParty, mts: newMts }
    }),

  restartRun: () => set(buildInitialState()),

  endBattle: () =>
    set((state) => {
      const battle = state.battle
      if (!battle) return {}
      const partyWithHp = state.party.map((pm, i) => {
        const bp = battle.playerParty[i]
        if (!bp) return pm
        return { ...pm, hp: bp.hp, maxHp: bp.maxHp }
      })
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
            party: partyWithHp,
            inventory,
            gold: state.gold + node.reward.gold,
            currentNodeIdx: nextIdx,
            runComplete: nextIdx >= state.pathNodes.length,
            battle: null,
          }
        }
      }
      return { party: partyWithHp, battle: null }
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
