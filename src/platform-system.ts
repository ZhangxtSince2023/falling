/**
 * 平台生成与回收管理
 */
import Phaser from 'phaser';
import { COLOR_SCHEMES, DIFFICULTY_CONFIG, getDifficulty } from './game-config.ts';
import { PlatformSpawnStrategy } from './platform-spawn-strategy.ts';
import type { ColorScheme, Difficulty, GamePlatform } from './types.ts';

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

  constructor(scene: Phaser.Scene, gameWidth: number, gameHeight: number) {
    this.scene = scene;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.group = scene.physics.add.group({ allowGravity: false });
    this.platformHeight = 20;
    this.baseTextureWidth = Math.ceil(DIFFICULTY_CONFIG.BASE_PLATFORM_WIDTH_MAX);
    this.spawnHorizontalPadding = 80;
    this.platformTextures = [];
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
    this.platformTextures = [];
    COLOR_SCHEMES.slice(0, 5).forEach((scheme, index) => {
      const key = `platform_texture_${index}`;
      if (!this.scene.textures.exists(key)) {
        const graphics = this.scene.add.graphics();
        graphics.fillGradientStyle(
          scheme.primary,
          scheme.secondary,
          scheme.primary,
          scheme.secondary,
          1,
          1,
          1,
          1
        );
        graphics.fillRoundedRect(
          0,
          0,
          this.baseTextureWidth,
          this.platformHeight,
          10
        );
        graphics.lineStyle(3, 0xffffff, 0.8);
        graphics.strokeRoundedRect(
          0,
          0,
          this.baseTextureWidth,
          this.platformHeight,
          10
        );
        graphics.generateTexture(key, this.baseTextureWidth, this.platformHeight);
        graphics.destroy();
      }
      this.platformTextures.push({ key, scheme });
    });
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

      // 清理和计分
      if (platform.y < -50) {
        if (!platform.counted) {
          this.passedPlatforms++;
          platform.counted = true;
        }
        platform.destroy();
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

    const platform = this.scene.physics.add.sprite(
      safeX,
      y,
      textureInfo.key
    ) as GamePlatform;
    platform.setDisplaySize(width, height);
    this.group.add(platform);

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
    // 重置生成策略 (Gemini + Claude 优化)
    this.spawnStrategy.reset();
  }
}
