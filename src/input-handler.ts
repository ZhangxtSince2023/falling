/**
 * 指针拖动输入控制
 */
import Phaser from 'phaser';

export class InputHandler {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private gameWidth: number;
  private isDragging: boolean;
  private targetX: number;
  private lastPointerX: number;
  private pointerVelocity: number;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  public shouldHandle: () => boolean;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    gameWidth: number
  ) {
    this.scene = scene;
    this.player = player;
    this.gameWidth = gameWidth;
    this.isDragging = false;
    this.targetX = 0;
    this.lastPointerX = 0;
    this.pointerVelocity = 0;
    this.cursors = null;
    this.shouldHandle = () => true;
  }

  attach(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);

    // 监听 scene shutdown 事件，自动清理
    this.scene.events.once('shutdown', this.detach, this);
  }

  detach(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.cursors = null;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.shouldHandle()) return;
    this.isDragging = true;
    this.lastPointerX = pointer.x;
    this.targetX = this.player.x;
    this.pointerVelocity = 0;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.shouldHandle()) return;
    if (!this.isDragging) return;

    const deltaX = pointer.x - this.lastPointerX;
    this.lastPointerX = pointer.x;
    this.targetX += deltaX;
    this.targetX = Phaser.Math.Clamp(this.targetX, 20, this.gameWidth - 20);

    const diff = this.targetX - this.player.x;
    this.pointerVelocity = Phaser.Math.Clamp(diff * 15, -400, 400);
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(
        this.pointerVelocity
      );
    }
  }

  private onPointerUp(): void {
    if (!this.shouldHandle()) return;
    this.isDragging = false;
    if (this.player?.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(
        this.pointerVelocity * 0.5
      );
    }
  }

  applyKeyboardControl(): void {
    if (!this.cursors || !this.player?.body) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.cursors.left.isDown) {
      body.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(300);
    }
  }

  reset(): void {
    this.isDragging = false;
    this.targetX = 0;
    this.lastPointerX = 0;
    this.pointerVelocity = 0;
  }
}
