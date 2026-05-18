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
}
