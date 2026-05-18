import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'

export function createGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#000000',
    pixelArt: true,
    scene: [BootScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  }

  return new Phaser.Game(config)
}
