import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MapScene } from './scenes/MapScene'
import { MAP_HEIGHT, MAP_WIDTH } from '../data/map'

export function createGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: '#d8e3c4',
    pixelArt: true,
    scene: [MapScene, BootScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  }

  return new Phaser.Game(config)
}
