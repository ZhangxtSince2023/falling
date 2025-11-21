// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 375,
    height: 667,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
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

const game = new Phaser.Game(config);

// 游戏变量
let player;
let platforms;
let cursors;
let gameOver = false;
let gameStarted = false;
let background;
let clouds = [];
let score = 0;
let scoreText;
let startText;
let gameOverText;
let restartButton;
let isDragging = false;
let dragStartX = 0;

// 平台生成相关
let platformSpawnTimer = 0;
const PLATFORM_SPAWN_INTERVAL = 1500; // 每1.5秒生成一个新平台
const PLATFORM_RISE_SPEED = 100; // 平台上升速度（像素/秒）
let passedPlatforms = 0; // 通过的平台数量

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

    // 创建背景 - 使用渐变色代替
    this.cameras.main.setBackgroundColor('#87CEEB');

    // 创建云朵装饰（用于显示背景移动效果）
    createClouds(this);

    // 创建平台组 - 使用动态 Group（不是 staticGroup，因为平台需要移动）
    platforms = this.physics.add.group({
        allowGravity: false
        // 不在这里设置 immovable，在单个平台上设置
    });

    // 创建初始平台（从下到上分布）
    for (let i = 0; i < 4; i++) {
        const platformY = GAME_HEIGHT - 100 - (i * 180);
        const platformX = Phaser.Math.Between(80, GAME_WIDTH - 80);
        createPlatform(this, platformX, platformY);
    }

    // 创建小球（玩家）- 在屏幕中心偏下位置
    player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'ball');
    player.setBounce(0);
    player.setCollideWorldBounds(true); // 开启边界碰撞，用于检测触顶
    player.setDragX(100);

    // 添加碰撞检测
    this.physics.add.collider(player, platforms, onPlayerLandOnPlatform, null, this);

    // 创建UI
    scoreText = this.add.text(16, 16, '距离: 0m', {
        fontSize: '24px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });
    scoreText.setScrollFactor(0);
    scoreText.setDepth(100);

    startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '点击屏幕开始\n\n左右拖动控制小球', {
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

    // 不设置相机跟随，相机固定不动

    // 触摸/鼠标控制
    this.input.on('pointerdown', onPointerDown, this);
    this.input.on('pointermove', onPointerMove, this);
    this.input.on('pointerup', onPointerUp, this);

    // 键盘控制（用于PC测试）
    cursors = this.input.keyboard.createCursorKeys();
}

function update(time, delta) {
    if (!gameStarted) {
        return;
    }

    if (gameOver) {
        return;
    }

    const deltaSeconds = delta / 1000; // 转换为秒

    // 让所有平台向上移动（使用速度）
    const platformChildren = platforms.getChildren();

    // 调试：每2秒打印一次平台信息
    if (Math.floor(time / 2000) !== Math.floor((time - delta) / 2000)) {
        if (platformChildren.length > 0) {
            console.log('平台数量:', platformChildren.length, '第一个平台Y:', platformChildren[0].y);
        }
    }

    platformChildren.forEach(platform => {
        if (platform.body) {
            platform.body.setVelocityY(-PLATFORM_RISE_SPEED);
        }
    });

    // 检查是否触碰到屏幕上边界（失败条件）
    if (player.y <= 35) { // 小球半径15 + 顶部安全距离20
        triggerGameOver(this);
        return;
    }

    // 更新分数（基于通过的平台数量和时间）
    score = passedPlatforms * 10;
    scoreText.setText('分数: ' + score);

    // 键盘控制（测试用）
    if (cursors.left.isDown) {
        player.body.setVelocityX(-300);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(300);
    }

    // 定时生成新平台（从底部）
    platformSpawnTimer += delta;
    if (platformSpawnTimer >= PLATFORM_SPAWN_INTERVAL) {
        generateNewPlatform(this);
        platformSpawnTimer = 0;
    }

    // 移除超出屏幕上方的平台，并计分
    platforms.getChildren().forEach(platform => {
        if (platform.y < -50) {
            if (!platform.counted) {
                passedPlatforms++;
                platform.counted = true;
            }
            platform.destroy();
        }
    });

    // 更新云朵位置（向上移动）
    updateClouds(this, deltaSeconds);
}

// 创建平台
function createPlatform(scene, x, y) {
    const width = Phaser.Math.Between(80, 150);
    const platform = platforms.create(x, y, 'platform');
    platform.setScale(width / 120, 1); // 调整宽度

    // 确保物理体可以移动
    if (platform.body) {
        platform.body.allowGravity = false;
        platform.body.immovable = true; // 碰撞时不被推动
    }

    platform.counted = false; // 用于计分标记
}

// 生成新平台（从底部）
function generateNewPlatform(scene) {
    const newX = Phaser.Math.Between(80, GAME_WIDTH - 80);
    const newY = GAME_HEIGHT + 50; // 在屏幕底部下方生成
    createPlatform(scene, newX, newY);
}

// 玩家落在平台上
function onPlayerLandOnPlatform(player, platform) {
    // 玩家站立在平台上
}

// 触摸开始
function onPointerDown(pointer) {
    if (!gameStarted) {
        startGame(this);
        return;
    }

    if (gameOver) {
        return;
    }

    isDragging = true;
    dragStartX = pointer.x;
}

// 触摸移动
function onPointerMove(pointer) {
    if (!gameStarted || gameOver || !isDragging) {
        return;
    }

    const deltaX = pointer.x - dragStartX;
    const velocityX = deltaX * 8; // 灵敏度
    player.body.setVelocityX(velocityX);

    dragStartX = pointer.x;
}

// 触摸结束
function onPointerUp(pointer) {
    isDragging = false;
}

// 开始游戏
function startGame(scene) {
    gameStarted = true;
    startText.setVisible(false);
}

// 游戏失败
function triggerGameOver(scene) {
    gameOver = true;

    // 暂停物理引擎，让画面完全停止
    scene.physics.pause();

    // 显示游戏结束文字
    gameOverText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '游戏结束!', {
        fontSize: '48px',
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(100);

    const finalScoreText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '最终分数: ' + score, {
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
    restartButton = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '点击重新开始', {
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
        // 恢复物理引擎
        scene.physics.resume();
        // 重启场景
        scene.scene.restart();
        resetGame();
    });
}

// 重置游戏
function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    passedPlatforms = 0;
    platformSpawnTimer = 0;
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
        cloud.setDepth(-1); // 让云朵在最底层
        clouds.push(cloud);
    }
}

// 更新云朵位置（向上移动）
function updateClouds(scene, deltaSeconds) {
    clouds.forEach((cloud, index) => {
        // 让云朵向上移动（速度比平台慢，产生视差效果）
        cloud.y -= PLATFORM_RISE_SPEED * 0.5 * deltaSeconds;

        // 云朵循环 - 从底部重新出现
        if (cloud.y < -100) {
            cloud.y = GAME_HEIGHT + 100;
            cloud.x = Phaser.Math.Between(0, GAME_WIDTH);
        }
    });
}
