/**
 * 平台生成与回收管理
 */
import Phaser from 'phaser';
import { getColorSchemes, DIFFICULTY_CONFIG, getDifficulty } from './game-config.ts';
import { PlatformSpawnStrategy } from './platform-spawn-strategy.ts';
import type { ColorScheme, Difficulty, GamePlatform } from './types.ts';
import { themeManager } from './theme';

interface TextureInfo {
  key: string;
  scheme: ColorScheme;
}

export class PlatformSystem {
  private scene: Phaser.Scene;
  private gameWidth: number;
  private gameHeight: number;
  public group: Phaser.Physics.Arcade.Group;
  private platformHeight: number;
  private baseTextureWidth: number;
  private spawnHorizontalPadding: number;
  private platformTextures: TextureInfo[];
  private spawnTimer: number;
  private passedPlatforms: number;
  public totalPlatformsGenerated: number;
  private spawnStrategy: PlatformSpawnStrategy;
  // 对象池：存放被回收的平台，供复用 (Codex 优化 - 减少 GC 压力)
  private platformPool: GamePlatform[];
  private readonly POOL_MAX_SIZE = 20;

  constructor(scene: Phaser.Scene, gameWidth: number, gameHeight: number) {
    this.scene = scene;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.group = scene.physics.add.group({ allowGravity: false });
    this.platformHeight = 20;
    this.baseTextureWidth = Math.ceil(DIFFICULTY_CONFIG.BASE_PLATFORM_WIDTH_MAX);
    this.spawnHorizontalPadding = 80;
    this.platformTextures = [];
    this.platformPool = [];
    this.initTextures();
    this.spawnTimer = 0;
    this.passedPlatforms = 0;
    this.totalPlatformsGenerated = 0;

    // 整合生成策略系统 (Gemini + Claude 优化)
    this.spawnStrategy = new PlatformSpawnStrategy(
      gameWidth,
      this.spawnHorizontalPadding
    );
  }

  private getRandomPlatformWidth(difficulty?: Difficulty): number {
    const diff = difficulty ?? getDifficulty(0);
    const availableWidth = Math.max(
      1,
      this.gameWidth - this.spawnHorizontalPadding * 2
    );
    const maxWidth = Math.min(
      Math.floor(diff.platformWidthMax),
      Math.floor(availableWidth)
    );
    const minWidth = Math.min(Math.floor(diff.platformWidthMin), maxWidth);
    return Phaser.Math.Between(minWidth, maxWidth);
  }

  private getHorizontalBounds(width: number): { minX: number; maxX: number } {
    const halfWidth = width / 2;
    const minX = this.spawnHorizontalPadding + halfWidth;
    const maxX = this.gameWidth - this.spawnHorizontalPadding - halfWidth;

    if (minX > maxX) {
      return { minX: this.gameWidth / 2, maxX: this.gameWidth / 2 };
    }

    return { minX, maxX };
  }

  private validatePlatformX(x: number, width: number): number {
    const { minX, maxX } = this.getHorizontalBounds(width);
    return Phaser.Math.Clamp(x, minX, maxX);
  }

  private initTextures(): void {
    const colorSchemes = getColorSchemes();
    const mode = themeManager.getMode();
    const isDark = themeManager.isDark();

    this.platformTextures = [];
    colorSchemes.slice(0, 5).forEach((scheme, index) => {
      const key = `platform_texture_${mode}_${index}`;
      if (!this.scene.textures.exists(key)) {
        const graphics = this.scene.add.graphics();
        const w = this.baseTextureWidth;
        const h = this.platformHeight;
        const radius = h / 2;

        if (isDark) {
          // 暗色主题：霓虹发光效果
          // 外发光层 (模糊光晕)
          graphics.fillStyle(scheme.primary, 0.15);
          graphics.fillRoundedRect(-4, -4, w + 8, h + 8, radius + 2);

          // 中发光层
          graphics.fillStyle(scheme.primary, 0.3);
          graphics.fillRoundedRect(-2, -2, w + 4, h + 4, radius + 1);

          // 核心填充 (暗色透明，让边框更突出)
          graphics.fillStyle(0x000000, 0.4);
          graphics.fillRoundedRect(0, 0, w, h, radius);

          // 主霓虹边框
          graphics.lineStyle(3, scheme.primary, 1);
          graphics.strokeRoundedRect(0, 0, w, h, radius);

          // 内部高光线条
          graphics.lineStyle(1, 0xffffff, 0.6);
          graphics.strokeRoundedRect(2, 2, w - 4, h - 4, radius - 1);
        } else {
          // 亮色主题：柔和粉彩效果
          // 外层柔和阴影
          graphics.fillStyle(scheme.secondary, 0.2);
          graphics.fillRoundedRect(-3, -3, w + 6, h + 6, radius + 2);

          // 主体填充 (柔和渐变感)
          graphics.fillStyle(scheme.primary, 0.9);
          graphics.fillRoundedRect(0, 0, w, h, radius);

          // 顶部高光
          graphics.fillStyle(0xffffff, 0.4);
          graphics.fillRoundedRect(2, 2, w - 4, h / 2 - 2, radius - 1);

          // 柔和边框
          graphics.lineStyle(2, scheme.secondary, 0.8);
          graphics.strokeRoundedRect(0, 0, w, h, radius);
        }

        graphics.generateTexture(key, w + 8, h + 8);
        graphics.destroy();
      }
      this.platformTextures.push({ key, scheme });
    });
  }

  // 重新生成纹理（主题切换时调用）
  regenerateTextures(): void {
    // 移除旧纹理
    for (let i = 0; i < this.platformTextures.length; i++) {
      const t = this.platformTextures[i];
      if (this.scene.textures.exists(t.key)) {
        this.scene.textures.remove(t.key);
      }
    }

    // 生成新主题的纹理
    this.initTextures();

    // 更新现有平台的纹理
    const platforms = this.group.getChildren() as GamePlatform[];
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      const randomIndex = Phaser.Math.Between(0, this.platformTextures.length - 1);
      const textureInfo = this.platformTextures[randomIndex];
      platform.setTexture(textureInfo.key);
      platform.colorScheme = textureInfo.scheme;
    }
  }

  createInitialPlatforms(): void {
    // 使用难度系统的初始参数 (Gemini + Claude 优化)
    const initialDiff = getDifficulty(0);

    // 小球初始位置在 gameHeight / 2 + 100，在其下方 50px 处创建起始平台
    const playerStartY = this.gameHeight / 2 + 100;
    const startPlatformY = playerStartY + 50;

    // 创建起始平台（在小球正下方，宽度稍大便于落地）
    const startPlatformWidth = Math.min(
      DIFFICULTY_CONFIG.PLATFORM_WIDTH.MIN * 1.2,
      this.gameWidth - this.spawnHorizontalPadding * 2
    );
    this.createPlatform(
      this.gameWidth / 2,
      startPlatformY,
      initialDiff,
      startPlatformWidth
    );

    // 从起始平台向下创建更多平台，填充到屏幕底部
    const gap = DIFFICULTY_CONFIG.PLATFORM_GAP.MIN;
    for (let y = startPlatformY + gap; y < this.gameHeight + gap; y += gap) {
      const { x, width } = this.spawnStrategy.getNextPlatform(initialDiff);
      this.createPlatform(x, y, initialDiff, width);
    }

    // 从起始平台向上创建平台，填充到屏幕顶部以上
    for (let y = startPlatformY - gap; y > -gap; y -= gap) {
      const { x, width } = this.spawnStrategy.getNextPlatform(initialDiff);
      this.createPlatform(x, y, initialDiff, width);
    }
  }

  update(delta: number, difficulty: Difficulty): void {
    // 优化：单次倒序遍历 - 同时处理移动、计分和清理 (Claude + Codex 优化)
    const platforms = this.group.getChildren() as GamePlatform[];
    for (let i = platforms.length - 1; i >= 0; i--) {
      const platform = platforms[i];

      // 更新速度
      if (platform.body) {
        (platform.body as Phaser.Physics.Arcade.Body).velocity.y =
          -difficulty.riseSpeed;
      }

      // 清理和计分：使用对象池回收而非销毁 (Codex 优化 - 减少 GC)
      if (platform.y < -50) {
        if (!platform.counted) {
          this.passedPlatforms++;
          platform.counted = true;
        }
        this.recyclePlatform(platform);
      }
    }

    // 修复后的计时器逻辑 - 使用 while 处理卡顿补偿 (Claude + Codex 优化)
    this.spawnTimer += delta;
    while (this.spawnTimer >= difficulty.spawnInterval) {
      this.generateNewPlatform(difficulty);
      this.spawnTimer -= difficulty.spawnInterval; // 保留剩余时间，不丢失精度
    }
  }

  private generateNewPlatform(difficulty: Difficulty): void {
    // 使用策略系统生成平台位置和宽度 (Gemini + Claude 优化)
    this.totalPlatformsGenerated++;
    const { x, width } = this.spawnStrategy.getNextPlatform(difficulty);

    // P1 优化 - 根据速度动态调整预生成位置（保证 2.5s 缓冲时间）
    const bufferTime = 2.5; // 秒
    const newY = this.gameHeight + difficulty.riseSpeed * bufferTime;

    this.createPlatform(x, newY, difficulty, width);
  }

  // 回收平台到对象池 (Codex 优化 - 减少 GC 压力)
  private recyclePlatform(platform: GamePlatform): void {
    // 从物理组中移除（但不销毁）
    this.group.remove(platform, false, false);
    // 隐藏并禁用
    platform.setActive(false);
    platform.setVisible(false);
    if (platform.body) {
      (platform.body as Phaser.Physics.Arcade.Body).enable = false;
    }
    // 添加到对象池（有上限，超出则销毁）
    if (this.platformPool.length < this.POOL_MAX_SIZE) {
      this.platformPool.push(platform);
    } else {
      platform.destroy();
    }
  }

  // 从对象池获取或创建新平台 (Codex 优化 - 减少 GC 压力)
  private getOrCreatePlatform(
    x: number,
    y: number,
    textureKey: string
  ): GamePlatform {
    let platform: GamePlatform;

    if (this.platformPool.length > 0) {
      // 从对象池复用
      platform = this.platformPool.pop()!;
      platform.setTexture(textureKey);
      platform.setPosition(x, y);
      platform.setActive(true);
      platform.setVisible(true);
      if (platform.body) {
        (platform.body as Phaser.Physics.Arcade.Body).enable = true;
      }
      this.group.add(platform);
    } else {
      // 创建新平台
      platform = this.scene.physics.add.sprite(x, y, textureKey) as GamePlatform;
      this.group.add(platform);
    }

    return platform;
  }

  private createPlatform(
    x: number,
    y: number,
    difficulty?: Difficulty,
    widthOverride?: number
  ): void {
    const diff = difficulty ?? getDifficulty(0);
    const maxAllowedWidth = Math.max(
      1,
      this.gameWidth - this.spawnHorizontalPadding * 2
    );
    const width = Math.min(
      widthOverride ?? this.getRandomPlatformWidth(diff),
      maxAllowedWidth
    );
    const height = this.platformHeight;
    const safeX = this.validatePlatformX(x, width);

    // P1 优化 - 随机颜色避免玩家通过颜色预判
    const randomColorIndex = Phaser.Math.Between(
      0,
      this.platformTextures.length - 1
    );
    const textureInfo = this.platformTextures[randomColorIndex];
    const colorScheme = textureInfo.scheme;

    // 使用对象池获取或创建平台 (Codex 优化)
    const platform = this.getOrCreatePlatform(safeX, y, textureInfo.key);
    platform.setDisplaySize(width, height);

    if (platform.body) {
      const body = platform.body as Phaser.Physics.Arcade.Body;
      body.allowGravity = false;
      body.immovable = true;
      body.setSize(width, height);
    }

    platform.counted = false;
    platform.colorScheme = colorScheme;
  }

  getScore(): number {
    return this.passedPlatforms * 10;
  }

  reset(): void {
    this.spawnTimer = 0;
    this.passedPlatforms = 0;
    this.totalPlatformsGenerated = 0;
    // 清理对象池 (Codex 优化)
    for (let i = 0; i < this.platformPool.length; i++) {
      this.platformPool[i].destroy();
    }
    this.platformPool = [];
    // 重置生成策略 (Gemini + Claude 优化)
    this.spawnStrategy.reset();
  }
}
