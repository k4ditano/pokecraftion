import { useEffect } from 'react'
import { BattleScreen } from './ui/BattleScreen'
import { Hud } from './ui/Hud'
import { PathScreen } from './ui/PathScreen'
import { PhaserCanvas } from './ui/PhaserCanvas'
import { TeamMemberPanel } from './ui/TeamMemberPanel'
import { useMetaStore } from './state/metaStore'
import { useGameStore } from './state/gameStore'

export default function App() {
  const ready = useMetaStore((s) => s.ready)
  const loadFromDb = useMetaStore((s) => s.loadFromDb)
  const restartRun = useGameStore((s) => s.restartRun)

  useEffect(() => {
    let mounted = true
    loadFromDb().then(() => {
      if (mounted) restartRun()
    })
    return () => {
      mounted = false
    }
  }, [loadFromDb, restartRun])

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
    </div>
  )
}
