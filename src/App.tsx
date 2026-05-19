import { useEffect } from 'react'
import { BattleScreen } from './ui/BattleScreen'
import { Hud } from './ui/Hud'
import { PathScreen } from './ui/PathScreen'
import { PhaserCanvas } from './ui/PhaserCanvas'
import { LevelUpToast } from './ui/LevelUpToast'
import { StarterPicker } from './ui/StarterPicker'
import { TeamMemberPanel } from './ui/TeamMemberPanel'
import { useMetaStore } from './state/metaStore'
import { useGameStore } from './state/gameStore'
import { clearRun, loadRun, saveRun } from './services/runSave'

export default function App() {
  const ready = useMetaStore((s) => s.ready)
  const loadFromDb = useMetaStore((s) => s.loadFromDb)
  const restartRun = useGameStore((s) => s.restartRun)
  const hydrateRun = useGameStore((s) => s.hydrateRun)

  useEffect(() => {
    let mounted = true
    loadFromDb().then(() => {
      if (!mounted) return
      const snap = loadRun()
      if (snap && Array.isArray(snap.party)) {
        hydrateRun(snap)
      } else {
        restartRun()
      }
    })
    return () => {
      mounted = false
    }
  }, [loadFromDb, restartRun, hydrateRun])

  useEffect(() => {
    if (!ready) return
    let timer: number | null = null
    const unsub = useGameStore.subscribe((state) => {
      if (timer !== null) clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (state.runComplete && state.currentNodeIdx >= state.pathNodes.length) {
          clearRun()
          return
        }
        saveRun({
          party: state.party,
          inventory: state.inventory,
          collectibles: state.collectibles,
          portals: state.portals,
          hazards: state.hazards,
          plots: state.plots,
          seeds: state.seeds,
          playerPos: state.playerPos,
          water: state.water,
          gold: state.gold,
          pathNodes: state.pathNodes,
          currentNodeIdx: state.currentNodeIdx,
          runComplete: state.runComplete,
          mts: state.mts,
        })
      }, 500)
    })
    return () => {
      unsub()
      if (timer !== null) clearTimeout(timer)
    }
  }, [ready])

  if (!ready) {
    return (
      <div className="app loading">
        <div className="loading-text">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="app">
      <PhaserCanvas />
      <Hud />
      <TeamMemberPanel />
      <PathScreen />
      <BattleScreen />
      <StarterPicker />
      <LevelUpToast />
    </div>
  )
}
