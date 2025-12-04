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
    const normalizedScore = currentScore / 100;

    // 速度增长：使用对数函数
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
