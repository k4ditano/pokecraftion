import { useGameStore } from '../state/gameStore'
import { spriteUrlFor } from '../services/pokeapi'

interface StarterDef {
  defId: number
  name: string
  type: string
  blurb: string
}

const STARTERS: StarterDef[] = [
  {
    defId: 1,
    name: 'Bulbasaur',
    type: 'grass',
    blurb: 'Equilibrado. Empieza con Látigo Cepa.',
  },
  {
    defId: 4,
    name: 'Charmander',
    type: 'fire',
    blurb: 'Atacante rápido. Empieza con Ascuas.',
  },
  {
    defId: 7,
    name: 'Squirtle',
    type: 'water',
    blurb: 'Defensivo. Empieza con Pistola Agua.',
  },
]

export function StarterPicker() {
  const party = useGameStore((s) => s.party)
  const runComplete = useGameStore((s) => s.runComplete)
  const pickStarter = useGameStore((s) => s.pickStarter)

  if (runComplete) return null
  if (party.length > 0) return null

  return (
    <div className="overlay-light starter-overlay">
      <div className="starter-panel">
        <div className="panel-title">Elige tu compañero</div>
        <p className="panel-section">
          Será tu primer Pokémon en esta run. Captura más en el camino y
          gana medallas derrotando líderes.
        </p>
        <div className="starter-grid">
          {STARTERS.map((s) => (
            <button
              key={s.defId}
              className={`starter-card type-${s.type}`}
              onClick={() => pickStarter(s.defId, s.name)}
            >
              <img
                src={spriteUrlFor(s.defId)}
                alt={s.name}
                draggable={false}
              />
              <div className="starter-name">{s.name}</div>
              <div className="starter-type">[{s.type}]</div>
              <div className="starter-blurb">{s.blurb}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
