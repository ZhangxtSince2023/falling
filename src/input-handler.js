/**
 * 指针拖动输入控制
 */
export class InputHandler {
    constructor(scene, player, gameWidth) {
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

    attach() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.scene.input.on('pointerdown', this.onPointerDown, this);
        this.scene.input.on('pointermove', this.onPointerMove, this);
        this.scene.input.on('pointerup', this.onPointerUp, this);
    }

    onPointerDown(pointer) {
        if (!this.shouldHandle()) return;
        this.isDragging = true;
        this.lastPointerX = pointer.x;
        this.targetX = this.player.x;
        this.pointerVelocity = 0;
    }

    onPointerMove(pointer) {
        if (!this.shouldHandle()) return;
        if (!this.isDragging) return;

        const deltaX = pointer.x - this.lastPointerX;
        this.lastPointerX = pointer.x;
        this.targetX += deltaX;
        this.targetX = Phaser.Math.Clamp(this.targetX, 20, this.gameWidth - 20);

        const diff = this.targetX - this.player.x;
        this.pointerVelocity = Phaser.Math.Clamp(diff * 15, -400, 400);
        if (this.player.body) {
            this.player.body.setVelocityX(this.pointerVelocity);
        }
    }

    onPointerUp() {
        if (!this.shouldHandle()) return;
        this.isDragging = false;
        if (this.player && this.player.body) {
            this.player.body.setVelocityX(this.pointerVelocity * 0.5);
        }
    }

    applyKeyboardControl() {
        if (!this.cursors || !this.player || !this.player.body) return;
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(300);
        }
    }

    reset() {
        this.isDragging = false;
        this.targetX = 0;
        this.lastPointerX = 0;
        this.pointerVelocity = 0;
    }
}
