// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 375,
    height: 667,
    parent: 'game-container',
    backgroundColor: '#FF6B9D', // Helix Jump 风格的粉色背景
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

// Helix Jump 风格的颜色配置
const COLOR_SCHEMES = [
    { primary: 0xFF6B9D, secondary: 0xFFA06B }, // 粉色到橙色
    { primary: 0x6B9DFF, secondary: 0x9D6BFF }, // 蓝色到紫色
    { primary: 0xFFD700, secondary: 0xFF69B4 }, // 金色到粉色
    { primary: 0x00CED1, secondary: 0x9370DB }, // 青色到紫色
    { primary: 0xFF4500, secondary: 0xFFD700 }, // 橙红到金色
];

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
let wasOnGround = false; // 球在上一帧是否在平台上

// 平台生成相关
let platformSpawnTimer = 0;
let passedPlatforms = 0; // 通过的平台数量
let currentDifficulty; // 当前难度参数
let currentColorIndex = 0; // 当前使用的颜色方案索引

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

// 创建程序化的球体纹理（带渐变效果）
function createBallTexture(scene, key, color1, color2) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    const radius = 32;

    // 创建渐变填充
    for (let i = 0; i < radius; i++) {
        const alpha = i / radius;
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(color1),
            Phaser.Display.Color.ValueToColor(color2),
            radius,
            i
        );
        const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

        graphics.fillStyle(hexColor, 1 - alpha * 0.3);
        graphics.fillCircle(radius, radius, radius - i);
    }

    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
}

function preload() {
    // 创建程序化的球体纹理（渐变色）
    createBallTexture(this, 'ball', 0xFF6B9D, 0xFFA06B);

    // 不需要再加载图片素材了，我们使用程序化图形
}

function create() {
    GAME_WIDTH = this.scale.width;
    GAME_HEIGHT = this.scale.height;

    // 保存场景引用
    currentScene = this;

    // 创建渐变背景（Helix Jump 风格）
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0xFF6B9D, 0xFF6B9D, 0xFFA06B, 0xFFA06B, 1, 1, 1, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.setDepth(-10);

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
    player.setScale(0.5); // 缩放到合适大小
    player.setBounce(0);
    player.setCollideWorldBounds(true); // 开启边界碰撞，用于检测触顶
    player.setDragX(100);

    // 更新物理体大小以匹配缩放后的精灵
    player.body.setSize(player.width * 0.8, player.height * 0.8);
    player.body.setOffset(player.width * 0.1, player.height * 0.1);

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

    // 检测球是否离开平台（用于碰撞特效触发）
    if (player && player.body && !player.body.touching.down) {
        wasOnGround = false;
    }

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
    const height = 20;

    // 选择颜色方案
    const colorScheme = COLOR_SCHEMES[currentColorIndex % COLOR_SCHEMES.length];
    currentColorIndex++;

    // 创建渐变矩形平台
    const graphics = scene.add.graphics();

    // 填充渐变色
    graphics.fillGradientStyle(
        colorScheme.primary, colorScheme.secondary,
        colorScheme.primary, colorScheme.secondary,
        1, 1, 1, 1
    );
    graphics.fillRoundedRect(0, 0, width, height, 10);

    // 添加白色描边，让平台更明显
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.strokeRoundedRect(0, 0, width, height, 10);

    // 转换为纹理
    const platformKey = 'platform_' + Math.random();
    graphics.generateTexture(platformKey, width, height);
    graphics.destroy();

    // 创建平台精灵
    const platform = scene.physics.add.sprite(x, y, platformKey);
    platforms.add(platform);

    // 确保物理体可以移动
    if (platform.body) {
        platform.body.allowGravity = false;
        platform.body.immovable = true; // 碰撞时不被推动
        platform.body.setSize(width, height);
    }

    platform.counted = false; // 用于计分标记
    platform.colorScheme = colorScheme; // 保存颜色方案用于特效
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
    // 检测球是否刚落到平台上（必须满足三个条件）：
    // 1. 上一帧不在地面上 (!wasOnGround)
    // 2. 这一帧接触到平台底部 (player.body.touching.down)
    // 3. 球正在下落，有向下的速度 (player.body.velocity.y > 50)
    const isLanding = !wasOnGround &&
                      player.body.touching.down &&
                      player.body.velocity.y > 50; // 必须有明显的下落速度

    if (isLanding) {
        // 计算球和平台的接触点（球的底部）
        const contactX = player.x;
        const contactY = player.y + player.displayHeight / 2;

        // 创建碰撞粒子效果（使用接触点位置）
        createImpactParticles(currentScene, contactX, contactY, platform.colorScheme);

        // 屏幕震动
        shakeCamera(currentScene);

        // 球体挤压动画
        squashBallAnimation(currentScene, player);

        // 平台闪烁效果
        flashPlatform(currentScene, platform);

        // 标记球现在在平台上
        wasOnGround = true;
    }

    // 如果球站在平台上（速度很小），也标记为在地面上
    if (player.body.touching.down && Math.abs(player.body.velocity.y) < 10) {
        wasOnGround = true;
    }
}

// 平台碰撞闪烁效果
function flashPlatform(scene, platform) {
    if (!platform || !scene) return;

    // 快速闪白
    scene.tweens.add({
        targets: platform,
        alpha: 0.6,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeInOut'
    });
}

// 创建碰撞粒子效果
function createImpactParticles(scene, x, y, colorScheme) {
    if (!colorScheme) {
        console.error('colorScheme 未定义！使用默认颜色');
        colorScheme = { primary: 0xFF6B9D, secondary: 0xFFA06B };
    }

    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
        // 粒子向四周均匀散开
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = Phaser.Math.Between(200, 400);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        // 创建更大的粒子（使用主色和副色交替）
        const color = i % 2 === 0 ? colorScheme.primary : colorScheme.secondary;
        const particleSize = Phaser.Math.Between(5, 10); // 增大粒子
        const particle = scene.add.circle(x, y, particleSize, color);
        particle.setAlpha(1);
        particle.setDepth(100); // 提高深度确保在最上层

        // 粒子动画 - 延长时间让效果更明显
        scene.tweens.add({
            targets: particle,
            x: x + vx * 0.5,
            y: y + vy * 0.5,
            alpha: 0,
            scale: 0.2,
            duration: 800, // 延长动画时间
            ease: 'Cubic.easeOut',
            onComplete: () => {
                particle.destroy();
            }
        });
    }
}

// 屏幕震动效果
function shakeCamera(scene) {
    if (scene && scene.cameras && scene.cameras.main) {
        scene.cameras.main.shake(100, 0.005);
    }
}

// 球体挤压动画
function squashBallAnimation(scene, ball) {
    if (!ball) return;

    // 停止之前的动画
    scene.tweens.killTweensOf(ball);

    // 挤压效果（纵向压扁，横向拉宽）
    scene.tweens.add({
        targets: ball,
        scaleX: 0.65, // 横向拉宽（从0.5基准）
        scaleY: 0.35, // 纵向压扁（从0.5基准）
        duration: 80,
        ease: 'Quad.easeOut',
        onComplete: () => {
            // 弹回原始大小
            scene.tweens.add({
                targets: ball,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 120,
                ease: 'Elastic.easeOut'
            });
        }
    });
}

// 触摸控制变量
let targetX = 0; // 目标X位置
let lastPointerX = 0;
let pointerVelocity = 0;

// 触摸开始
function onPointerDown(pointer) {
    if (gameOver) {
        return;
    }

    isDragging = true;
    lastPointerX = pointer.x;
    targetX = player.x;
    pointerVelocity = 0;
}

// 触摸移动
function onPointerMove(pointer) {
    if (!gameStarted || gameOver || !isDragging) {
        return;
    }

    // 计算手指移动的距离
    const deltaX = pointer.x - lastPointerX;
    lastPointerX = pointer.x;

    // 直接将移动距离应用到目标位置
    targetX += deltaX;

    // 限制在屏幕范围内
    targetX = Phaser.Math.Clamp(targetX, 20, GAME_WIDTH - 20);

    // 计算需要的速度来追踪目标位置（使用较大的系数使响应更快）
    const diff = targetX - player.x;
    pointerVelocity = diff * 15; // 快速响应系数

    // 限制最大速度
    pointerVelocity = Phaser.Math.Clamp(pointerVelocity, -400, 400);

    player.body.setVelocityX(pointerVelocity);
}

// 触摸结束
function onPointerUp() {
    isDragging = false;
    // 保留一部分惯性速度，让停止更自然
    if (player && player.body) {
        player.body.setVelocityX(pointerVelocity * 0.5);
    }
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
    targetX = 0;
    lastPointerX = 0;
    pointerVelocity = 0;
    clouds = [];
    currentColorIndex = 0;
    wasOnGround = false;
}

// 创建云朵装饰（补充背景的云）
function createClouds(scene) {
    for (let i = 0; i < 4; i++) {
        const cloud = scene.add.ellipse(
            Phaser.Math.Between(0, GAME_WIDTH),
            Phaser.Math.Between(50, GAME_HEIGHT / 2), // 只在上半部分
            Phaser.Math.Between(40, 80),
            Phaser.Math.Between(20, 35),
            0xffffff,
            0.2 // 更透明，作为背景补充
        );
        cloud.setDepth(-5); // 在背景之上，其他元素之下
        clouds.push(cloud);
    }
}

// 更新云朵位置（向上移动）
function updateClouds(scene, deltaSeconds, riseSpeed) {
    clouds.forEach(cloud => {
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
