/**
 * 玩家相关封装
 */
class PlayerController {
    constructor(scene, gameWidth, gameHeight) {
        this.scene = scene;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.wasOnGround = false;
        this.lastVelocityY = 0;
        this.sprite = this.createPlayerSprite();
    }

    createPlayerSprite() {
        const player = this.scene.physics.add.sprite(this.gameWidth / 2, this.gameHeight / 2 + 100, 'ball');
        player.setScale(0.5);
        player.setBounce(0);
        player.setCollideWorldBounds(true);
        player.setDragX(100);
        player.body.setSize(player.width * 0.8, player.height * 0.8);
        player.body.setOffset(player.width * 0.1, player.height * 0.1);
        player.body.setMaxVelocity(300, 200);
        return player;
    }

    updateLastVelocity() {
        if (this.sprite && this.sprite.body) {
            this.lastVelocityY = this.sprite.body.velocity.y;
        }
    }

    markAirborne() {
        if (this.sprite && this.sprite.body && !this.sprite.body.touching.down) {
            this.wasOnGround = false;
        }
    }

    markOnGround() {
        this.wasOnGround = true;
    }

    resetFlags() {
        this.wasOnGround = false;
        this.lastVelocityY = 0;
    }
}

