import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import type { NodeType, RunNode } from '../game/types'

const NODE_ICON: Record<NodeType, string> = {
  trainer: '🗡️',
  elite: '⚔️',
  boss: '👑',
  merchant: '🏪',
  event: '❓',
}

export function PathScreen() {
  const isPathOpen = useGameStore((s) => s.isPathOpen)
  const pathNodes = useGameStore((s) => s.pathNodes)
  const currentNodeIdx = useGameStore((s) => s.currentNodeIdx)
  const runComplete = useGameStore((s) => s.runComplete)
  const closePath = useGameStore((s) => s.closePath)

  const [engagedIdx, setEngagedIdx] = useState<number | null>(null)

  if (!isPathOpen) return null

  const engagedNode =
    engagedIdx !== null ? pathNodes[engagedIdx] : null

  return (
    <div className="path-overlay">
      <div className="path-screen">
        <div className="path-header">
          <div className="path-title">Camino de la run</div>
          <button className="btn cancel" onClick={() => closePath()}>
            ✕ Volver a preparar
          </button>
        </div>

        {runComplete && (
          <div className="run-complete">
            🏆 Run completada. Has derrotado al jefe.
          </div>
        )}

        <div className="nodes">
          {pathNodes.map((node, i) => {
            const status =
              i < currentNodeIdx
                ? 'done'
                : i === currentNodeIdx && !runComplete
                  ? 'current'
                  : 'future'
            return (
              <div
                key={node.id}
                className={`node ${status} type-${node.type}`}
              >
                <div className="node-icon">{NODE_ICON[node.type]}</div>
                <div className="node-label">{node.label}</div>
                {status === 'current' && (
                  <button
                    className="btn engage"
                    onClick={() => setEngagedIdx(i)}
                  >
                    Enfrentar
                  </button>
                )}
                {status === 'done' && <div className="node-done">✓</div>}
                {status === 'future' && (
                  <div className="node-preview">
                    {previewLine(node)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {engagedNode && (
          <NodePanel
            node={engagedNode}
            onClose={() => setEngagedIdx(null)}
          />
        )}
      </div>
    </div>
  )
}

function previewLine(node: RunNode): string {
  switch (node.type) {
    case 'trainer':
    case 'elite':
    case 'boss':
      return node.pokemons.map((p) => `${p.name} L${p.level}`).join(', ')
    case 'merchant':
      return `${node.offers.length} ofertas`
    case 'event':
      return 'Encuentro'
  }
}

function NodePanel({
  node,
  onClose,
}: {
  node: RunNode
  onClose: () => void
}) {
  switch (node.type) {
    case 'trainer':
    case 'elite':
    case 'boss':
      return <TrainerPanel node={node} onClose={onClose} />
    case 'merchant':
      return <MerchantPanel node={node} onClose={onClose} />
    case 'event':
      return <EventPanel node={node} onClose={onClose} />
  }
}

function TrainerPanel({
  node,
  onClose,
}: {
  node: Extract<RunNode, { type: 'trainer' | 'elite' | 'boss' }>
  onClose: () => void
}) {
  const resolveTrainerNode = useGameStore((s) => s.resolveTrainerNode)
  return (
    <div className="node-panel">
      <div className="panel-title">{node.trainerName}</div>
      <div className="panel-section">
        <div className="panel-label">Pokémon</div>
        <ul className="poke-list">
          {node.pokemons.map((p, i) => (
            <li key={i}>
              #{p.defId} {p.name} <span className="lvl">L{p.level}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel-section">
        <div className="panel-label">Recompensa</div>
        <div className="reward">
          +{node.reward.gold}⚜ ·{' '}
          {node.reward.ingredients
            .map((r) => `${r.qty}× ${r.id}`)
            .join(', ')}
        </div>
      </div>
      <div className="panel-actions">
        <button
          className="btn pour"
          onClick={() => {
            resolveTrainerNode(node.id)
            onClose()
          }}
        >
          Combatir (stub: victoria automática)
        </button>
        <button className="btn cancel" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

function MerchantPanel({
  node,
  onClose,
}: {
  node: Extract<RunNode, { type: 'merchant' }>
  onClose: () => void
}) {
  const gold = useGameStore((s) => s.gold)
  const buyMerchantOffer = useGameStore((s) => s.buyMerchantOffer)
  const finishMerchant = useGameStore((s) => s.finishMerchant)
  return (
    <div className="node-panel">
      <div className="panel-title">Mercader · {gold}⚜</div>
      <div className="panel-section">
        {node.offers.length === 0 && (
          <div className="empty">Sin ofertas restantes.</div>
        )}
        <ul className="offers">
          {node.offers.map((o, i) => (
            <li key={i} className="offer">
              <span>
                {o.qty}× {o.name}
              </span>
              <button
                className="btn pour"
                disabled={gold < o.price}
                onClick={() => buyMerchantOffer(node.id, i)}
              >
                Comprar {o.price}⚜
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel-actions">
        <button
          className="btn cancel"
          onClick={() => {
            finishMerchant(node.id)
            onClose()
          }}
        >
          Salir del mercader
        </button>
      </div>
    </div>
  )
}

function EventPanel({
  node,
  onClose,
}: {
  node: Extract<RunNode, { type: 'event' }>
  onClose: () => void
}) {
  const applyEventOption = useGameStore((s) => s.applyEventOption)
  return (
    <div className="node-panel">
      <div className="panel-title">{node.label}</div>
      <div className="panel-section">
        <p>{node.description}</p>
      </div>
      <div className="panel-actions vertical">
        {node.options.map((o, i) => (
          <button
            key={i}
            className="btn pour"
            onClick={() => {
              applyEventOption(node.id, i)
              onClose()
            }}
          >
            {o.label}
          </button>
        ))}
        <button className="btn cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
