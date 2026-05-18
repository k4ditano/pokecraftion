export type Vec2 = { x: number; y: number }

export interface IngredientDef {
  id: string
  name: string
  color: number
  path: Vec2[]
}

export type CollectibleKind = 'pokemon' | 'item'

export interface Collectible {
  id: string
  kind: CollectibleKind
  defId: string | number
  label: string
  pos: Vec2
  radius: number
}

export interface Portal {
  id: string
  a: Vec2
  b: Vec2
  color: number
  radius: number
}

export interface Hazard {
  id: string
  pos: Vec2
  radius: number
  angle?: number
}

export type NodeType = 'trainer' | 'merchant' | 'event' | 'elite' | 'boss'
export type NodeStatus = 'pending' | 'current' | 'done'

export interface TrainerPokemon {
  defId: number
  name: string
  level: number
  move?: string
}

export interface TrainerReward {
  gold: number
  ingredients: { id: string; qty: number }[]
}

interface NodeBase {
  id: string
  label: string
}

export interface NodeTrainer extends NodeBase {
  type: 'trainer' | 'elite' | 'boss'
  trainerName: string
  pokemons: TrainerPokemon[]
  reward: TrainerReward
}

export interface MerchantOffer {
  id: string
  name: string
  qty: number
  price: number
}

export interface NodeMerchant extends NodeBase {
  type: 'merchant'
  offers: MerchantOffer[]
}

export type EventEffect =
  | { kind: 'gainIngredient'; id: string; name: string; qty: number }
  | { kind: 'gainGold'; amount: number }
  | { kind: 'loseWater'; amount: number }
  | { kind: 'gainWater'; amount: number }

export interface EventOption {
  label: string
  effect: EventEffect
}

export interface NodeEvent extends NodeBase {
  type: 'event'
  description: string
  options: EventOption[]
}

export type RunNode = NodeTrainer | NodeMerchant | NodeEvent

export interface MtItem {
  id: string
  name: string
  moveId: string
  qty: number
}
