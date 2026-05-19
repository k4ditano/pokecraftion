import type { PartyMember } from '../state/gameStore'
import { maxHpFor } from './battle'

export function xpForNext(level: number): number {
  return Math.floor(10 + level * 18 + level * level * 2)
}

export function applyXp(member: PartyMember, xp: number): PartyMember {
  if (xp <= 0) return member
  let level = member.level
  let cur = member.xp + xp
  let maxHpDelta = 0
  while (cur >= xpForNext(level)) {
    cur -= xpForNext(level)
    const oldMax = maxHpFor(member.pokemonId, level)
    level++
    const newMax = maxHpFor(member.pokemonId, level)
    maxHpDelta += newMax - oldMax
  }
  const newMaxHp = maxHpFor(member.pokemonId, level)
  return {
    ...member,
    level,
    xp: cur,
    maxHp: newMaxHp,
    hp: member.hp > 0 ? Math.min(member.hp + maxHpDelta, newMaxHp) : member.hp,
  }
}

export function distributeXp(
  party: PartyMember[],
  xp: number,
): PartyMember[] {
  if (xp <= 0 || party.length === 0) return party
  const survivors = party.filter((p) => p.hp > 0)
  if (survivors.length === 0) return party
  const per = Math.max(1, Math.floor(xp / survivors.length))
  return party.map((p) => (p.hp > 0 ? applyXp(p, per) : p))
}

export function bossXpReward(enemyLevels: number[]): number {
  return enemyLevels.reduce((s, l) => s + l * 7 + 12, 0)
}
