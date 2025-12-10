/**
 * 平台生成策略 (Gemini 设计 + Claude 优化)
 * 负责计算下一个平台的 X 坐标和宽度，保证可玩性和节奏感。
 */
import Phaser from 'phaser';
import type {
  Difficulty,
  SpawnStrategyConfig,
  PlatformSpawnResult,
} from './types.ts';

export class PlatformSpawnStrategy {
  private gameWidth: number;
  private spawnPadding: number;
  private config: SpawnStrategyConfig;

  // 状态追踪
  private lastPlatformX: number;
  private consecutiveSameSide: number;
  private consecutiveNarrow: number;
  private currentDirection: number;

  constructor(gameWidth: number, spawnPadding: number) {
    this.gameWidth = gameWidth;
    this.spawnPadding = spawnPadding;

    // 游戏常量配置
    this.config = {
      JUMP_DISTANCE_MAX: 200, // 最大水平跳跃距离
      JUMP_DISTANCE_MIN: 40, // 最小水平移动距离（避免垂直对齐）
      NARROW_WIDTH_THRESHOLD: 70, // 窄平台阈值
      SIDE_SWITCH_CHANCE: 0.7, // 变向概率
      MAX_SAME_SIDE_COUNT: 2, // 最大连续同向次数
    };

    // 初始化状态
    this.lastPlatformX = this.gameWidth / 2;
    this.consecutiveSameSide = 0;
    this.consecutiveNarrow = 0;
    this.currentDirection = 1;
  }

  reset(): void {
    this.lastPlatformX = this.gameWidth / 2; // 初始假定在中心
    this.consecutiveSameSide = 0; // 连续在同一侧（相对于中心）的次数
    this.consecutiveNarrow = 0; // 连续窄平台的次数
    this.currentDirection = 1; // 1: 向右, -1: 向左
  }

  /**
   * 获取下一个平台的生成数据
   */
  getNextPlatform(difficulty: Difficulty): PlatformSpawnResult {
    const width = this.calculateNextWidth(difficulty);
    const x = this.calculateNextX(width);

    // 更新状态
    this.updateState(x, width);

    return { x, width };
  }

  /**
   * 计算下一个平台的宽度
   * 策略：避免连续出现极窄平台
   */
  private calculateNextWidth(difficulty: Difficulty): number {
    let minW = difficulty.platformWidthMin;
    let maxW = difficulty.platformWidthMax;

    // 如果上一次是窄平台，这次强制生成较宽的平台
    if (this.consecutiveNarrow >= 1) {
      minW = Math.max(minW, this.config.NARROW_WIDTH_THRESHOLD + 10);
      maxW = Math.max(maxW, minW + 20);
    }

    // 确保不超过屏幕限制
    const availableScreen = this.gameWidth - this.spawnPadding * 2;
    maxW = Math.min(maxW, availableScreen);
    minW = Math.min(minW, maxW);

    return Phaser.Math.Between(Math.floor(minW), Math.floor(maxW));
  }

  /**
   * 计算下一个平台的 X 坐标
   * 策略：基于当前位置 +/- 跳跃距离，优先左右交替
   */
  private calculateNextX(width: number): number {
    // 1. 确定边界 (考虑 Platform 自身宽度的一半)
    const halfWidth = width / 2;
    const minScreenX = this.spawnPadding + halfWidth;
    const maxScreenX = this.gameWidth - this.spawnPadding - halfWidth;

    // 如果屏幕太窄容不下平台，直接返回中心
    if (minScreenX > maxScreenX) return this.gameWidth / 2;

    // 2. 决定尝试的方向 (左还是右)
    let tryDirection = this.currentDirection;

    // 掷骰子决定是否改变意图方向
    if (Math.random() < this.config.SIDE_SWITCH_CHANCE) {
      tryDirection *= -1;
    }

    // 检查是否触发强制换向逻辑 (防止玩家一直贴墙跳)
    const isRightSide = this.lastPlatformX > this.gameWidth / 2;
    const directionToCenter = isRightSide ? -1 : 1;

    if (this.consecutiveSameSide >= this.config.MAX_SAME_SIDE_COUNT) {
      tryDirection = directionToCenter; // 强制向中心/对面跳
    }

    // 3. 计算基于方向的理想区间
    let targetMin: number, targetMax: number;

    if (tryDirection === 1) {
      // 向右跳
      targetMin = this.lastPlatformX + this.config.JUMP_DISTANCE_MIN;
      targetMax = this.lastPlatformX + this.config.JUMP_DISTANCE_MAX;
    } else {
      // 向左跳
      targetMin = this.lastPlatformX - this.config.JUMP_DISTANCE_MAX;
      targetMax = this.lastPlatformX - this.config.JUMP_DISTANCE_MIN;
    }

    // 4. 与屏幕边界求交集
    let validMin = Math.max(minScreenX, targetMin);
    let validMax = Math.min(maxScreenX, targetMax);

    // 5. 如果当前方向不可行，反转方向尝试
    if (validMin > validMax) {
      tryDirection *= -1;
      if (tryDirection === 1) {
        targetMin = this.lastPlatformX + this.config.JUMP_DISTANCE_MIN;
        targetMax = this.lastPlatformX + this.config.JUMP_DISTANCE_MAX;
      } else {
        targetMin = this.lastPlatformX - this.config.JUMP_DISTANCE_MAX;
        targetMax = this.lastPlatformX - this.config.JUMP_DISTANCE_MIN;
      }
      validMin = Math.max(minScreenX, targetMin);
      validMax = Math.min(maxScreenX, targetMax);
    }

    // 6. 兜底处理：在所有合法屏幕范围内找位置
    if (validMin > validMax) {
      const safeRange = this.config.JUMP_DISTANCE_MAX;
      validMin = Math.max(minScreenX, this.lastPlatformX - safeRange);
      validMax = Math.min(maxScreenX, this.lastPlatformX + safeRange);
    }

    // 7. 最终随机生成
    const nextX = Phaser.Math.Between(
      Math.floor(validMin),
      Math.floor(validMax)
    );

    // 记录实际跳跃方向供下次参考
    this.currentDirection = nextX >= this.lastPlatformX ? 1 : -1;

    return nextX;
  }

  private updateState(x: number, width: number): void {
    // 检查是否停留在同一侧 (左半屏 or 右半屏)
    const centerX = this.gameWidth / 2;
    const wasRight = this.lastPlatformX > centerX;
    const isRight = x > centerX;

    if (wasRight === isRight) {
      this.consecutiveSameSide++;
    } else {
      this.consecutiveSameSide = 0;
    }

    // 检查宽度
    if (width < this.config.NARROW_WIDTH_THRESHOLD) {
      this.consecutiveNarrow++;
    } else {
      this.consecutiveNarrow = 0;
    }

    this.lastPlatformX = x;
  }

  // 供外部调用重置上一平台位置 (例如初始生成后)
  setLastPlatform(x: number, _width: number): void {
    this.lastPlatformX = x;
  }
}
