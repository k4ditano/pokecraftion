import { useGameStore } from '../state/gameStore'

export function Hud() {
  const phase = useGameStore((s) => s.phase)
  const party = useGameStore((s) => s.party)

  return (
    <div className="hud">
      <div className="hud-row">
        <span className="hud-label">Phase:</span>
        <span className="hud-value">{phase}</span>
      </div>
      <div className="hud-row">
        <span className="hud-label">Party:</span>
        <span className="hud-value">{party.length}/6</span>
      </div>
    </div>
  )
}
