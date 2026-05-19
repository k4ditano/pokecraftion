import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { useMetaStore } from '../state/metaStore'
import { INGREDIENTS } from '../data/ingredients'
import { arenaFor } from '../data/arenas'
import { getMove } from '../data/moves'
import { MAP_CENTER } from '../data/map'
import { spriteUrlFor } from '../services/pokeapi'
import { clearRun } from '../services/runSave'

function hexColor(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`
}

export function Hud() {
  const party = useGameStore((s) => s.party)
  const inventory = useGameStore((s) => s.inventory)
  const restartRun = useGameStore((s) => s.restartRun)
  const medals = useMetaStore((s) => s.medals)
  const bossesDefeated = useMetaStore((s) => s.bossesDefeated)
  const arena = arenaFor(bossesDefeated.length)
  const cauldron = useGameStore((s) => s.cauldron)
  const water = useGameStore((s) => s.water)
  const gold = useGameStore((s) => s.gold)
  const mts = useGameStore((s) => s.mts)
  const pendingMovement = useGameStore((s) => s.pendingMovement)
  const pathNodes = useGameStore((s) => s.pathNodes)
  const currentNodeIdx = useGameStore((s) => s.currentNodeIdx)
  const runComplete = useGameStore((s) => s.runComplete)
  const openPath = useGameStore((s) => s.openPath)
  const openTeamPanel = useGameStore((s) => s.openTeamPanel)
  const healAtSpring = useGameStore((s) => s.healAtSpring)
  const playerPos = useGameStore((s) => s.playerPos)
  const atCenter =
    Math.hypot(playerPos.x - MAP_CENTER.x, playerPos.y - MAP_CENTER.y) <= 60

  const busy = !!pendingMovement
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
          <span className="hud-label">Medallas:</span>
          <span className="hud-value">{medals}</span>
        </div>
        <div className="hud-row">
          <span className="hud-label">Party:</span>
          <span className="hud-value">{party.length}/6</span>
        </div>
      </div>

      <div className="hud hud-top-right interactive">
        <div className="hud-row">
          <span className="hud-label">Arena:</span>
          <span className="hud-value">{arena.name}</span>
        </div>
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
        <button
          className="btn cancel"
          style={{ marginTop: 4, fontSize: 12 }}
          onClick={() => {
            if (
              window.confirm(
                'Abandonar la run actual? Pierdes el progreso de esta partida (las medallas y mejoras se conservan).',
              )
            ) {
              clearRun()
              restartRun()
            }
          }}
        >
          Abandonar
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
                <IngredientDraggable
                  key={item.id}
                  itemId={item.id}
                  name={item.name}
                  qty={item.qty}
                  color={def ? def.color : 0x666666}
                  sprite={def?.sprite}
                  disabled={disabled}
                />
              )
            })}
          </div>
        </div>

        <ToolDock />

        <div className="hud-section cauldron-section">
          <div className="section-title">Caldero</div>
          <CauldronView />
        </div>

        <div className="hud-section water-section">
          <div className="section-title">Agua · {water}</div>
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

interface Particle {
  id: number
  x: number
  y: number
  vx: number
}

function CauldronView() {
  const cauldron = useGameStore((s) => s.cauldron)
  const isPouring = useGameStore((s) => s.isPouring)
  const pendingMovement = useGameStore((s) => s.pendingMovement)
  const cancelCauldron = useGameStore((s) => s.cancelCauldron)

  const def = cauldron ? INGREDIENTS[cauldron.ingredientId] : null
  const busy = !!pendingMovement
  const colorHex = def ? hexColor(def.color) : '#666'

  const [particles, setParticles] = useState<Particle[]>([])
  const lastGrindRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const idRef = useRef(0)

  useEffect(() => {
    if (!cauldron) {
      lastGrindRef.current = 0
      return
    }
    const prev = lastGrindRef.current
    const curr = cauldron.grind
    lastGrindRef.current = curr
    if (curr <= prev) return
    const now = performance.now()
    if (now - lastSpawnRef.current < 90) return
    lastSpawnRef.current = now
    const id = ++idRef.current
    const p: Particle = {
      id,
      x: 70 + (Math.random() - 0.5) * 50,
      y: 38 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 30,
    }
    setParticles((ps) => [...ps, p])
    window.setTimeout(() => {
      setParticles((ps) => ps.filter((q) => q.id !== id))
    }, 750)
  }, [cauldron, cauldron?.grind])

  if (!cauldron || !def) {
    return (
      <>
        <div
          id="cauldron-drop-target"
          className="cauldron-vessel cauldron-empty"
        >
          <div className="cauldron-hint">arrastra aquí</div>
        </div>
        <div className="empty">— vacío —</div>
      </>
    )
  }

  const grind = cauldron.grind
  const stateClass = isPouring
    ? 'cauldron-state-pouring'
    : grind >= 0.99
      ? 'cauldron-state-ground'
      : grind > 0
        ? 'cauldron-state-grinding'
        : 'cauldron-state-whole'

  return (
    <div className="cauldron">
      <div
        id="cauldron-drop-target"
        className={`cauldron-vessel ${stateClass}`}
        style={
          {
            '--cauldron-liquid': colorHex,
            '--herb-color': colorHex,
            '--herb-scale': String(1 - grind * 0.7),
          } as React.CSSProperties
        }
      >
        {!isPouring && grind < 0.99 && def.sprite && (
          <div
            className="cauldron-herb-stage"
            style={{ ['--grind' as string]: String(grind) }}
          >
            <img
              className="cauldron-herb-half left"
              src={def.sprite}
              alt=""
              draggable={false}
            />
            <img
              className="cauldron-herb-half right"
              src={def.sprite}
              alt=""
              draggable={false}
            />
          </div>
        )}
        {!isPouring && grind >= 0.99 && <div className="cauldron-pile" />}
        {isPouring && (
          <>
            <div className="cauldron-liquid" />
            <PourBubbles color={colorHex} />
            <FireFlames />
          </>
        )}
        {particles.map((p) => (
          <span
            key={p.id}
            className="cauldron-particle"
            style={{
              left: p.x,
              top: p.y,
              background: colorHex,
              ['--vx' as string]: `${p.vx}px`,
            }}
          />
        ))}
      </div>
      <div className="cauldron-name">{def.name}</div>
      <div className="grind-bar">
        <div
          className="grind-fill"
          style={{ width: `${grind * 100}%`, background: colorHex }}
        />
        <span className="grind-text">Mortero {Math.round(grind * 100)}%</span>
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
  )
}

function FireFlames() {
  const [flames, setFlames] = useState<{ id: number; x: number; size: number }[]>([])
  const idRef = useRef(0)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const id = ++idRef.current
      const x = 32 + Math.random() * 48
      const size = 6 + Math.floor(Math.random() * 4)
      setFlames((f) => [...f, { id, x, size }])
      window.setTimeout(() => {
        setFlames((f) => f.filter((ff) => ff.id !== id))
      }, 700)
    }, 160)
    return () => clearInterval(interval)
  }, [])
  return (
    <>
      {flames.map((f) => (
        <span
          key={f.id}
          className="cauldron-flame"
          style={{
            left: f.x,
            width: f.size,
            height: f.size * 1.5,
          }}
        />
      ))}
    </>
  )
}

function PourBubbles({ color }: { color: string }) {
  const [bubbles, setBubbles] = useState<{ id: number; x: number; size: number }[]>([])
  const idRef = useRef(0)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const id = ++idRef.current
      const x = 28 + Math.random() * 56
      const size = 4 + Math.floor(Math.random() * 5)
      setBubbles((b) => [...b, { id, x, size }])
      window.setTimeout(() => {
        setBubbles((b) => b.filter((bb) => bb.id !== id))
      }, 900)
    }, 220)
    return () => clearInterval(interval)
  }, [])
  return (
    <>
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="cauldron-bubble"
          style={{
            left: b.x,
            width: b.size,
            height: b.size,
            background: color,
          }}
        />
      ))}
    </>
  )
}

function IngredientDraggable({
  itemId,
  name,
  qty,
  color,
  sprite,
  disabled,
}: {
  itemId: string
  name: string
  qty: number
  color: number
  sprite?: string
  disabled: boolean
}) {
  const addToCauldron = useGameStore((s) => s.addToCauldron)
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const overRef = useRef(false)

  useEffect(() => {
    if (!dragging) return

    const checkOver = (x: number, y: number): boolean => {
      const el = document.getElementById('cauldron-drop-target')
      if (!el) return false
      const r = el.getBoundingClientRect()
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }

    const onMove = (e: PointerEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      overRef.current = checkOver(e.clientX, e.clientY)
    }
    const onUp = () => {
      if (overRef.current) addToCauldron(itemId)
      overRef.current = false
      setDragging(false)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, itemId, addToCauldron])

  const start = (e: React.PointerEvent) => {
    if (disabled) return
    e.preventDefault()
    setPos({ x: e.clientX, y: e.clientY })
    setDragging(true)
  }

  const colorHex = hexColor(color)

  return (
    <>
      <div
        className={`ingredient ${disabled ? 'disabled' : ''} ${dragging ? 'dragging' : ''}`}
        onPointerDown={start}
        title="Arrastra al caldero"
      >
        {sprite ? (
          <img
            className="ingredient-sprite"
            src={sprite}
            alt={name}
            draggable={false}
          />
        ) : (
          <span
            className="ingredient-swatch"
            style={{ background: colorHex }}
          />
        )}
        <span className="ingredient-name">{name}</span>
        <span className="ingredient-qty">x{qty}</span>
      </div>
      {dragging && (
        sprite ? (
          <img
            className="ingredient-ghost ingredient-ghost-img"
            src={sprite}
            alt=""
            draggable={false}
            style={{ left: pos.x, top: pos.y }}
          />
        ) : (
          <span
            className="ingredient-ghost"
            style={{
              left: pos.x,
              top: pos.y,
              background: colorHex,
            }}
          />
        )
      )}
    </>
  )
}

type ToolKind = 'fire' | 'rock' | 'water'

interface DraggedTool {
  kind: ToolKind
  defId: number
  label: string
}

const TOOLS: DraggedTool[] = [
  { kind: 'fire', defId: 4, label: 'Charmander' },
  { kind: 'rock', defId: 74, label: 'Geodude' },
  { kind: 'water', defId: 7, label: 'Squirtle' },
]

function ToolDock() {
  const cauldron = useGameStore((s) => s.cauldron)
  const pendingMovement = useGameStore((s) => s.pendingMovement)
  const isPouring = useGameStore((s) => s.isPouring)
  const isWatering = useGameStore((s) => s.isWatering)
  const water = useGameStore((s) => s.water)
  const pourCauldron = useGameStore((s) => s.pourCauldron)
  const stopPour = useGameStore((s) => s.stopPour)
  const incrementGrind = useGameStore((s) => s.incrementGrind)
  const startWaterFlow = useGameStore((s) => s.startWaterFlow)
  const stopWaterFlow = useGameStore((s) => s.stopWaterFlow)

  const [dragging, setDragging] = useState<DraggedTool | null>(null)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })
  const overTargetRef = useRef(false)

  const stateRef = useRef({
    isPouring,
    isWatering,
    water,
    cauldron,
    pourCauldron,
    stopPour,
    incrementGrind,
    startWaterFlow,
    stopWaterFlow,
  })
  stateRef.current = {
    isPouring,
    isWatering,
    water,
    cauldron,
    pourCauldron,
    stopPour,
    incrementGrind,
    startWaterFlow,
    stopWaterFlow,
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

    // All three tools require the pokémon to stay over the cauldron.
    // Leave the zone → effect stops. Release pokémon → effect stops.

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
        s.incrementGrind(0.22 * dt)
      }
      rafId = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY })
      const isOver = checkOver(e.clientX, e.clientY)
      const wasOver = overTargetRef.current
      if (isOver === wasOver) return
      overTargetRef.current = isOver
      const s = stateRef.current
      if (dragging.kind === 'fire') {
        if (isOver && s.cauldron && !s.isPouring) s.pourCauldron()
        else if (!isOver && s.isPouring) s.stopPour()
      } else if (dragging.kind === 'water') {
        if (isOver && !s.cauldron && !s.isWatering && s.water > 0) {
          s.startWaterFlow()
        } else if (!isOver && s.isWatering) {
          s.stopWaterFlow()
        }
      }
    }

    const onUp = () => {
      const s = stateRef.current
      if (dragging.kind === 'fire' && s.isPouring) s.stopPour()
      if (dragging.kind === 'water' && s.isWatering) s.stopWaterFlow()
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
      const s = stateRef.current
      if (s.isPouring) s.stopPour()
      if (s.isWatering) s.stopWaterFlow()
      overTargetRef.current = false
    }
  }, [dragging])

  const startDrag = (tool: DraggedTool) => (e: React.PointerEvent) => {
    e.preventDefault()
    setPointerPos({ x: e.clientX, y: e.clientY })
    setDragging(tool)
  }

  const busy = !!pendingMovement

  const labelFor = (k: ToolKind): string =>
    k === 'fire' ? 'Calor' : k === 'rock' ? 'Mortero' : 'Agua'
  const titleFor = (k: ToolKind): string => {
    if (k === 'fire') return 'Charmander · arrastra y mantén sobre caldero para que la poción avance'
    if (k === 'rock') return 'Geodude · mantén sobre caldero para moler'
    return 'Squirtle · mantén sobre caldero para volver poco a poco al centro (consume agua)'
  }
  const disabledFor = (k: ToolKind): boolean => {
    if (k === 'fire') return !cauldron
    if (k === 'rock') return !cauldron || busy
    return !!cauldron || busy || water <= 0
  }

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
              disabled={disabledFor(t.kind)}
              title={titleFor(t.kind)}
            >
              <img src={spriteUrlFor(t.defId)} alt={t.label} draggable={false} />
              <span>{labelFor(t.kind)}</span>
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
