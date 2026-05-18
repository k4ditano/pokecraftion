import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/gameStore'
import { INGREDIENTS } from '../data/ingredients'
import { getMove } from '../data/moves'

function hexColor(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`
}

const GRIND_RATE_PER_SEC = 0.7

export function Hud() {
  const party = useGameStore((s) => s.party)
  const inventory = useGameStore((s) => s.inventory)
  const collectibles = useGameStore((s) => s.collectibles)
  const cauldron = useGameStore((s) => s.cauldron)
  const water = useGameStore((s) => s.water)
  const gold = useGameStore((s) => s.gold)
  const mts = useGameStore((s) => s.mts)
  const pendingMovement = useGameStore((s) => s.pendingMovement)
  const pathNodes = useGameStore((s) => s.pathNodes)
  const currentNodeIdx = useGameStore((s) => s.currentNodeIdx)
  const runComplete = useGameStore((s) => s.runComplete)
  const addToCauldron = useGameStore((s) => s.addToCauldron)
  const cancelCauldron = useGameStore((s) => s.cancelCauldron)
  const pourCauldron = useGameStore((s) => s.pourCauldron)
  const pourWater = useGameStore((s) => s.pourWater)
  const openPath = useGameStore((s) => s.openPath)
  const openTeamPanel = useGameStore((s) => s.openTeamPanel)

  const busy = !!pendingMovement
  const cauldronDef = cauldron ? INGREDIENTS[cauldron.ingredientId] : null
  const nextNode = pathNodes[currentNodeIdx]

  return (
    <>
      <div className="hud hud-top-left">
        <div className="hud-row">
          <span className="hud-label">Agua:</span>
          <span className="hud-value">{water}</span>
        </div>
        <div className="hud-row">
          <span className="hud-label">Oro:</span>
          <span className="hud-value">{gold}⚜</span>
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

      <div className="hud hud-top-right interactive">
        <div className="hud-row">
          <span className="hud-label">Camino:</span>
          <span className="hud-value">
            {Math.min(currentNodeIdx + 1, pathNodes.length)}/{pathNodes.length}
          </span>
        </div>
        {nextNode && !runComplete && (
          <div className="hud-row">
            <span className="hud-label">Siguiente:</span>
            <span className="hud-value">{nextNode.label}</span>
          </div>
        )}
        <button
          className="btn path-btn"
          disabled={busy || !!cauldron}
          onClick={() => openPath()}
        >
          {runComplete ? 'Ver resumen' : 'Salir al camino'}
        </button>
      </div>

      <div className="hud hud-bottom interactive">
        <div className="hud-section">
          <div className="section-title">Ingredientes</div>
          <div className="inventory">
            {inventory.length === 0 && (
              <div className="empty">— sin ingredientes —</div>
            )}
            {inventory.map((item) => {
              const def = INGREDIENTS[item.id]
              const disabled = !!cauldron || busy || item.qty <= 0
              return (
                <button
                  key={item.id}
                  className="ingredient"
                  disabled={disabled}
                  onClick={() => addToCauldron(item.id)}
                  title="Añadir al caldero"
                >
                  <span
                    className="ingredient-swatch"
                    style={{ background: def ? hexColor(def.color) : '#666' }}
                  />
                  <span className="ingredient-name">{item.name}</span>
                  <span className="ingredient-qty">×{item.qty}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="hud-section cauldron-section">
          <div className="section-title">Caldero</div>
          {!cauldron && <div className="empty">— vacío —</div>}
          {cauldron && cauldronDef && (
            <div className="cauldron">
              <div className="cauldron-head">
                <span
                  className="ingredient-swatch big"
                  style={{ background: hexColor(cauldronDef.color) }}
                />
                <span className="cauldron-name">{cauldronDef.name}</span>
              </div>
              <div className="grind-bar">
                <div
                  className="grind-fill"
                  style={{
                    width: `${cauldron.grind * 100}%`,
                    background: hexColor(cauldronDef.color),
                  }}
                />
                <span className="grind-text">
                  Mortero {Math.round(cauldron.grind * 100)}%
                </span>
              </div>
              <div className="cauldron-actions">
                <MortarButton disabled={busy || cauldron.grind >= 1} />
                <button
                  className="btn pour"
                  disabled={busy || cauldron.grind <= 0}
                  onClick={() => pourCauldron()}
                >
                  Verter
                </button>
                <button
                  className="btn cancel"
                  disabled={busy}
                  onClick={() => cancelCauldron()}
                  title="Devolver al inventario"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hud-section water-section">
          <div className="section-title">Agua</div>
          <button
            className="btn water"
            disabled={busy || !!cauldron || water <= 0}
            onClick={() => pourWater()}
            title="Vierte agua: te lleva despacio al centro"
          >
            💧 Verter ({water})
          </button>
        </div>

        {party.length > 0 && (
          <div className="hud-section party-section">
            <div className="section-title">Equipo (click)</div>
            <div className="party">
              {party.map((m, i) => {
                const mv = getMove(m.move)
                return (
                  <button
                    key={i}
                    className="party-member clickable"
                    onClick={() => openTeamPanel(i)}
                    title="Ver y aplicar MTs"
                  >
                    {m.name} <span className="lvl">Lv {m.level}</span>
                    <span className="party-move">· {mv?.name ?? m.move}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="hud-section">
          <div className="section-title">MTs</div>
          {mts.length === 0 && <div className="empty">— sin MTs —</div>}
          {mts.length > 0 && (
            <div className="mts">
              {mts.map((mt) => {
                const mv = getMove(mt.moveId)
                return (
                  <div key={mt.id} className="mt-chip" title="Aplica via Equipo">
                    {mt.name}{' '}
                    <span className="dim">×{mt.qty}</span>{' '}
                    <span className="dim">· {mv?.type}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function MortarButton({ disabled }: { disabled: boolean }) {
  const incrementGrind = useGameStore((s) => s.incrementGrind)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)

  const stop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTsRef.current = null
  }

  const tick = (ts: number) => {
    const last = lastTsRef.current
    lastTsRef.current = ts
    if (last !== null) {
      const dt = (ts - last) / 1000
      incrementGrind(GRIND_RATE_PER_SEC * dt)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const start = () => {
    if (disabled) return
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => stop(), [])

  return (
    <button
      className="btn mortar"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      Mortero (mantén)
    </button>
  )
}
