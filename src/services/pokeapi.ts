const POKEAPI_BASE = 'https://pokeapi.co/api/v2'
const SPRITES_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export interface PokemonData {
  id: number
  name: string
  types: string[]
  stats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  spriteUrl: string
  spriteFrontUrl: string
  spriteBackUrl: string
}

const cache = new Map<number, PokemonData>()

interface RawPokemon {
  id: number
  name: string
  types: { type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
}

export async function getPokemon(id: number): Promise<PokemonData> {
  const cached = cache.get(id)
  if (cached) return cached

  const res = await fetch(`${POKEAPI_BASE}/pokemon/${id}`)
  if (!res.ok) throw new Error(`PokeAPI ${id} failed: ${res.status}`)
  const raw = (await res.json()) as RawPokemon

  const statByName = (name: string) =>
    raw.stats.find((s) => s.stat.name === name)?.base_stat ?? 0

  const data: PokemonData = {
    id: raw.id,
    name: raw.name,
    types: raw.types.map((t) => t.type.name),
    stats: {
      hp: statByName('hp'),
      attack: statByName('attack'),
      defense: statByName('defense'),
      specialAttack: statByName('special-attack'),
      specialDefense: statByName('special-defense'),
      speed: statByName('speed'),
    },
    spriteUrl: spriteUrlFor(raw.id),
    spriteFrontUrl: `${SPRITES_BASE}/${raw.id}.png`,
    spriteBackUrl: `${SPRITES_BASE}/back/${raw.id}.png`,
  }

  cache.set(id, data)
  return data
}

export function spriteUrlFor(id: number): string {
  return `${SPRITES_BASE}/${id}.png`
}
