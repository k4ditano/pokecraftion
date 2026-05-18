import Phaser from 'phaser'
import { spriteUrlFor } from '../../services/pokeapi'

const BULBASAUR_ID = 1

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload(): void {
    this.load.crossOrigin = 'anonymous'
    this.load.image('bulbasaur', spriteUrlFor(BULBASAUR_ID))
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor('#1a1a2e')

    const sprite = this.add.image(width / 2, height / 2, 'bulbasaur')
    sprite.setScale(4)
    sprite.setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 + 160, 'Pokecraftion — Boot OK', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 + 190, 'Bulbasaur via PokeAPI', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
  }
}
