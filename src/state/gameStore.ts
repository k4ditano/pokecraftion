import { create } from 'zustand'
import type {
  Collectible,
  EventEffect,
  Hazard,
  MtItem,
  Plot,
  Portal,
  RunNode,
  Vec2,
} from '../game/types'
import { getSeed } from '../data/seeds'
import { getMtDef, MT_DEFS, STARTER_MTS } from '../data/mts'
import { useMetaStore, UPGRADES } from './metaStore'
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
  STARTER_PLOTS,
  STARTER_PORTALS,
  STARTER_SEEDS,
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
  pendingAttacker: 'player' | 'enemy' | null
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

  isPouring: boolean
  isWatering: boolean

  seeds: Record<string, number>
  plots: Plot[]

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
  stopPour: () => void
  pourWater: () => void
  startWaterFlow: () => void
  stopWaterFlow: () => void
  consumeWater: (amount: number) => void
  consumePendingMovement: () => void
  addSeed: (id: string, qty: number) => void
  plantSeed: (plotId: string, seedId: string) => void
  harvestPlot: (plotId: string) => void
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
  | 'isPouring'
  | 'isWatering'
  | 'seeds'
  | 'plots'
  | 'battle'
>

function buildInitialState(): InitialStateFields {
  const meta = useMetaStore.getState()
  let inventory = STARTER_INVENTORY.map((i) => ({ ...i }))
  let water = WATER_INITIAL
  let gold = STARTER_GOLD
  const mts = STARTER_MTS.map((m) => ({ ...m }))

  for (const [upId, level] of Object.entries(meta.unlocks)) {
    const def = UPGRADES[upId]
    if (!def || level <= 0) continue
    if (def.apply === 'ingredient' && def.payload.id && def.payload.amount) {
      const target = inventory.find((i) => i.id === def.payload.id)
      if (target) {
        target.qty += def.payload.amount * level
      }
    } else if (def.apply === 'water' && def.payload.amount) {
      water += def.payload.amount * level
    } else if (def.apply === 'gold' && def.payload.amount) {
      gold += def.payload.amount * level
    } else if (def.apply === 'mt' && def.payload.mtId) {
      const mtDef = MT_DEFS[def.payload.mtId]
      if (mtDef) {
        const existing = mts.find((m) => m.id === def.payload.mtId)
        if (existing) existing.qty += level
        else mts.push({ ...mtDef, qty: level })
      }
    }
  }

  const starterParty: PartyMember[] = [
    { pokemonId: 16, name: 'Pidgey', level: 5, hp: 0, maxHp: 0, move: defaultMoveFor(16) },
    { pokemonId: 19, name: 'Rattata', level: 5, hp: 0, maxHp: 0, move: defaultMoveFor(19) },
    { pokemonId: 25, name: 'Pikachu', level: 5, hp: 0, maxHp: 0, move: defaultMoveFor(25) },
  ].map((p) => {
    const m = maxHpFor(p.pokemonId, p.level)
    return { ...p, hp: m, maxHp: m }
  })

  return {
    phase: 'map',
    party: starterParty,
    inventory,
    collectibles: STARTER_COLLECTIBLES.map((c) => ({ ...c })),
    portals: STARTER_PORTALS.map((p) => ({ ...p })),
    hazards: STARTER_HAZARDS.map((h) => ({ ...h })),
    playerPos: { ...STARTER_PLAYER_POS },
    water,
    cauldron: null,
    aimAngle: 0,
    pendingMovement: null,
    gold,
    pathNodes: JSON.parse(JSON.stringify(STARTER_PATH)) as RunNode[],
    currentNodeIdx: 0,
    isPathOpen: false,
    runComplete: false,
    mts,
    teamPanelIdx: null,
    isPouring: false,
    isWatering: false,
    seeds: { ...STARTER_SEEDS },
    plots: STARTER_PLOTS.map((p) => ({ ...p, pos: { ...p.pos } })),
    battle: null,
  }
}

function computeEssencesEarned(
  party: number,
  gold: number,
  collectiblesLeft: number,
): number {
  let n = 10
  n += party * 2
  n += Math.floor(gold / 10)
  if (collectiblesLeft <= 0) n += 3
  return n
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
      const waypoints = transformPath(sliced, state.playerPos, 0)
      return {
        pendingMovement: { waypoints, speed: MOVE_SPEED, kind: 'ingredient' },
        isPouring: true,
      }
    }),

  stopPour: () => set({ isPouring: false }),

  startWaterFlow: () =>
    set((state) => {
      if (state.pendingMovement || state.cauldron) return {}
      if (state.water <= 0) return {}
      return { isWatering: true }
    }),

  stopWaterFlow: () => set({ isWatering: false }),

  consumeWater: (amount) =>
    set((state) => {
      const next = Math.max(0, state.water - amount)
      return {
        water: next,
        isWatering: next <= 0 ? false : state.isWatering,
      }
    }),

  addSeed: (id, qty) =>
    set((state) => ({
      seeds: { ...state.seeds, [id]: (state.seeds[id] ?? 0) + qty },
    })),

  plantSeed: (plotId, seedId) =>
    set((state) => {
      const plot = state.plots.find((p) => p.id === plotId)
      if (!plot || plot.seedId) return {}
      const have = state.seeds[seedId] ?? 0
      if (have <= 0) return {}
      const seedDef = getSeed(seedId)
      if (!seedDef) return {}
      const nextSeeds = { ...state.seeds, [seedId]: have - 1 }
      if (nextSeeds[seedId] <= 0) delete nextSeeds[seedId]
      return {
        seeds: nextSeeds,
        plots: state.plots.map((p) =>
          p.id === plotId
            ? { ...p, seedId, plantedAtMs: performance.now() }
            : p,
        ),
      }
    }),

  harvestPlot: (plotId) =>
    set((state) => {
      const plot = state.plots.find((p) => p.id === plotId)
      if (!plot || !plot.seedId || plot.plantedAtMs == null) return {}
      const seedDef = getSeed(plot.seedId)
      if (!seedDef) return {}
      const ripe =
        performance.now() - plot.plantedAtMs >= seedDef.growthMs
      if (!ripe) return {}
      const nextInv = applyIngredientGains(state.inventory, [
        { id: seedDef.ingredientId, qty: seedDef.yield },
      ])
      return {
        inventory: nextInv,
        plots: state.plots.map((p) =>
          p.id === plotId
            ? { ...p, seedId: undefined, plantedAtMs: undefined }
            : p,
        ),
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

  consumePendingMovement: () =>
    set((state) => {
      const wasIngredient =
        state.pendingMovement?.kind === 'ingredient'
      return {
        pendingMovement: null,
        isPouring: false,
        cauldron: wasIngredient ? null : state.cauldron,
      }
    }),

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
          pendingAttacker: null,
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

      const isFirstAttackOfTurn = battle.pendingAttacker === null
      const attackerSide: 'player' | 'enemy' = isFirstAttackOfTurn
        ? pActive.speed >= eActive.speed
          ? 'player'
          : 'enemy'
        : battle.pendingAttacker!

      const attacker =
        attackerSide === 'player' ? playerParty[pIdx] : enemyParty[eIdx]
      const defender =
        attackerSide === 'player' ? enemyParty[eIdx] : playerParty[pIdx]
      const defenderIdx = attackerSide === 'player' ? eIdx : pIdx

      const move = getMove(attacker.move)
      if (!move) {
        return {
          battle: { ...battle, pendingAttacker: null },
        }
      }

      const res = computeDamage(attacker, defender, move.id)
      const hit = res.hit && res.effectiveness !== 0
      if (hit) {
        defender.hp = Math.max(0, defender.hp - res.damage)
      }

      const lastAction: LastAction = {
        side: attackerSide,
        moveType: move.type,
        defenderIdx,
        damage: hit ? res.damage : 0,
        effectiveness: res.effectiveness,
        ts: Date.now(),
      }

      let result: 'win' | 'loss' | null = null
      let nextPending: 'player' | 'enemy' | null = null

      if (defender.hp <= 0) {
        if (attackerSide === 'player') {
          const next = nextAlive(enemyParty, eIdx)
          if (next === -1) result = 'win'
          else eIdx = next
        } else {
          const next = nextAlive(playerParty, pIdx)
          if (next === -1) result = 'loss'
          else pIdx = next
        }
        nextPending = null
      } else if (isFirstAttackOfTurn) {
        nextPending = attackerSide === 'player' ? 'enemy' : 'player'
      } else {
        nextPending = null
      }

      return {
        battle: {
          ...battle,
          playerParty,
          enemyParty,
          playerActiveIdx: pIdx,
          enemyActiveIdx: eIdx,
          lastAction,
          pendingAttacker: nextPending,
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
          const nowComplete = nextIdx >= state.pathNodes.length
          if (nowComplete) {
            const earned = computeEssencesEarned(
              partyWithHp.length,
              state.gold + node.reward.gold,
              state.collectibles.length,
            )
            useMetaStore.getState().addEssences(earned)
          }
          return {
            party: partyWithHp,
            inventory,
            gold: state.gold + node.reward.gold,
            currentNodeIdx: nextIdx,
            runComplete: nowComplete,
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
