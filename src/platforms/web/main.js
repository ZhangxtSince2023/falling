/**
 * Web平台入口文件
 * 使用 Phaser 3 引擎和共享的核心游戏逻辑
 */

import { GameState } from '../../core/game-state.js';
import { createI18n } from '../../core/i18n.js';

// 创建 i18n 实例
const i18n = createI18n();

// 创建游戏状态实例
const gameState = new GameState();

// Phaser 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 375,
    height: 667,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 初始化 Phaser 游戏
const game = new Phaser.Game(config);

// 游戏对象和变量
let player;
let platforms;
let cursors;
let background;
let clouds = [];
let scoreText;
let startText;
let gameOverText;
let restartButton;
let isDragging = false;
let dragStartX = 0;
let languageButton;
let currentScene;

// 游戏区域
let GAME_HEIGHT;
let GAME_WIDTH;

function preload() {
    // 创建小球纹理
    const ballGraphics = this.add.graphics();
    ballGraphics.fillStyle(0xFF6B6B, 1);
    ballGraphics.fillCircle(15, 15, 15);
    ballGraphics.generateTexture('ball', 30, 30);
    ballGraphics.destroy();

    // 创建平台纹理
    const platformGraphics = this.add.graphics();
    platformGraphics.fillStyle(0x8B4513, 1);
    platformGraphics.fillRect(0, 0, 120, 15);
    platformGraphics.generateTexture('platform', 120, 15);
    platformGraphics.destroy();
}

function create() {
    GAME_WIDTH = this.scale.width;
    GAME_HEIGHT = this.scale.height;

    // 保存场景引用
    currentScene = this;

    // 创建背景
    this.cameras.main.setBackgroundColor('#87CEEB');

    // 创建顶部危险区域（视觉提示）
    const topDangerZone = this.add.rectangle(
        GAME_WIDTH / 2,
        25,
        GAME_WIDTH,
        50,
        0xff0000,
        0.3
    );
    topDangerZone.setDepth(-1);

    // 创建底部危险区域（视觉提示）
    const bottomDangerZone = this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 25,
        GAME_WIDTH,
        50,
        0xff0000,
        0.3
    );
    bottomDangerZone.setDepth(-1);

    // 创建云朵装饰
    createClouds(this);

    // 创建平台组
    platforms = this.physics.add.group({
        allowGravity: false
    });

    // 创建初始平台
    for (let i = 0; i < 4; i++) {
        const platformY = GAME_HEIGHT - 100 - (i * 180);
        const platformX = Phaser.Math.Between(80, GAME_WIDTH - 80);
        createPlatform(this, platformX, platformY);
    }

    // 创建小球（玩家）
    player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'ball');
    player.setBounce(0);
    player.setCollideWorldBounds(true);
    player.setDragX(100);
    player.body.setMaxVelocity(300, 200);

    // 添加碰撞检测
    this.physics.add.collider(player, platforms, onPlayerLandOnPlatform, null, this);

    // 创建UI
    scoreText = this.add.text(16, 16, i18n.t('score') + ': 0', {
        fontSize: '24px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });
    scoreText.setScrollFactor(0);
    scoreText.setDepth(100);

    startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, i18n.t('tapToStart') + '\n\n' + i18n.t('dragToControl'), {
        fontSize: '32px',
        fill: '#fff',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000',
        strokeThickness: 6
    });
    startText.setOrigin(0.5);
    startText.setScrollFactor(0);
    startText.setDepth(100);

    // 语言切换按钮
    languageButton = this.add.text(GAME_WIDTH - 16, 16, '🌐 ' + i18n.getCurrentLanguageName(), {
        fontSize: '20px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 3,
        backgroundColor: '#00000066',
        padding: { x: 10, y: 5 }
    });
    languageButton.setOrigin(1, 0);
    languageButton.setScrollFactor(0);
    languageButton.setDepth(100);
    languageButton.setInteractive({ useHandCursor: true });

    languageButton.on('pointerdown', () => {
        cycleLanguage();
    });

    // 触摸/鼠标控制
    this.input.on('pointerdown', onPointerDown, this);
    this.input.on('pointermove', onPointerMove, this);
    this.input.on('pointerup', onPointerUp, this);

    // 键盘控制
    cursors = this.input.keyboard.createCursorKeys();
}

function update(time, delta) {
    // 更新游戏状态
    const updateInfo = gameState.update(delta);

    if (!updateInfo.shouldUpdate) {
        return;
    }

    const deltaSeconds = delta / 1000;
    const difficulty = updateInfo.difficulty;

    // 让所有平台向上移动
    const platformChildren = platforms.getChildren();

    platformChildren.forEach(platform => {
        if (platform.body) {
            platform.body.setVelocityY(-difficulty.riseSpeed);
        }
    });

    // 检查边界碰撞
    if (gameState.checkBoundaryCollision(player.y, GAME_HEIGHT)) {
        triggerGameOver(this);
        return;
    }

    // 更新分数显示
    scoreText.setText(i18n.t('score') + ': ' + updateInfo.score);

    // 键盘控制
    if (cursors.left.isDown) {
        player.body.setVelocityX(-300);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(300);
    }

    // 生成新平台
    if (updateInfo.shouldSpawnPlatform) {
        generateNewPlatform(this);
        gameState.resetSpawnTimer();
    }

    // 移除超出屏幕的平台并计分
    platforms.getChildren().forEach(platform => {
        if (platform.y < -50) {
            if (!platform.counted) {
                gameState.incrementPassedPlatforms();
                platform.counted = true;
            }
            platform.destroy();
        }
    });

    // 更新云朵位置
    updateClouds(this, deltaSeconds, difficulty.riseSpeed);
}

// 创建平台
function createPlatform(scene, x, y, difficulty = null) {
    const diff = difficulty || gameState.currentDifficulty;

    const width = Phaser.Math.Between(
        Math.floor(diff.platformWidthMin),
        Math.floor(diff.platformWidthMax)
    );
    const platform = platforms.create(x, y, 'platform');
    platform.setScale(width / 120, 1);

    if (platform.body) {
        platform.body.allowGravity = false;
        platform.body.immovable = true;
    }

    platform.counted = false;
}

// 生成新平台
function generateNewPlatform(scene) {
    const newX = Phaser.Math.Between(80, GAME_WIDTH - 80);
    const newY = GAME_HEIGHT + 50;
    createPlatform(scene, newX, newY, gameState.currentDifficulty);
}

// 玩家落在平台上
function onPlayerLandOnPlatform(player, platform) {
    // 碰撞处理
}

// 触摸开始
function onPointerDown(pointer) {
    if (gameState.canStart()) {
        startGame(this);
        return;
    }

    if (gameState.isGameOver()) {
        return;
    }

    isDragging = true;
    dragStartX = pointer.x;
}

// 触摸移动
function onPointerMove(pointer) {
    if (!gameState.isPlaying() || !isDragging) {
        return;
    }

    const deltaX = pointer.x - dragStartX;
    const velocityX = deltaX * 8;
    player.body.setVelocityX(velocityX);

    dragStartX = pointer.x;
}

// 触摸结束
function onPointerUp(pointer) {
    isDragging = false;
}

// 开始游戏
function startGame(scene) {
    gameState.startGame();
    startText.setVisible(false);
}

// 游戏失败
function triggerGameOver(scene) {
    gameState.triggerGameOver();

    // 暂停物理引擎
    scene.physics.pause();

    const state = gameState.getState();

    // 显示游戏结束文字
    gameOverText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, i18n.t('gameOver'), {
        fontSize: '48px',
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(100);

    const finalScoreText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, i18n.t('finalScore') + ': ' + state.score, {
        fontSize: '32px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });
    finalScoreText.setOrigin(0.5);
    finalScoreText.setScrollFactor(0);
    finalScoreText.setDepth(100);

    // 重新开始按钮
    restartButton = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, i18n.t('tapToRestart'), {
        fontSize: '28px',
        fill: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });
    restartButton.setOrigin(0.5);
    restartButton.setScrollFactor(0);
    restartButton.setDepth(100);
    restartButton.setInteractive();

    restartButton.on('pointerdown', () => {
        scene.physics.resume();
        scene.scene.restart();
        resetGame();
    });
}

// 重置游戏
function resetGame() {
    gameState.reset();
    isDragging = false;
    clouds = [];
}

// 创建云朵
function createClouds(scene) {
    for (let i = 0; i < 5; i++) {
        const cloud = scene.add.ellipse(
            Phaser.Math.Between(0, GAME_WIDTH),
            Phaser.Math.Between(100, GAME_HEIGHT - 100),
            Phaser.Math.Between(60, 100),
            40,
            0xffffff,
            0.6
        );
        cloud.setDepth(-1);
        clouds.push(cloud);
    }
}

// 更新云朵位置
function updateClouds(scene, deltaSeconds, riseSpeed) {
    clouds.forEach((cloud, index) => {
        cloud.y -= riseSpeed * 0.5 * deltaSeconds;

        if (cloud.y < -100) {
            cloud.y = GAME_HEIGHT + 100;
            cloud.x = Phaser.Math.Between(0, GAME_WIDTH);
        }
    });
}

// 切换语言
function cycleLanguage() {
    const languages = ['zh', 'zh-TW', 'en', 'ja'];
    const currentLang = i18n.getCurrentLanguage();
    const currentIndex = languages.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLang = languages[nextIndex];

    i18n.setLanguage(nextLang);

    if (currentScene) {
        currentScene.scene.restart();
        resetGame();
    }

    console.log('Language switched to:', nextLang);
}
