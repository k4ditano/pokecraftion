import { getMove } from '../data/moves'
import { getPokemonData } from '../data/pokemonData'
import { typeEffectiveness } from '../data/typeChart'
import type { TrainerPokemon } from '../game/types'

export interface BattlePokemon {
  pokemonId: number
  name: string
  level: number
  hp: number
  maxHp: number
  atk: number
  def: number
  speed: number
  types: string[]
  moves: string[]
}

export function buildBattlePokemon(
  pokemonId: number,
  name: string,
  level: number,
): BattlePokemon {
  const data = getPokemonData(pokemonId)
  const maxHp = computeHp(data.baseHp, level)
  return {
    pokemonId,
    name,
    level,
    hp: maxHp,
    maxHp,
    atk: computeStat(data.baseAtk, level),
    def: computeStat(data.baseDef, level),
    speed: computeStat(data.baseSpd, level),
    types: data.types,
    moves: data.moves,
  }
}

export function buildEnemyParty(pokemons: TrainerPokemon[]): BattlePokemon[] {
  return pokemons.map((p) => buildBattlePokemon(p.defId, p.name, p.level))
}

function computeHp(base: number, level: number): number {
  return Math.floor((2 * base * level) / 100) + level + 10
}

function computeStat(base: number, level: number): number {
  return Math.floor((2 * base * level) / 100) + 5
}

export interface DamageResult {
  damage: number
  effectiveness: number
  hit: boolean
}

export function computeDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveId: string,
): DamageResult {
  const move = getMove(moveId)
  if (!move) return { damage: 0, effectiveness: 1, hit: false }

  const accRoll = Math.random() * 100
  if (accRoll >= move.accuracy) {
    return { damage: 0, effectiveness: 1, hit: false }
  }

  if (move.power <= 0) return { damage: 0, effectiveness: 1, hit: true }

  const base =
    ((2 * attacker.level) / 5 + 2) *
      move.power *
      (attacker.atk / defender.def) /
      50 +
    2
  const stab = attacker.types.includes(move.type) ? 1.5 : 1
  const eff = typeEffectiveness(move.type, defender.types)
  if (eff === 0) return { damage: 0, effectiveness: 0, hit: true }

  const damage = Math.max(1, Math.floor(base * stab * eff))
  return { damage, effectiveness: eff, hit: true }
}

export function aiPickMove(attacker: BattlePokemon): string {
  const idx = Math.floor(Math.random() * attacker.moves.length)
  return attacker.moves[idx]
}

export function effectivenessLabel(eff: number): string {
  if (eff === 0) return 'No tiene efecto'
  if (eff >= 2) return 'Es muy eficaz'
  if (eff <= 0.5) return 'No es muy eficaz'
  return ''
}
