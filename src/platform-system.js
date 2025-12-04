/**
 * 平台生成与回收管理
 */
class PlatformSystem {
    constructor(scene, gameWidth, gameHeight) {
        this.scene = scene;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.group = scene.physics.add.group({ allowGravity: false });
        this.spawnTimer = 0;
        this.passedPlatforms = 0;
        this.colorIndex = 0;
    }

    createInitialPlatforms() {
        for (let i = 0; i < 4; i++) {
            const platformY = this.gameHeight - 100 - (i * 180);
            const platformX = Phaser.Math.Between(80, this.gameWidth - 80);
            this.createPlatform(platformX, platformY);
        }
    }

    update(delta, difficulty) {
        // 平台上移
        this.group.getChildren().forEach(platform => {
            if (platform.body) {
                platform.body.setVelocityY(-difficulty.riseSpeed);
            }
        });

        // 定时生成
        this.spawnTimer += delta;
        if (this.spawnTimer >= difficulty.spawnInterval) {
            this.generateNewPlatform(difficulty);
            this.spawnTimer = 0;
        }

        // 回收出屏平台并计分
        this.group.getChildren().forEach(platform => {
            if (platform.y < -50) {
                if (!platform.counted) {
                    this.passedPlatforms++;
                    platform.counted = true;
                }
                platform.destroy();
            }
        });
    }

    generateNewPlatform(difficulty) {
        const newX = Phaser.Math.Between(80, this.gameWidth - 80);
        const newY = this.gameHeight + 50;
        this.createPlatform(newX, newY, difficulty);
    }

    createPlatform(x, y, difficulty = null) {
        const diff = difficulty || getDifficulty(0);
        const width = Phaser.Math.Between(Math.floor(diff.platformWidthMin), Math.floor(diff.platformWidthMax));
        const height = 20;

        const colorScheme = COLOR_SCHEMES[this.colorIndex % COLOR_SCHEMES.length];
        this.colorIndex++;

        const graphics = this.scene.add.graphics();
        graphics.fillGradientStyle(colorScheme.primary, colorScheme.secondary, colorScheme.primary, colorScheme.secondary, 1, 1, 1, 1);
        graphics.fillRoundedRect(0, 0, width, height, 10);
        graphics.lineStyle(3, 0xffffff, 0.8);
        graphics.strokeRoundedRect(0, 0, width, height, 10);

        const platformKey = 'platform_' + Math.random();
        graphics.generateTexture(platformKey, width, height);
        graphics.destroy();

        const platform = this.scene.physics.add.sprite(x, y, platformKey);
        this.group.add(platform);

        if (platform.body) {
            platform.body.allowGravity = false;
            platform.body.immovable = true;
            platform.body.setSize(width, height);
        }

        platform.counted = false;
        platform.colorScheme = colorScheme;
    }

    getScore() {
        return this.passedPlatforms * 10;
    }

    reset() {
        this.spawnTimer = 0;
        this.passedPlatforms = 0;
        this.colorIndex = 0;
    }
}
