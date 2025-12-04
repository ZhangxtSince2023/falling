/**
 * 游戏配置和常量
 */

// Helix Jump 风格的颜色配置
const COLOR_SCHEMES = [
    { primary: 0xFF6B9D, secondary: 0xFFA06B }, // 粉色到橙色
    { primary: 0x6B9DFF, secondary: 0x9D6BFF }, // 蓝色到紫色
    { primary: 0xFFD700, secondary: 0xFF69B4 }, // 金色到粉色
    { primary: 0x00CED1, secondary: 0x9370DB }, // 青色到紫色
    { primary: 0xFF4500, secondary: 0xFFD700 }, // 橙红到金色
];

// 难度系统配置 - 线性插值与距离驱动 (Gemini + Claude 优化)
const DIFFICULTY_CONFIG = {
    MAX_DIFFICULTY_SCORE: 10000, // 延长难度曲线到 10000 分

    // 难度参数范围 (Easy -> Hard)
    SPEED: { MIN: 150, MAX: 400 },           // 上升速度 (px/s) - 增长 166%
    PLATFORM_GAP: { MIN: 150, MAX: 280 },    // 平台垂直间距 (px) - 修正：密集→稀疏
    PLATFORM_WIDTH: { MIN: 120, MAX: 45 },   // 平台宽度 (px) - 缩减到 37.5%

    // 节奏变化配置 (P1 优化 - Gemini 建议)
    REST_PLATFORM_INTERVAL: 12,              // 每隔 N 个平台出现一个休息平台
    REST_PLATFORM_WIDTH_MULTIPLIER: 1.8,     // 休息平台宽度倍数
    REST_PLATFORM_GAP_MULTIPLIER: 0.7,       // 休息平台间距倍数（更近）

    // 保留旧的常量以兼容 initTextures
    BASE_PLATFORM_WIDTH_MAX: 150
};

// 线性插值函数
const lerp = (start, end, t) => start + (end - start) * t;

// 计算当前难度参数 - 统一难度曲线到 10000 分
function getDifficulty(currentScore, platformCount = 0) {
    // 计算难度进度 (0.0 到 1.0)
    const progress = Math.min(Math.max(currentScore / DIFFICULTY_CONFIG.MAX_DIFFICULTY_SCORE, 0), 1);

    // 基于进度计算各项参数
    const riseSpeed = lerp(DIFFICULTY_CONFIG.SPEED.MIN, DIFFICULTY_CONFIG.SPEED.MAX, progress);

    // Gap 从密集 (Easy) 到稀疏 (Hard)
    const currentGap = lerp(DIFFICULTY_CONFIG.PLATFORM_GAP.MIN, DIFFICULTY_CONFIG.PLATFORM_GAP.MAX, progress);

    // Width 从宽 (Easy) 到窄 (Hard)
    const currentWidth = lerp(DIFFICULTY_CONFIG.PLATFORM_WIDTH.MIN, DIFFICULTY_CONFIG.PLATFORM_WIDTH.MAX, progress);

    // 检查是否是休息平台 (P1 优化 - 节奏变化)
    const isRestPlatform = platformCount > 0 && platformCount % DIFFICULTY_CONFIG.REST_PLATFORM_INTERVAL === 0;

    // 如果是休息平台，调整参数
    const finalGap = isRestPlatform ? currentGap * DIFFICULTY_CONFIG.REST_PLATFORM_GAP_MULTIPLIER : currentGap;
    const finalWidth = isRestPlatform ? currentWidth * DIFFICULTY_CONFIG.REST_PLATFORM_WIDTH_MULTIPLIER : currentWidth;

    // 核心修复：基于距离计算时间间隔 (距离驱动而非时间驱动)
    // Time (ms) = (Distance / Speed) * 1000
    const spawnInterval = (finalGap / riseSpeed) * 1000;

    return {
        riseSpeed: riseSpeed,
        spawnInterval: spawnInterval,
        platformWidthMin: finalWidth * 0.9, // 波动范围 -10%
        platformWidthMax: finalWidth * 1.1, // 波动范围 +10%
        isRestPlatform: isRestPlatform      // 标记是否为休息平台
    };
}

// 游戏配置
const gameConfig = {
    type: Phaser.AUTO,
    width: 375,
    height: 667,
    parent: 'game-container',
    backgroundColor: '#FF6B9D',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
