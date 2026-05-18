import { useGameStore } from '../state/gameStore'
import { spriteUrlFor } from '../services/pokeapi'
import { getMove } from '../data/moves'
import { getPokemonData } from '../data/pokemonData'

export function TeamMemberPanel() {
  const teamPanelIdx = useGameStore((s) => s.teamPanelIdx)
  const party = useGameStore((s) => s.party)
  const mts = useGameStore((s) => s.mts)
  const closeTeamPanel = useGameStore((s) => s.closeTeamPanel)
  const applyMt = useGameStore((s) => s.applyMt)

  if (teamPanelIdx === null) return null
  const member = party[teamPanelIdx]
  if (!member) return null

  const data = getPokemonData(member.pokemonId)
  const currentMove = getMove(member.move)

  return (
    <div className="overlay-light">
      <div className="team-panel">
        <div className="team-head">
          <img
            className="team-sprite"
            src={spriteUrlFor(member.pokemonId)}
            alt={member.name}
          />
          <div className="team-info">
            <div className="team-name">{member.name}</div>
            <div className="team-meta">
              Lv {member.level} · [{data.types.join('/')}]
            </div>
            <div className="team-meta">
              HP {member.maxHp} · ATK ~{Math.floor((2 * data.baseAtk * member.level) / 100) + 5}
              {' '}· DEF ~{Math.floor((2 * data.baseDef * member.level) / 100) + 5}
              {' '}· SPD ~{Math.floor((2 * data.baseSpd * member.level) / 100) + 5}
            </div>
            <div className="team-move">
              Movimiento actual:{' '}
              <strong>{currentMove?.name ?? member.move}</strong>{' '}
              <span className="dim">
                ({currentMove?.type}, pot {currentMove?.power})
              </span>
            </div>
          </div>
        </div>

        <div className="team-mts">
          <div className="panel-label">MTs disponibles</div>
          {mts.length === 0 && (
            <div className="empty">— no tienes MTs —</div>
          )}
          {mts.map((mt) => {
            const move = getMove(mt.moveId)
            const sameAsCurrent = mt.moveId === member.move
            return (
              <div key={mt.id} className="mt-row">
                <span>
                  {mt.name}{' '}
                  <span className="dim">
                    · {move?.type} · pot {move?.power}
                  </span>
                </span>
                <button
                  className="btn pour"
                  disabled={sameAsCurrent}
                  onClick={() => applyMt(mt.id, teamPanelIdx)}
                  title={sameAsCurrent ? 'Ya tiene este movimiento' : 'Reemplaza el movimiento actual'}
                >
                  Aplicar (×{mt.qty})
                </button>
              </div>
            )
          })}
        </div>

        <div className="panel-actions">
          <button className="btn cancel" onClick={() => closeTeamPanel()}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
