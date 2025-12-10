/**
 * 玩家相关封装
 */
import Phaser from 'phaser';

export class PlayerController {
  private scene: Phaser.Scene;
  private gameWidth: number;
  private gameHeight: number;
  public wasOnGround: boolean;
  public lastVelocityY: number;
  public sprite: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, gameWidth: number, gameHeight: number) {
    this.scene = scene;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.wasOnGround = false;
    this.lastVelocityY = 0;
    this.sprite = this.createPlayerSprite();
  }

  private createPlayerSprite(): Phaser.Physics.Arcade.Sprite {
    const player = this.scene.physics.add.sprite(
      this.gameWidth / 2,
      this.gameHeight / 2 + 100,
      'ball'
    );
    player.setScale(0.5);
    player.setBounce(0);
    player.setCollideWorldBounds(true);
    player.setDragX(100);

    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setSize(player.width * 0.8, player.height * 0.8);
    body.setOffset(player.width * 0.1, player.height * 0.1);
    body.setMaxVelocity(300, 200);

    return player;
  }

  updateLastVelocity(): void {
    if (this.sprite?.body) {
      this.lastVelocityY = (
        this.sprite.body as Phaser.Physics.Arcade.Body
      ).velocity.y;
    }
  }

  markAirborne(): void {
    if (this.sprite?.body) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (!body.touching.down) {
        this.wasOnGround = false;
      }
    }
  }

  markOnGround(): void {
    this.wasOnGround = true;
  }

  resetFlags(): void {
    this.wasOnGround = false;
    this.lastVelocityY = 0;
  }
}
