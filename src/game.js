/**
 * 游戏主逻辑
 * 依赖: config.js, effects.js, i18n.js
 */

// 震动功能封装
async function vibrate(type) {
    try {
        // 检查是否在 Capacitor 原生环境中
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            const Haptics = window.Capacitor.Plugins.Haptics;

            if (type === 'light') {
                await Haptics.impact({ style: 'LIGHT' });
            } else if (type === 'medium') {
                await Haptics.impact({ style: 'MEDIUM' });
            } else if (type === 'heavy') {
                await Haptics.impact({ style: 'HEAVY' });
            } else if (type === 'error') {
                await Haptics.notification({ type: 'ERROR' });
            }
        } else {
            // 浏览器回退方案 (Android Chrome 支持，iOS Safari 不支持)
            if (navigator.vibrate) {
                if (type === 'light') navigator.vibrate(10);
                else if (type === 'medium') navigator.vibrate(30);
                else if (type === 'heavy') navigator.vibrate(50);
                else if (type === 'error') navigator.vibrate([50, 50, 50]);
            }
        }
    } catch (e) {
        console.warn('Vibration failed', e);
    }
}

// 设置场景函数并创建游戏实例
gameConfig.scene = {
    preload: preload,
    create: create,
    update: update
};

const game = new Phaser.Game(gameConfig);

// 游戏变量
let player;
let platforms;
let cursors;
let gameOver = false;
let gameStarted = false;
let clouds = [];
let score = 0;
let scoreText;
let gameOverText;
let restartButton;
let isDragging = false;
let dragStartX = 0;
let languageButton;
let currentScene;
let wasOnGround = false;

// 平台生成相关
let platformSpawnTimer = 0;
let passedPlatforms = 0;
let currentDifficulty;
let currentColorIndex = 0;

// 游戏区域
let GAME_HEIGHT;
let GAME_WIDTH;

function preload() {
    createBallTexture(this, 'ball', 0xFF6B9D, 0xFFA06B);
}

function create() {
    GAME_WIDTH = this.scale.width;
    GAME_HEIGHT = this.scale.height;
    currentScene = this;

    // 创建渐变背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0xFF6B9D, 0xFF6B9D, 0xFFA06B, 0xFFA06B, 1, 1, 1, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.setDepth(-10);

    // 创建顶部危险区域
    const topDangerZone = this.add.rectangle(GAME_WIDTH / 2, 25, GAME_WIDTH, 50, 0xff0000, 0.3);
    topDangerZone.setDepth(-1);

    // 创建底部危险区域
    const bottomDangerZone = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 25, GAME_WIDTH, 50, 0xff0000, 0.3);
    bottomDangerZone.setDepth(-1);

    // 创建云朵装饰
    clouds = createClouds(this, GAME_WIDTH, GAME_HEIGHT);

    // 创建平台组
    platforms = this.physics.add.group({ allowGravity: false });

    // 创建初始平台
    for (let i = 0; i < 4; i++) {
        const platformY = GAME_HEIGHT - 100 - (i * 180);
        const platformX = Phaser.Math.Between(80, GAME_WIDTH - 80);
        createPlatform(this, platformX, platformY);
    }

    // 创建小球
    player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'ball');
    player.setScale(0.5);
    player.setBounce(0);
    player.setCollideWorldBounds(true);
    player.setDragX(100);
    player.body.setSize(player.width * 0.8, player.height * 0.8);
    player.body.setOffset(player.width * 0.1, player.height * 0.1);
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
        vibrate('light');
        cycleLanguage();
    });

    // 触摸/鼠标控制
    this.input.on('pointerdown', onPointerDown, this);
    this.input.on('pointermove', onPointerMove, this);
    this.input.on('pointerup', onPointerUp, this);

    // 键盘控制
    cursors = this.input.keyboard.createCursorKeys();

    showStartScreen(this);
}

function update(time, delta) {
    if (!gameStarted || gameOver) return;

    const deltaSeconds = delta / 1000;

    // 检测球是否离开平台
    if (player && player.body && !player.body.touching.down) {
        wasOnGround = false;
    }

    // 根据当前分数计算难度
    currentDifficulty = getDifficulty(score);

    // 让所有平台向上移动
    platforms.getChildren().forEach(platform => {
        if (platform.body) {
            platform.body.setVelocityY(-currentDifficulty.riseSpeed);
        }
    });

    // 检查失败条件
    if (player.y <= 35 || player.y >= GAME_HEIGHT - 50) {
        triggerGameOver(this);
        return;
    }

    // 更新分数
    score = passedPlatforms * 10;
    scoreText.setText(i18n.t('score') + ': ' + score);

    // 键盘控制
    if (cursors.left.isDown) {
        player.body.setVelocityX(-300);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(300);
    }

    // 定时生成新平台
    platformSpawnTimer += delta;
    if (platformSpawnTimer >= currentDifficulty.spawnInterval) {
        generateNewPlatform(this);
        platformSpawnTimer = 0;
    }

    // 移除超出屏幕的平台并计分
    platforms.getChildren().forEach(platform => {
        if (platform.y < -50) {
            if (!platform.counted) {
                passedPlatforms++;
                platform.counted = true;
            }
            platform.destroy();
        }
    });

    // 更新云朵
    updateClouds(clouds, deltaSeconds, currentDifficulty.riseSpeed, GAME_WIDTH, GAME_HEIGHT);

    // 记录当前帧的垂直速度（用于下一帧碰撞检测）
    if (player && player.body) {
        lastVelocityY = player.body.velocity.y;
    }
}

// 创建平台
function createPlatform(scene, x, y, difficulty = null) {
    const diff = difficulty || getDifficulty(0);
    const width = Phaser.Math.Between(Math.floor(diff.platformWidthMin), Math.floor(diff.platformWidthMax));
    const height = 20;

    const colorScheme = COLOR_SCHEMES[currentColorIndex % COLOR_SCHEMES.length];
    currentColorIndex++;

    const graphics = scene.add.graphics();
    graphics.fillGradientStyle(colorScheme.primary, colorScheme.secondary, colorScheme.primary, colorScheme.secondary, 1, 1, 1, 1);
    graphics.fillRoundedRect(0, 0, width, height, 10);
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.strokeRoundedRect(0, 0, width, height, 10);

    const platformKey = 'platform_' + Math.random();
    graphics.generateTexture(platformKey, width, height);
    graphics.destroy();

    const platform = scene.physics.add.sprite(x, y, platformKey);
    platforms.add(platform);

    if (platform.body) {
        platform.body.allowGravity = false;
        platform.body.immovable = true;
        platform.body.setSize(width, height);
    }

    platform.counted = false;
    platform.colorScheme = colorScheme;
}

// 生成新平台
function generateNewPlatform(scene) {
    const newX = Phaser.Math.Between(80, GAME_WIDTH - 80);
    const newY = GAME_HEIGHT + 50;
    createPlatform(scene, newX, newY, currentDifficulty);
}

// 记录上一帧的垂直速度
let lastVelocityY = 0;

// 玩家落在平台上
function onPlayerLandOnPlatform(player, platform) {
    // 使用上一帧记录的速度作为撞击速度（碰撞时当前速度可能已被引擎重置）
    const impactVelocity = lastVelocityY;
    const isLanding = !wasOnGround && player.body.touching.down;

    if (isLanding) {
        const contactX = player.x;
        const contactY = player.y + player.displayHeight / 2;

        // 撞击冲击波效果（绑定在小球位置）
        createImpactRing(currentScene, contactX, contactY, platform.colorScheme);

        // 小球发光效果
        createBallGlow(currentScene, player, platform.colorScheme);

        // 粒子效果
        createImpactParticles(currentScene, contactX, contactY, platform.colorScheme);

        // 相机震动（根据撞击速度调整强度）
        const shakeIntensity = Math.min(impactVelocity / 200, 1) * 0.008;
        if (currentScene && currentScene.cameras && currentScene.cameras.main) {
            currentScene.cameras.main.shake(80, shakeIntensity);
        }

        // 手机震动（根据撞击速度决定强度）
        const vibrateStyle = impactVelocity > 300 ? 'medium' : 'light';
        vibrate(vibrateStyle);

        // 小球挤压动画（传入撞击速度）
        squashBallAnimation(currentScene, player, impactVelocity);

        // 平台闪烁
        flashPlatform(currentScene, platform);

        wasOnGround = true;
    }

    if (player.body.touching.down) {
        wasOnGround = true;
    }
}

// 触摸控制
let targetX = 0;
let lastPointerX = 0;
let pointerVelocity = 0;

function onPointerDown(pointer) {
    if (gameOver) return;
    isDragging = true;
    lastPointerX = pointer.x;
    targetX = player.x;
    pointerVelocity = 0;
}

function onPointerMove(pointer) {
    if (!gameStarted || gameOver || !isDragging) return;

    const deltaX = pointer.x - lastPointerX;
    lastPointerX = pointer.x;
    targetX += deltaX;
    targetX = Phaser.Math.Clamp(targetX, 20, GAME_WIDTH - 20);

    const diff = targetX - player.x;
    pointerVelocity = Phaser.Math.Clamp(diff * 15, -400, 400);
    player.body.setVelocityX(pointerVelocity);
}

function onPointerUp() {
    isDragging = false;
    if (player && player.body) {
        player.body.setVelocityX(pointerVelocity * 0.5);
    }
}

// 开始界面
let startScreenElements = [];

function showStartScreen(scene) {
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

    scene.tweens.add({
        targets: startText,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    scene.physics.pause();

    scene.input.once('pointerdown', () => {
        vibrate('light');
        startGame(scene);
    });
}

function startGame(scene) {
    startScreenElements.forEach(element => {
        if (element && element.destroy) element.destroy();
    });
    startScreenElements = [];
    scene.physics.resume();
    gameStarted = true;
}

// 游戏失败
function triggerGameOver(scene) {
    // 游戏结束震动反馈
    vibrate('error');

    gameOver = true;
    scene.physics.pause();

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
        vibrate('light');
        scene.physics.resume();
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
    targetX = 0;
    lastPointerX = 0;
    pointerVelocity = 0;
    clouds = [];
    currentColorIndex = 0;
    wasOnGround = false;
    lastVelocityY = 0;
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
}
