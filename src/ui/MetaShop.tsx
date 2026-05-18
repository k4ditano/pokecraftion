import { useMetaStore, UPGRADES, upgradeCost } from '../state/metaStore'

export function MetaShop({ onClose }: { onClose: () => void }) {
  const essences = useMetaStore((s) => s.essences)
  const unlocks = useMetaStore((s) => s.unlocks)
  const buyUpgrade = useMetaStore((s) => s.buyUpgrade)

  return (
    <div className="overlay-light">
      <div className="meta-shop">
        <div className="meta-shop-head">
          <div className="panel-title">Tienda de esencias</div>
          <div className="essences-counter">✨ {essences}</div>
        </div>
        <p className="meta-shop-hint">
          Las mejoras se aplican al iniciar cada nueva run y se guardan
          entre sesiones.
        </p>
        <div className="upgrade-list">
          {Object.values(UPGRADES).map((def) => {
            const lvl = unlocks[def.id] ?? 0
            const cost = upgradeCost(def.id, lvl)
            const canAfford = essences >= cost
            return (
              <div key={def.id} className="upgrade-row">
                <div className="upgrade-info">
                  <div className="upgrade-name">
                    {def.name}{' '}
                    <span className="dim">Lv {lvl}</span>
                  </div>
                  <div className="upgrade-desc">{def.desc}</div>
                </div>
                <button
                  className="btn pour"
                  disabled={!canAfford}
                  onClick={() => buyUpgrade(def.id)}
                >
                  {cost} ✨
                </button>
              </div>
            )
          })}
        </div>
        <div className="panel-actions">
          <button className="btn cancel" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
