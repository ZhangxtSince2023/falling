/**
 * 游戏主逻辑入口
 * 依赖: game-config.ts, visual-effects.ts, localization.ts, haptics.ts, platform-system.ts, player-controller.ts, input-handler.ts
 */
import Phaser from 'phaser';
import { i18n } from './localization.ts';
import { gameConfig, getDifficulty } from './game-config.ts';
import {
  createClouds,
  updateClouds,
  createImpactRing,
  createBallGlow,
  createImpactParticles,
  squashBallAnimation,
  flashPlatform,
} from './visual-effects.ts';
import { vibrate } from './haptics.ts';
import { PlatformSystem } from './platform-system.ts';
import { PlayerController } from './player-controller.ts';
import { InputHandler } from './input-handler.ts';
import type { Difficulty, GamePlatform } from './types.ts';

// 游戏状态
let playerController: PlayerController;
let platformSystem: PlatformSystem;
let inputHandler: InputHandler;
let gameOver = false;
let gameStarted = false;
let clouds: Phaser.GameObjects.Ellipse[] = [];
let score = 0;
let lastDisplayedScore = -1; // 用于脏检查，避免每帧重绘
let scoreText: Phaser.GameObjects.Text;
let gameOverText: Phaser.GameObjects.Text;
let restartButton: Phaser.GameObjects.Text;
let languageButton: Phaser.GameObjects.Text;
let currentScene: Phaser.Scene;
let currentDifficulty: Difficulty;
let GAME_HEIGHT: number;
let GAME_WIDTH: number;

function preload(this: Phaser.Scene): void {
  // 加载 AI 生成的图片资源
  this.load.svg('ball', 'assets/images/ball.svg', { width: 64, height: 64 });
}

function create(this: Phaser.Scene): void {
  GAME_WIDTH = this.scale.width;
  GAME_HEIGHT = this.scale.height;
  currentScene = this;

  // 创建渐变背景
  const graphics = this.add.graphics();
  graphics.fillGradientStyle(
    0xff6b9d,
    0xff6b9d,
    0xffa06b,
    0xffa06b,
    1,
    1,
    1,
    1
  );
  graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  graphics.setDepth(-10);

  // 创建顶部危险区域
  const topDangerZone = this.add.rectangle(
    GAME_WIDTH / 2,
    25,
    GAME_WIDTH,
    50,
    0xff0000,
    0.3
  );
  topDangerZone.setDepth(-1);

  // 创建底部危险区域
  const bottomDangerZone = this.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT - 25,
    GAME_WIDTH,
    50,
    0xff0000,
    0.3
  );
  bottomDangerZone.setDepth(-1);

  // 创建云朵装饰
  clouds = createClouds(this, GAME_WIDTH, GAME_HEIGHT);

  // 平台管理
  platformSystem = new PlatformSystem(this, GAME_WIDTH, GAME_HEIGHT);
  platformSystem.createInitialPlatforms();

  // 创建小球控制
  playerController = new PlayerController(this, GAME_WIDTH, GAME_HEIGHT);

  // 添加碰撞检测
  this.physics.add.collider(
    playerController.sprite,
    platformSystem.group,
    onPlayerLandOnPlatform as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    undefined,
    this
  );

  // 创建UI
  scoreText = this.add.text(16, 16, i18n.t('score') + ': 0', {
    fontSize: '24px',
    color: '#fff',
    fontStyle: 'bold',
    stroke: '#000',
    strokeThickness: 4,
  });
  scoreText.setScrollFactor(0);
  scoreText.setDepth(100);

  // 语言切换按钮
  languageButton = this.add.text(
    GAME_WIDTH - 16,
    16,
    '🌐 ' + i18n.getCurrentLanguageName(),
    {
      fontSize: '20px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: '#00000066',
      padding: { x: 10, y: 5 },
    }
  );
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

function update(this: Phaser.Scene, _time: number, delta: number): void {
  if (!gameStarted || gameOver) return;

  const deltaSeconds = delta / 1000;

  playerController.markAirborne();

  // 根据当前分数和平台数量计算难度 (P1 优化 - 节奏变化)
  currentDifficulty = getDifficulty(
    score,
    platformSystem.totalPlatformsGenerated
  );

  // 平台更新
  platformSystem.update(delta, currentDifficulty);

  // 检查失败条件
  if (
    playerController.sprite.y <= 35 ||
    playerController.sprite.y >= GAME_HEIGHT - 50
  ) {
    triggerGameOver(this);
    return;
  }

  score = platformSystem.getScore();
  // 脏检查：只在分数变化时才更新文本，避免每帧重绘
  if (score !== lastDisplayedScore) {
    scoreText.setText(i18n.t('score') + ': ' + score);
    lastDisplayedScore = score;
  }

  // 输入更新
  inputHandler.applyKeyboardControl();

  // 更新云朵
  updateClouds(
    clouds,
    deltaSeconds,
    currentDifficulty.riseSpeed,
    GAME_WIDTH,
    GAME_HEIGHT
  );

  // 记录当前帧的垂直速度（用于下一帧碰撞检测）
  playerController.updateLastVelocity();
}

// 玩家落在平台上
function onPlayerLandOnPlatform(
  player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  platform: Phaser.Types.Physics.Arcade.GameObjectWithBody
): void {
  const playerSprite = player as Phaser.Physics.Arcade.Sprite;
  const platformSprite = platform as GamePlatform;
  const playerBody = playerSprite.body as Phaser.Physics.Arcade.Body;

  // 使用上一帧记录的速度作为撞击速度（碰撞时当前速度可能已被引擎重置）
  const impactVelocity = playerController.lastVelocityY;
  const isLanding = !playerController.wasOnGround && playerBody.touching.down;

  if (isLanding) {
    const contactX = playerSprite.x;
    const contactY = playerSprite.y + playerSprite.displayHeight / 2;

    // 撞击冲击波效果（绑定在小球位置）
    createImpactRing(currentScene, contactX, contactY, platformSprite.colorScheme);

    // 小球发光效果
    createBallGlow(currentScene, playerSprite, platformSprite.colorScheme);

    // 粒子效果
    createImpactParticles(
      currentScene,
      contactX,
      contactY,
      platformSprite.colorScheme
    );

    // 相机震动（根据撞击速度调整强度）
    const shakeIntensity = Math.min(impactVelocity / 200, 1) * 0.008;
    if (currentScene?.cameras?.main) {
      currentScene.cameras.main.shake(80, shakeIntensity);
    }

    // 手机震动（根据撞击速度决定强度）
    const vibrateStyle = impactVelocity > 300 ? 'medium' : 'light';
    vibrate(vibrateStyle);

    // 小球挤压动画（传入撞击速度）
    squashBallAnimation(currentScene, playerSprite, impactVelocity);

    // 平台闪烁
    flashPlatform(currentScene, platformSprite);

    playerController.markOnGround();
  }

  if (playerBody.touching.down) {
    playerController.markOnGround();
  }
}

// 开始界面
let startScreenElements: Phaser.GameObjects.GameObject[] = [];

function showStartScreen(scene: Phaser.Scene): void {
  const titleText = scene.add.text(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 - 80,
    i18n.t('gameTitle') || '坠落小球',
    {
      fontSize: '42px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6,
    }
  );
  titleText.setOrigin(0.5);
  titleText.setDepth(100);
  startScreenElements.push(titleText);

  const startText = scene.add.text(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 + 20,
    i18n.t('tapToStart') || '点击屏幕开始游戏',
    {
      fontSize: '28px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
    }
  );
  startText.setOrigin(0.5);
  startText.setDepth(100);
  startScreenElements.push(startText);

  scene.tweens.add({
    targets: startText,
    alpha: 0.3,
    duration: 800,
    yoyo: true,
    repeat: -1,
  });

  scene.physics.pause();

  scene.input.once('pointerdown', () => {
    vibrate('light');
    startGame(scene);
  });
}

function startGame(scene: Phaser.Scene): void {
  startScreenElements.forEach((element) => {
    if (element?.destroy) element.destroy();
  });
  startScreenElements = [];
  scene.physics.resume();
  gameStarted = true;
}

// 游戏失败
function triggerGameOver(scene: Phaser.Scene): void {
  // 游戏结束震动反馈
  vibrate('error');

  gameOver = true;
  scene.physics.pause();

  gameOverText = scene.add.text(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 - 100,
    i18n.t('gameOver'),
    {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6,
    }
  );
  gameOverText.setOrigin(0.5);
  gameOverText.setScrollFactor(0);
  gameOverText.setDepth(100);

  const finalScoreText = scene.add.text(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    i18n.t('finalScore') + ': ' + score,
    {
      fontSize: '32px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
    }
  );
  finalScoreText.setOrigin(0.5);
  finalScoreText.setScrollFactor(0);
  finalScoreText.setDepth(100);

  restartButton = scene.add.text(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 + 80,
    i18n.t('tapToRestart'),
    {
      fontSize: '28px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
    }
  );
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

// 清理开始界面元素（防止内存泄漏）
function cleanupStartScreen(): void {
  startScreenElements.forEach((element) => {
    if (element?.destroy) element.destroy();
  });
  startScreenElements = [];
}

// 重置游戏
function resetGame(): void {
  gameOver = false;
  gameStarted = false;
  score = 0;
  lastDisplayedScore = -1; // 重置分数显示状态
  clouds = [];
  // 清理开始界面元素（修复换语言时的内存泄漏）
  cleanupStartScreen();
  inputHandler?.reset();
  platformSystem?.reset();
  playerController?.resetFlags();
}

// 切换语言
function cycleLanguage(): void {
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

// 设置场景函数并创建游戏实例（惰性单例，避免 HMR/重复导入多实例）
gameConfig.scene = {
  preload: preload,
  create: create,
  update: update,
};

let phaserGame: Phaser.Game | null = null;

export function createGame(): Phaser.Game {
  if (phaserGame) return phaserGame;
  phaserGame = new Phaser.Game(gameConfig);
  return phaserGame;
}

// 兼容直接通过 <script type="module"> 加载的场景入口，
// 并在 Vite HMR 下防止重复实例化
const globalScope = globalThis as { __FALLING_GAME__?: Phaser.Game };

if (!globalScope.__FALLING_GAME__) {
    globalScope.__FALLING_GAME__ = createGame();
}

// 兼容 Vite HMR：谨慎访问 import.meta.hot 避免类型错误
const hot = (import.meta as { hot?: { dispose: (cb: () => void) => void } })
    .hot;
if (hot) {
    hot.dispose(() => {
        globalScope.__FALLING_GAME__?.destroy(true);
        globalScope.__FALLING_GAME__ = undefined;
        phaserGame = null;
    });
}
