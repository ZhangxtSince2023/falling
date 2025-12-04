/**
 * 游戏主逻辑入口
 * 依赖: game-config.js, visual-effects.js, localization.js, haptics.js, platform-system.js, player-controller.js, input-handler.js
 */

// 设置场景函数并创建游戏实例
gameConfig.scene = {
    preload: preload,
    create: create,
    update: update
};

const game = new Phaser.Game(gameConfig);

// 游戏状态
let playerController;
let platformSystem;
let inputHandler;
let gameOver = false;
let gameStarted = false;
let clouds = [];
let score = 0;
let scoreText;
let gameOverText;
let restartButton;
let languageButton;
let currentScene;
let currentDifficulty;
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

    // 平台管理
    platformSystem = new PlatformSystem(this, GAME_WIDTH, GAME_HEIGHT);
    platformSystem.createInitialPlatforms();

    // 创建小球控制
    playerController = new PlayerController(this, GAME_WIDTH, GAME_HEIGHT);

    // 添加碰撞检测
    this.physics.add.collider(playerController.sprite, platformSystem.group, onPlayerLandOnPlatform, null, this);

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

    // 输入控制
    inputHandler = new InputHandler(this, playerController.sprite, GAME_WIDTH);
    inputHandler.shouldHandle = () => gameStarted && !gameOver;
    inputHandler.attach();

    showStartScreen(this);
}

function update(time, delta) {
    if (!gameStarted || gameOver) return;

    const deltaSeconds = delta / 1000;

    playerController.markAirborne();

    // 根据当前分数和平台数量计算难度 (P1 优化 - 节奏变化)
    currentDifficulty = getDifficulty(score, platformSystem.totalPlatformsGenerated);

    // 平台更新
    platformSystem.update(delta, currentDifficulty);

    // 检查失败条件
    if (playerController.sprite.y <= 35 || playerController.sprite.y >= GAME_HEIGHT - 50) {
        triggerGameOver(this);
        return;
    }

    score = platformSystem.getScore();
    scoreText.setText(i18n.t('score') + ': ' + score);

    // 输入更新
    inputHandler.applyKeyboardControl();

    // 更新云朵
    updateClouds(clouds, deltaSeconds, currentDifficulty.riseSpeed, GAME_WIDTH, GAME_HEIGHT);

    // 记录当前帧的垂直速度（用于下一帧碰撞检测）
    playerController.updateLastVelocity();
}

// 玩家落在平台上
function onPlayerLandOnPlatform(player, platform) {
    // 使用上一帧记录的速度作为撞击速度（碰撞时当前速度可能已被引擎重置）
    const impactVelocity = playerController.lastVelocityY;
    const isLanding = !playerController.wasOnGround && player.body.touching.down;

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

        playerController.markOnGround();
    }

    if (player.body.touching.down) {
        playerController.markOnGround();
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
    clouds = [];
    currentDifficulty = null;
    if (inputHandler) inputHandler.reset();
    if (platformSystem) platformSystem.reset();
    if (playerController) playerController.resetFlags();
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
