import { useGameStore } from '../state/gameStore'
import { INGREDIENTS } from '../data/ingredients'

function hexColor(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`
}

export function Hud() {
  const phase = useGameStore((s) => s.phase)
  const party = useGameStore((s) => s.party)
  const inventory = useGameStore((s) => s.inventory)
  const selectedId = useGameStore((s) => s.selectedIngredientId)
  const selectIngredient = useGameStore((s) => s.selectIngredient)
  const collectibles = useGameStore((s) => s.collectibles)

  return (
    <>
      <div className="hud hud-top-left">
        <div className="hud-row">
          <span className="hud-label">Phase:</span>
          <span className="hud-value">{phase}</span>
        </div>
        <div className="hud-row">
          <span className="hud-label">Party:</span>
          <span className="hud-value">{party.length}/6</span>
        </div>
        <div className="hud-row">
          <span className="hud-label">Mapa:</span>
          <span className="hud-value">{collectibles.length} restantes</span>
        </div>
      </div>

      <div className="hud hud-bottom interactive">
        <div className="inventory-title">Ingredientes</div>
        <div className="inventory">
          {inventory.map((item) => {
            const def = INGREDIENTS[item.id]
            const isSelected = selectedId === item.id
            const disabled = item.qty <= 0
            return (
              <button
                key={item.id}
                className={`ingredient ${isSelected ? 'selected' : ''}`}
                disabled={disabled}
                onClick={() =>
                  selectIngredient(isSelected ? null : item.id)
                }
              >
                <span
                  className="ingredient-swatch"
                  style={{
                    background: def ? hexColor(def.color) : '#666',
                  }}
                />
                <span className="ingredient-name">{item.name}</span>
                <span className="ingredient-qty">×{item.qty}</span>
              </button>
            )
          })}
        </div>
        {party.length > 0 && (
          <>
            <div className="inventory-title party-title">Equipo</div>
            <div className="party">
              {party.map((m, i) => (
                <div key={i} className="party-member">
                  {m.name} <span className="lvl">Lv {m.level}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
