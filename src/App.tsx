import { Hud } from './ui/Hud'
import { PhaserCanvas } from './ui/PhaserCanvas'

export default function App() {
  return (
    <div className="app">
      <PhaserCanvas />
      <Hud />
    </div>
  )
}
