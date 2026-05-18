import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { spriteUrlFor } from '../services/pokeapi'
import type { BattlePokemon } from '../battle/battle'

const NORMAL_TICK_MS = 950
const FAST_TICK_MS = 90
const FLASH_DURATION_MS = 420

export function BattleScreen() {
  const battle = useGameStore((s) => s.battle)
  const advanceBattleTurn = useGameStore((s) => s.advanceBattleTurn)
  const endBattle = useGameStore((s) => s.endBattle)

  const [fast, setFast] = useState(false)
  const tickRef = useRef<number | null>(null)

  const isOpen = !!battle
  const ended = battle?.result != null

  useEffect(() => {
    if (!isOpen || ended) {
      if (tickRef.current !== null) {
        clearTimeout(tickRef.current)
        tickRef.current = null
      }
      return
    }
    if (tickRef.current !== null) {
      clearTimeout(tickRef.current)
    }
    const delay = fast ? FAST_TICK_MS : NORMAL_TICK_MS
    tickRef.current = window.setTimeout(() => {
      advanceBattleTurn()
    }, delay)
    return () => {
      if (tickRef.current !== null) {
        clearTimeout(tickRef.current)
        tickRef.current = null
      }
    }
  }, [isOpen, ended, fast, advanceBattleTurn, battle?.lastAction?.ts])

  if (!battle) return null

  return (
    <div className="battle-overlay-v2">
      <div className="battle-top-bar">
        <button
          className={`skip-btn ${fast ? 'on' : ''}`}
          onClick={() => setFast((v) => !v)}
        >
          {fast ? '▶▶ Acelerando' : 'SKIP'}
        </button>
        <div className="battle-vs">
          Tú vs {battle.trainerName}
        </div>
      </div>

      <div className="battle-grid">
        <BattleColumn
          label="TU EQUIPO"
          side="player"
          trainerSprite="/assets/trainer-0.png"
          party={battle.playerParty}
          activeIdx={battle.playerActiveIdx}
          lastAction={battle.lastAction}
        />
        <BattleColumn
          label="RIVAL"
          side="enemy"
          trainerSprite={trainerSpriteFor(battle.trainerName)}
          party={battle.enemyParty}
          activeIdx={battle.enemyActiveIdx}
          lastAction={battle.lastAction}
        />
      </div>

      {ended && (
        <div className="battle-result-modal">
          <div className="result-text">
            {battle.result === 'win'
              ? '🏆 Victoria'
              : '💀 Derrota'}
          </div>
          <button className="btn pour" onClick={() => endBattle()}>
            Continuar
          </button>
        </div>
      )}
    </div>
  )
}

const TRAINER_SPRITES: Record<string, string> = {
  'Joven Brian': '/assets/trainer-1.png',
  Carla: '/assets/trainer-2.png',
  'Daniel el Cazador': '/assets/trainer-3.png',
  'Líder Brock': '/assets/trainer-4.png',
}

function trainerSpriteFor(name: string): string {
  return TRAINER_SPRITES[name] ?? '/assets/trainer-1.png'
}

function BattleColumn({
  label,
  side,
  trainerSprite,
  party,
  activeIdx,
  lastAction,
}: {
  label: string
  side: 'player' | 'enemy'
  trainerSprite: string
  party: BattlePokemon[]
  activeIdx: number
  lastAction: {
    side: 'player' | 'enemy'
    defenderIdx: number
    moveType: string
    ts: number
  } | null
}) {
  return (
    <div className={`battle-col ${side}`}>
      <div className="trainer-header">
        <img src={trainerSprite} alt="" className="trainer-sprite-img" />
      </div>
      <div className="team-label">{label}</div>
      {party.map((p, i) => {
        const isActive = i === activeIdx
        const isDefenderHit =
          lastAction !== null &&
          lastAction.side !== side &&
          lastAction.defenderIdx === i
        return (
          <BattleRow
            key={i}
            pkmn={p}
            active={isActive}
            hitTs={isDefenderHit ? lastAction.ts : null}
            moveType={isDefenderHit ? lastAction.moveType : null}
          />
        )
      })}
    </div>
  )
}

function BattleRow({
  pkmn,
  active,
  hitTs,
  moveType,
}: {
  pkmn: BattlePokemon
  active: boolean
  hitTs: number | null
  moveType: string | null
}) {
  const [flashing, setFlashing] = useState<{ ts: number; type: string } | null>(null)

  useEffect(() => {
    if (hitTs && moveType) {
      setFlashing({ ts: hitTs, type: moveType })
      const t = window.setTimeout(() => {
        setFlashing((cur) => (cur && cur.ts === hitTs ? null : cur))
      }, FLASH_DURATION_MS)
      return () => clearTimeout(t)
    }
  }, [hitTs, moveType])

  const dead = pkmn.hp <= 0
  const hpPct = (pkmn.hp / pkmn.maxHp) * 100
  const hpClass = hpPct < 25 ? 'low' : hpPct < 50 ? 'mid' : 'high'
  const flashClass = flashing ? `flash flash-${flashing.type}` : ''

  return (
    <div
      className={`battle-row ${active ? 'active' : ''} ${dead ? 'dead' : ''} ${flashClass}`}
    >
      <div className="row-name">
        {pkmn.name} <span className="row-lvl">Lv{pkmn.level}</span>
      </div>
      <div className="row-hpbar">
        <div className={`row-hpfill ${hpClass}`} style={{ width: `${hpPct}%` }} />
        <span className="row-hp-text">
          {pkmn.hp}/{pkmn.maxHp}
        </span>
      </div>
      <div className="row-platform">
        <img
          className="row-sprite"
          src={spriteUrlFor(pkmn.pokemonId)}
          alt={pkmn.name}
        />
      </div>
    </div>
  )
}
