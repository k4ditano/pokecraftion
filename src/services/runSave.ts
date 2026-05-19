import type {
  Collectible,
  Hazard,
  MtItem,
  Plot,
  Portal,
  RunNode,
  Vec2,
} from '../game/types'
import type {
  InventoryItem,
  PartyMember,
} from '../state/gameStore'

const RUN_KEY = 'pokecraftion.run.v1'

export interface RunSnapshot {
  party: PartyMember[]
  inventory: InventoryItem[]
  collectibles: Collectible[]
  portals: Portal[]
  hazards: Hazard[]
  plots: Plot[]
  seeds: Record<string, number>
  playerPos: Vec2
  water: number
  gold: number
  pathNodes: RunNode[]
  currentNodeIdx: number
  runComplete: boolean
  mts: MtItem[]
}

export function saveRun(snap: RunSnapshot): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(snap))
  } catch {
    // localStorage may be unavailable (privacy mode); ignore
  }
}

export function loadRun(): RunSnapshot | null {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RunSnapshot
  } catch {
    return null
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY)
  } catch {
    // ignore
  }
}
