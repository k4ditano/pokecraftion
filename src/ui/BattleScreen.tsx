import { useGameStore } from '../state/gameStore'
import { spriteUrlFor } from '../services/pokeapi'
import { getMove } from '../data/moves'
import type { BattlePokemon } from '../battle/battle'

export function BattleScreen() {
  const battle = useGameStore((s) => s.battle)
  const chooseBattleMove = useGameStore((s) => s.chooseBattleMove)
  const nextBattleMessage = useGameStore((s) => s.nextBattleMessage)
  const endBattle = useGameStore((s) => s.endBattle)

  if (!battle) return null

  const player = battle.playerParty[battle.playerActiveIdx]
  const enemy = battle.enemyParty[battle.enemyActiveIdx]
  const currentMessage = battle.messages[0]
  const ended = battle.result !== null
  const isMessagePhase = !!currentMessage
  const canChoose = !isMessagePhase && !ended

  return (
    <div className="battle-overlay">
      <div className="battle-screen">
        <div className="battle-arena">
          <div className="battle-side enemy">
            <CombatantCard pkmn={enemy} side="enemy" />
            <PartyDots
              party={battle.enemyParty}
              activeIdx={battle.enemyActiveIdx}
            />
          </div>
          <div className="battle-side player">
            <CombatantCard pkmn={player} side="player" />
            <PartyDots
              party={battle.playerParty}
              activeIdx={battle.playerActiveIdx}
            />
          </div>
        </div>

        <div className="battle-controls">
          {isMessagePhase && (
            <div className="battle-message">
              <div className="message-text">{currentMessage}</div>
              <button className="btn pour" onClick={() => nextBattleMessage()}>
                Siguiente ▶
              </button>
            </div>
          )}

          {canChoose && (
            <div className="move-grid">
              {player.moves.map((moveId, i) => {
                const m = getMove(moveId)
                if (!m) return null
                return (
                  <button
                    key={i}
                    className={`btn move type-${m.type}`}
                    onClick={() => chooseBattleMove(i)}
                  >
                    <div className="move-name">{m.name}</div>
                    <div className="move-meta">
                      {m.type} · pot {m.power} · prec {m.accuracy}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {ended && !isMessagePhase && (
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
  side,
}: {
  pkmn: BattlePokemon
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
        <div className="combatant-level">Lv {pkmn.level}</div>
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
