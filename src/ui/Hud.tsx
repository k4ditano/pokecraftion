import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { INGREDIENTS } from '../data/ingredients'
import { getMove } from '../data/moves'
import { MAP_CENTER } from '../data/map'
import { spriteUrlFor } from '../services/pokeapi'

function hexColor(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`
}

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
  const pourWater = useGameStore((s) => s.pourWater)
  const openPath = useGameStore((s) => s.openPath)
  const openTeamPanel = useGameStore((s) => s.openTeamPanel)
  const healAtSpring = useGameStore((s) => s.healAtSpring)
  const playerPos = useGameStore((s) => s.playerPos)
  const atCenter =
    Math.hypot(playerPos.x - MAP_CENTER.x, playerPos.y - MAP_CENTER.y) <= 60

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
                  <span className="ingredient-qty">x{item.qty}</span>
                </button>
              )
            })}
          </div>
        </div>

        <ToolDock />

        <div className="hud-section cauldron-section">
          <div className="section-title">Caldero</div>
          {!cauldron && (
            <>
              <div
                id="cauldron-drop-target"
                className="cauldron-vessel"
                style={
                  { '--cauldron-liquid': 'rgba(120, 100, 70, 0.5)' } as React.CSSProperties
                }
              />
              <div className="empty">— vacío —</div>
            </>
          )}
          {cauldron && cauldronDef && (
            <div className="cauldron">
              <div
                id="cauldron-drop-target"
                className="cauldron-vessel"
                style={
                  { '--cauldron-liquid': hexColor(cauldronDef.color) } as React.CSSProperties
                }
              />
              <div className="cauldron-name">{cauldronDef.name}</div>
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
                <button
                  className="btn cancel"
                  disabled={busy}
                  onClick={() => cancelCauldron()}
                  title="Devolver al inventario"
                >
                  ✕ Cancelar
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
          <button
            className="btn water"
            disabled={busy || !!cauldron || water <= 0 || !atCenter || party.length === 0}
            onClick={() => healAtSpring()}
            title={
              atCenter
                ? 'Manantial: cura todo el equipo. Cuesta 1 agua.'
                : 'Ve al pozo central para usar el manantial.'
            }
          >
            ♨ Manantial
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

type ToolKind = 'fire' | 'rock'

interface DraggedTool {
  kind: ToolKind
  defId: number
  label: string
}

const TOOLS: DraggedTool[] = [
  { kind: 'fire', defId: 4, label: 'Charmander' },
  { kind: 'rock', defId: 74, label: 'Geodude' },
]

function ToolDock() {
  const cauldron = useGameStore((s) => s.cauldron)
  const pendingMovement = useGameStore((s) => s.pendingMovement)
  const isPouring = useGameStore((s) => s.isPouring)
  const pourCauldron = useGameStore((s) => s.pourCauldron)
  const stopPour = useGameStore((s) => s.stopPour)
  const incrementGrind = useGameStore((s) => s.incrementGrind)

  const [dragging, setDragging] = useState<DraggedTool | null>(null)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })
  const overTargetRef = useRef(false)

  // Always-fresh refs to avoid stale closures inside global listeners.
  const stateRef = useRef({
    isPouring,
    cauldron,
    pourCauldron,
    stopPour,
    incrementGrind,
  })
  stateRef.current = {
    isPouring,
    cauldron,
    pourCauldron,
    stopPour,
    incrementGrind,
  }

  useEffect(() => {
    if (!dragging) return

    let rafId: number | null = null
    let lastTs: number | null = null

    const checkOver = (x: number, y: number): boolean => {
      const el = document.getElementById('cauldron-drop-target')
      if (!el) return false
      const r = el.getBoundingClientRect()
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }

    const applyEnter = () => {
      const s = stateRef.current
      if (!s.cauldron) return
      if (dragging.kind === 'fire' && !s.isPouring) s.pourCauldron()
    }

    const applyLeave = () => {
      const s = stateRef.current
      if (dragging.kind === 'fire' && s.isPouring) s.stopPour()
    }

    const tick = (ts: number) => {
      const last = lastTs
      lastTs = ts
      const s = stateRef.current
      if (
        last !== null &&
        overTargetRef.current &&
        dragging.kind === 'rock' &&
        s.cauldron &&
        s.cauldron.grind < 1
      ) {
        const dt = (ts - last) / 1000
        s.incrementGrind(0.7 * dt)
      }
      rafId = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY })
      const isOver = checkOver(e.clientX, e.clientY)
      const wasOver = overTargetRef.current
      if (isOver !== wasOver) {
        overTargetRef.current = isOver
        if (isOver) applyEnter()
        else applyLeave()
      }
    }

    const onUp = () => {
      if (overTargetRef.current) applyLeave()
      overTargetRef.current = false
      setDragging(null)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    rafId = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (overTargetRef.current) applyLeave()
      overTargetRef.current = false
    }
  }, [dragging])

  const startDrag = (tool: DraggedTool) => (e: React.PointerEvent) => {
    e.preventDefault()
    setPointerPos({ x: e.clientX, y: e.clientY })
    setDragging(tool)
  }

  const busy = !!pendingMovement

  return (
    <>
      <div className="hud-section tools-section">
        <div className="section-title">Herramientas</div>
        <div className="tool-dock">
          {TOOLS.map((t) => (
            <button
              key={t.kind}
              className={`tool-btn tool-${t.kind} ${dragging?.kind === t.kind ? 'dragging' : ''}`}
              onPointerDown={startDrag(t)}
              disabled={busy && t.kind !== 'fire'}
              title={
                t.kind === 'fire'
                  ? 'Arrastra al caldero para verter (mantén dentro = calor)'
                  : 'Arrastra al caldero y mantén dentro para moler'
              }
            >
              <img src={spriteUrlFor(t.defId)} alt={t.label} draggable={false} />
              <span>{t.kind === 'fire' ? 'Calor' : 'Mortero'}</span>
            </button>
          ))}
        </div>
      </div>

      {dragging && (
        <img
          src={spriteUrlFor(dragging.defId)}
          alt=""
          className="tool-ghost"
          style={{ left: pointerPos.x, top: pointerPos.y }}
          draggable={false}
        />
      )}
    </>
  )
}
