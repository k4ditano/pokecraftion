import { BattleScreen } from './ui/BattleScreen'
import { Hud } from './ui/Hud'
import { PathScreen } from './ui/PathScreen'
import { PhaserCanvas } from './ui/PhaserCanvas'
import { TeamMemberPanel } from './ui/TeamMemberPanel'

export default function App() {
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
