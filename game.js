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
            gravity: { y: 600 }, // 重力适中，让游戏有挑战性
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
let gameOverText;
let restartButton;
let isDragging = false;
let dragStartX = 0;
let languageButton;
let currentScene; // 保存当前场景引用

// 平台生成相关
let platformSpawnTimer = 0;
let passedPlatforms = 0; // 通过的平台数量
let currentDifficulty; // 当前难度参数

// 难度系统配置 - 使用连续平滑函数
const DIFFICULTY_CONFIG = {
    // 基础参数
    BASE_SPAWN_INTERVAL: 1500,      // 基础生成间隔（毫秒）
    BASE_RISE_SPEED: 150,            // 基础上升速度（像素/秒）
    BASE_PLATFORM_WIDTH_MIN: 80,    // 基础最小宽度
    BASE_PLATFORM_WIDTH_MAX: 150,   // 基础最大宽度

    // 难度增长参数（平滑渐进）
    MAX_SPEED_MULTIPLIER: 2.0,       // 最大速度为基础的2倍
    MIN_INTERVAL_MULTIPLIER: 0.4,    // 最小间隔为基础的40%
    MIN_WIDTH_MULTIPLIER: 0.5,       // 最小宽度为基础的50%

    // 难度增长曲线参数
    SPEED_GROWTH_RATE: 0.002,        // 速度增长率（对数曲线）
    INTERVAL_DECAY_RATE: 0.0015,     // 间隔减少率
    WIDTH_DECAY_RATE: 0.001          // 宽度减少率
};

// 计算当前难度参数 - 使用平滑的数学函数
function getDifficulty(currentScore) {
    // 使用对数函数创建平滑的难度曲线
    // 对数函数的特点：开始增长较快，后期增长变缓，符合游戏难度曲线
    const normalizedScore = currentScore / 100; // 归一化分数

    // 速度增长：使用对数函数 1 + ln(1 + score * rate)
    const speedMultiplier = Math.min(
        1 + Math.log(1 + normalizedScore * DIFFICULTY_CONFIG.SPEED_GROWTH_RATE * 100) * 0.15,
        DIFFICULTY_CONFIG.MAX_SPEED_MULTIPLIER
    );

    // 生成间隔减少：使用指数衰减函数
    const intervalMultiplier = Math.max(
        1 / (1 + normalizedScore * DIFFICULTY_CONFIG.INTERVAL_DECAY_RATE * 100),
        DIFFICULTY_CONFIG.MIN_INTERVAL_MULTIPLIER
    );

    // 平台宽度减少：使用平方根函数创建更温和的减少
    const widthMultiplier = Math.max(
        1 - Math.sqrt(normalizedScore * DIFFICULTY_CONFIG.WIDTH_DECAY_RATE) * 0.5,
        DIFFICULTY_CONFIG.MIN_WIDTH_MULTIPLIER
    );

    return {
        riseSpeed: DIFFICULTY_CONFIG.BASE_RISE_SPEED * speedMultiplier,
        spawnInterval: DIFFICULTY_CONFIG.BASE_SPAWN_INTERVAL * intervalMultiplier,
        platformWidthMin: DIFFICULTY_CONFIG.BASE_PLATFORM_WIDTH_MIN * widthMultiplier,
        platformWidthMax: DIFFICULTY_CONFIG.BASE_PLATFORM_WIDTH_MAX * widthMultiplier
    };
}

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

    // 创建背景 - 使用渐变色代替
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

    // 设置合理的最大速度上限（防止速度过快）
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

    // 不设置相机跟随，相机固定不动

    // 触摸/鼠标控制
    this.input.on('pointerdown', onPointerDown, this);
    this.input.on('pointermove', onPointerMove, this);
    this.input.on('pointerup', onPointerUp, this);

    // 键盘控制（用于PC测试）
    cursors = this.input.keyboard.createCursorKeys();

    // 显示开始游戏提示
    showStartScreen(this);
}

function update(time, delta) {
    if (!gameStarted) {
        return;
    }

    if (gameOver) {
        return;
    }

    const deltaSeconds = delta / 1000; // 转换为秒

    // 根据当前分数计算难度
    currentDifficulty = getDifficulty(score);

    // 让所有平台向上移动（使用动态速度）
    const platformChildren = platforms.getChildren();

    // 调试：每2秒打印一次平台信息
    if (Math.floor(time / 2000) !== Math.floor((time - delta) / 2000)) {
        if (platformChildren.length > 0) {
            console.log('平台数量:', platformChildren.length, '第一个平台Y:', platformChildren[0].y);
        }
    }

    platformChildren.forEach(platform => {
        if (platform.body) {
            platform.body.setVelocityY(-currentDifficulty.riseSpeed);
        }
    });

    // 检查是否触碰到屏幕边界（失败条件）
    // 顶部：被平台推到顶部
    if (player.y <= 35) {
        triggerGameOver(this);
        return;
    }

    // 底部：掉落太低
    if (player.y >= GAME_HEIGHT - 50) { // 距离底部50像素的死亡线
        triggerGameOver(this);
        return;
    }

    // 更新分数（基于通过的平台数量和时间）
    score = passedPlatforms * 10;
    scoreText.setText(i18n.t('score') + ': ' + score);

    // 键盘控制（测试用）
    if (cursors.left.isDown) {
        player.body.setVelocityX(-300);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(300);
    }

    // 定时生成新平台（从底部，使用动态生成间隔）
    platformSpawnTimer += delta;
    if (platformSpawnTimer >= currentDifficulty.spawnInterval) {
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

    // 更新云朵位置（向上移动，使用动态速度）
    updateClouds(this, deltaSeconds, currentDifficulty.riseSpeed);
}

// 创建平台
function createPlatform(scene, x, y, difficulty = null) {
    // 如果没有提供难度参数，使用基础难度
    const diff = difficulty || getDifficulty(0);

    const width = Phaser.Math.Between(
        Math.floor(diff.platformWidthMin),
        Math.floor(diff.platformWidthMax)
    );
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
    // 使用当前难度生成平台
    createPlatform(scene, newX, newY, currentDifficulty);
}

// 玩家落在平台上
function onPlayerLandOnPlatform(player, platform) {
    // 玩家站立在平台上
}

// 触摸开始
function onPointerDown(pointer) {
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

// 显示开始界面
let startScreenElements = [];

function showStartScreen(scene) {
    // 游戏标题
    const titleText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, i18n.t('gameTitle') || '坠落小球', {
        fontSize: '42px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    });
    titleText.setOrigin(0.5);
    titleText.setDepth(100);
    startScreenElements.push(titleText);

    // 点击开始提示
    const startText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, i18n.t('tapToStart') || '点击屏幕开始游戏', {
        fontSize: '28px',
        fill: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });
    startText.setOrigin(0.5);
    startText.setDepth(100);
    startScreenElements.push(startText);

    // 添加闪烁效果
    scene.tweens.add({
        targets: startText,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    // 暂停物理引擎，等待开始
    scene.physics.pause();

    // 点击任意位置开始游戏
    scene.input.once('pointerdown', () => {
        startGame(scene);
    });
}

// 开始游戏
function startGame(scene) {
    // 移除开始界面元素
    startScreenElements.forEach(element => {
        if (element && element.destroy) {
            element.destroy();
        }
    });
    startScreenElements = [];

    // 恢复物理引擎
    scene.physics.resume();

    gameStarted = true;
}

// 游戏失败
function triggerGameOver(scene) {
    gameOver = true;

    // 暂停物理引擎，让画面完全停止
    scene.physics.pause();

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

    const finalScoreText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, i18n.t('finalScore') + ': ' + score, {
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
function updateClouds(scene, deltaSeconds, riseSpeed) {
    clouds.forEach((cloud, index) => {
        // 让云朵向上移动（速度比平台慢，产生视差效果）
        cloud.y -= riseSpeed * 0.5 * deltaSeconds;

        // 云朵循环 - 从底部重新出现
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

    // 切换语言
    i18n.setLanguage(nextLang);

    // 重启游戏场景以应用新语言
    if (currentScene) {
        currentScene.scene.restart();
        resetGame();
    }

    console.log('Language switched to:', nextLang);
}
