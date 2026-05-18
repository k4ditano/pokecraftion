import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/gameStore'
import { spriteUrlFor } from '../services/pokeapi'
import { getMove } from '../data/moves'
import type { BattlePokemon } from '../battle/battle'

const AUTO_DELAY_MS = 700

export function BattleScreen() {
  const battle = useGameStore((s) => s.battle)
  const advanceBattleTurn = useGameStore((s) => s.advanceBattleTurn)
  const nextBattleMessage = useGameStore((s) => s.nextBattleMessage)
  const endBattle = useGameStore((s) => s.endBattle)

  const timerRef = useRef<number | null>(null)

  const isOpen = !!battle
  const messagesCount = battle?.messages.length ?? 0
  const ended = battle?.result != null

  useEffect(() => {
    if (!isOpen) return
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (ended) return
    if (messagesCount === 0) {
      timerRef.current = window.setTimeout(() => {
        advanceBattleTurn()
      }, 250)
    }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOpen, ended, messagesCount, advanceBattleTurn])

  useEffect(() => {
    if (!isOpen) return
    if (ended) return
    if (messagesCount === 0) return
    const t = window.setTimeout(() => {
      nextBattleMessage()
    }, AUTO_DELAY_MS)
    return () => clearTimeout(t)
  }, [isOpen, ended, messagesCount, nextBattleMessage])

  if (!battle) return null

  const player = battle.playerParty[battle.playerActiveIdx]
  const enemy = battle.enemyParty[battle.enemyActiveIdx]
  const currentMessage = battle.messages[0]
  const playerMove = getMove(player.move)
  const enemyMove = getMove(enemy.move)

  return (
    <div className="battle-overlay">
      <div className="battle-screen">
        <div className="battle-arena">
          <div className="battle-side enemy">
            <CombatantCard
              pkmn={enemy}
              moveName={enemyMove?.name ?? '—'}
              side="enemy"
            />
            <PartyDots
              party={battle.enemyParty}
              activeIdx={battle.enemyActiveIdx}
            />
          </div>
          <div className="battle-side player">
            <CombatantCard
              pkmn={player}
              moveName={playerMove?.name ?? '—'}
              side="player"
            />
            <PartyDots
              party={battle.playerParty}
              activeIdx={battle.playerActiveIdx}
            />
          </div>
        </div>

        <div className="battle-controls">
          {currentMessage && (
            <div className="battle-message">
              <div className="message-text">{currentMessage}</div>
              <button className="btn pour" onClick={() => nextBattleMessage()}>
                ▶ Saltar
              </button>
            </div>
          )}

          {!currentMessage && !ended && (
            <div className="battle-auto">
              <div className="auto-text">Combate automático en curso…</div>
            </div>
          )}

          {ended && !currentMessage && (
            <div className="battle-result">
              <div className="result-text">
                {battle.result === 'win'
                  ? '🏆 Victoria — recompensa aplicada'
                  : '💀 Derrota — vuelve al mapa y reintenta'}
              </div>
              <button className="btn pour" onClick={() => endBattle()}>
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CombatantCard({
  pkmn,
  moveName,
  side,
}: {
  pkmn: BattlePokemon
  moveName: string
  side: 'player' | 'enemy'
}) {
  const hpPct = (pkmn.hp / pkmn.maxHp) * 100
  const hpClass = hpPct < 25 ? 'low' : hpPct < 50 ? 'mid' : 'high'
  return (
    <div className={`combatant ${side}`}>
      <div className="combatant-info">
        <div className="combatant-name">
          {pkmn.name}{' '}
          <span className="combatant-types">[{pkmn.types.join('/')}]</span>
        </div>
        <div className="combatant-level">Lv {pkmn.level} · {moveName}</div>
        <div className="hp-bar">
          <div className={`hp-fill ${hpClass}`} style={{ width: `${hpPct}%` }} />
        </div>
        <div className="hp-text">
          {pkmn.hp}/{pkmn.maxHp} HP
        </div>
      </div>
      <img
        className="combatant-sprite"
        src={spriteUrlFor(pkmn.pokemonId)}
        alt={pkmn.name}
      />
    </div>
  )
}

function PartyDots({
  party,
  activeIdx,
}: {
  party: BattlePokemon[]
  activeIdx: number
}) {
  return (
    <div className="party-dots">
      {party.map((p, i) => {
        const alive = p.hp > 0
        const active = i === activeIdx
        return (
          <span
            key={i}
            className={`dot ${alive ? 'alive' : 'dead'} ${active ? 'active' : ''}`}
            title={`${p.name} ${p.hp}/${p.maxHp}`}
          />
        )
      })}
    </div>
  )
}
