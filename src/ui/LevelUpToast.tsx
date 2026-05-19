import { useEffect, useState } from 'react'
import { useGameStore } from '../state/gameStore'

export function LevelUpToast() {
  const lastLevelUp = useGameStore((s) => s.lastLevelUp)
  const [visible, setVisible] = useState<{
    name: string
    level: number
    ts: number
  } | null>(null)

  useEffect(() => {
    if (!lastLevelUp) return
    setVisible(lastLevelUp)
    const t = window.setTimeout(() => {
      setVisible((v) => (v && v.ts === lastLevelUp.ts ? null : v))
    }, 2200)
    return () => clearTimeout(t)
  }, [lastLevelUp])

  if (!visible) return null

  return (
    <div key={visible.ts} className="level-up-toast">
      <div className="level-up-bg">
        ✦ {visible.name} sube a Lv {visible.level} ✦
      </div>
    </div>
  )
}
