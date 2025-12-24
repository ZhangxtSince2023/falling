/**
 * UI 组件系统
 * 提供统一的 UI 风格：可爱圆润字体、面板、按钮动画等
 */
import Phaser from 'phaser';
import { themeManager } from './theme';

// 获取当前主题的 UI 颜色
export function getUIColors() {
  return themeManager.getTheme().colors.ui;
}

// UI 配置常量
export const UI_CONFIG = {
  // 字体配置
  fonts: {
    primary: '"ZCOOL KuaiLe", "Kosugi Maru", "Nunito", sans-serif',
    number: '"Nunito", "ZCOOL KuaiLe", "Kosugi Maru", sans-serif',
  },
  // 颜色配置 - 动态获取
  get colors() {
    const uiColors = getUIColors();
    return {
      panelBg: uiColors.panelBg,
      panelBgAlpha: uiColors.panelBgAlpha,
      buttonBg: uiColors.buttonBg,
      buttonBgAlpha: uiColors.buttonBgAlpha,
      buttonBorder: uiColors.buttonBorder,
      textPrimary: uiColors.textPrimary,
      textAccent: uiColors.textAccent,
      textSuccess: uiColors.textSuccess,
      textDanger: uiColors.textDanger,
      textStroke: uiColors.textStroke,
      textStrokeThickness: uiColors.textStrokeThickness,
      neonCyan: uiColors.neonPrimary,
      neonMagenta: uiColors.neonSecondary,
    };
  },
  // 动画配置
  animation: {
    buttonPressDuration: 80,
    buttonPressScale: 0.92,
    fadeInDuration: 300,
    pulseAlpha: { min: 0.5, max: 1 },
    pulseDuration: 800,
  },
};

/**
 * 创建霓虹风格面板
 */
export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    bgColor?: number;
    bgAlpha?: number;
    borderRadius?: number;
    borderColor?: number;
    borderWidth?: number;
  }
): Phaser.GameObjects.Graphics {
  const {
    bgColor = UI_CONFIG.colors.panelBg,
    bgAlpha = UI_CONFIG.colors.panelBgAlpha,
    borderRadius = 8, // 更方正的边角
    borderColor = UI_CONFIG.colors.neonCyan,
    borderWidth = 2,
  } = options || {};

  const graphics = scene.add.graphics();
  const left = x - width / 2;
  const top = y - height / 2;

  // 阴影/辉光层
  graphics.fillStyle(borderColor, 0.15);
  graphics.fillRoundedRect(left + 2, top + 2, width, height, borderRadius);

  // 主背景
  graphics.fillStyle(bgColor, bgAlpha);
  graphics.fillRoundedRect(left, top, width, height, borderRadius);

  // 边框
  graphics.lineStyle(borderWidth, borderColor, 0.8);
  graphics.strokeRoundedRect(left, top, width, height, borderRadius);

  graphics.setDepth(90);
  return graphics;
}

/**
 * 创建带样式的文本
 */
export function createStyledText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  options?: {
    fontSize?: string;
    color?: string;
    fontFamily?: string;
    stroke?: string;
    strokeThickness?: number;
    shadow?: boolean;
  }
): Phaser.GameObjects.Text {
  const {
    fontSize = '32px',
    color = UI_CONFIG.colors.textPrimary,
    fontFamily = UI_CONFIG.fonts.primary,
    stroke = UI_CONFIG.colors.textStroke,
    strokeThickness = UI_CONFIG.colors.textStrokeThickness,
    shadow = true,
  } = options || {};

  const textObj = scene.add.text(x, y, text, {
    fontSize,
    color,
    fontFamily,
    fontStyle: 'bold',
    stroke,
    strokeThickness,
  });

  if (shadow) {
    // Soft shadow
    textObj.setShadow(2, 2, 'rgba(0,0,0,0.25)', 2, true, false);
  }

  textObj.setOrigin(0.5);
  textObj.setDepth(100);
  return textObj;
}

/**
 * 创建大号分数显示（只显示数字）
 */
export function createScoreDisplay(
  scene: Phaser.Scene,
  x: number,
  y: number,
  initialScore: number = 0
): Phaser.GameObjects.Text {
  const scoreText = scene.add.text(x, y, String(initialScore), {
    fontSize: '64px',
    color: UI_CONFIG.colors.textPrimary,
    fontFamily: UI_CONFIG.fonts.number,
    fontStyle: '900', // Extra bold
    stroke: UI_CONFIG.colors.textStroke,
    strokeThickness: UI_CONFIG.colors.textStrokeThickness * 2, // 分数描边稍微粗一点
  });

  // Soft shadow
  scoreText.setShadow(2, 2, 'rgba(0,0,0,0.1)', 2, true, false);
  scoreText.setOrigin(0.5, 0);
  scoreText.setScrollFactor(0);
  scoreText.setDepth(100);
  return scoreText;
}

/**
 * 创建带动画的按钮
 */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  onClick: () => void,
  options?: {
    fontSize?: string;
    color?: string;
    bgColor?: number;
    bgAlpha?: number;
    paddingX?: number;
    paddingY?: number;
    borderRadius?: number;
  }
): { container: Phaser.GameObjects.Container; text: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Graphics } {
  const {
    fontSize = '28px',
    color = UI_CONFIG.colors.textSuccess,
    bgColor = UI_CONFIG.colors.buttonBg,
    bgAlpha = UI_CONFIG.colors.buttonBgAlpha,
    paddingX = 30,
    paddingY = 15,
    borderRadius = 15,
  } = options || {};

  // 创建文本（先创建以获取尺寸）
  const buttonText = scene.add.text(0, 0, text, {
    fontSize,
    color,
    fontFamily: UI_CONFIG.fonts.primary,
    fontStyle: 'bold',
    stroke: UI_CONFIG.colors.textStroke,
    strokeThickness: Math.max(2, UI_CONFIG.colors.textStrokeThickness - 1),
  });
  buttonText.setOrigin(0.5);

  // 计算背景尺寸
  const bgWidth = buttonText.width + paddingX * 2;
  const bgHeight = buttonText.height + paddingY * 2;

  // 创建背景
  const bg = scene.add.graphics();
  bg.fillStyle(bgColor, bgAlpha);
  bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, borderRadius);
  bg.lineStyle(3, UI_CONFIG.colors.buttonBorder, 0.8);
  bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, borderRadius);

  // 创建容器
  const container = scene.add.container(x, y, [bg, buttonText]);
  container.setSize(bgWidth, bgHeight);
  container.setInteractive({ useHandCursor: true });
  container.setDepth(100);

  // 按下动画
  container.on('pointerdown', () => {
    scene.tweens.add({
      targets: container,
      scaleX: UI_CONFIG.animation.buttonPressScale,
      scaleY: UI_CONFIG.animation.buttonPressScale,
      duration: UI_CONFIG.animation.buttonPressDuration,
      ease: 'Power2',
    });
  });

  // 松开动画 + 点击回调
  container.on('pointerup', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: UI_CONFIG.animation.buttonPressDuration,
      ease: 'Power2',
      onComplete: onClick,
    });
  });

  // 移出时恢复
  container.on('pointerout', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: UI_CONFIG.animation.buttonPressDuration,
      ease: 'Power2',
    });
  });

  return { container, text: buttonText, bg };
}

/**
 * 创建带脉冲动画的文本
 */
export function createPulsingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  options?: {
    fontSize?: string;
    color?: string;
  }
): Phaser.GameObjects.Text {
  const {
    fontSize = '24px',
    color = UI_CONFIG.colors.textAccent,
  } = options || {};

  const textObj = createStyledText(scene, x, y, text, { fontSize, color });

  scene.tweens.add({
    targets: textObj,
    alpha: UI_CONFIG.animation.pulseAlpha.min,
    duration: UI_CONFIG.animation.pulseDuration,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  return textObj;
}

/**
 * 游戏结束面板组件
 */
export interface GameOverPanelElements {
  panel: Phaser.GameObjects.Graphics;
  titleText: Phaser.GameObjects.Text;
  scoreText: Phaser.GameObjects.Text;
  button: {
    container: Phaser.GameObjects.Container;
    text: Phaser.GameObjects.Text;
    bg: Phaser.GameObjects.Graphics;
  };
  allElements: Phaser.GameObjects.GameObject[];
}

export function createGameOverPanel(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  score: number,
  texts: { gameOver: string; finalScore: string; restart: string },
  onRestart: () => void
): GameOverPanelElements {
  const panelWidth = 280;
  const panelHeight = 260;

  // 创建面板背景
  const panel = createPanel(scene, centerX, centerY, panelWidth, panelHeight, {
    bgAlpha: 0.75,
    borderRadius: 25,
    borderColor: 0xffffff,
    borderWidth: 3,
  });

  // 游戏结束标题
  const titleText = createStyledText(scene, centerX, centerY - 80, texts.gameOver, {
    fontSize: '36px',
    color: UI_CONFIG.colors.textDanger,
    strokeThickness: 5,
  });

  // 最终分数
  const scoreText = createStyledText(scene, centerX, centerY - 10, String(score), {
    fontSize: '64px',
    color: UI_CONFIG.colors.textAccent,
    fontFamily: UI_CONFIG.fonts.number,
    strokeThickness: 6,
  });

  // 重新开始按钮
  const button = createButton(scene, centerX, centerY + 80, texts.restart, onRestart, {
    fontSize: '24px',
  });

  const allElements: Phaser.GameObjects.GameObject[] = [
    panel,
    titleText,
    scoreText,
    button.container,
  ];

  return { panel, titleText, scoreText, button, allElements };
}

/**
 * 开始界面面板组件
 */
export interface StartScreenElements {
  panel: Phaser.GameObjects.Graphics;
  titleText: Phaser.GameObjects.Text;
  hintText: Phaser.GameObjects.Text;
  allElements: Phaser.GameObjects.GameObject[];
}

export function createStartScreen(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  texts: { title: string; hint: string }
): StartScreenElements {
  const panelWidth = 300;
  const panelHeight = 200;

  // 创建面板背景
  const panel = createPanel(scene, centerX, centerY, panelWidth, panelHeight, {
    bgAlpha: 0.65,
    borderRadius: 25,
    borderColor: 0xffffff,
    borderWidth: 2,
  });

  // 游戏标题
  const titleText = createStyledText(scene, centerX, centerY - 40, texts.title, {
    fontSize: '42px',
    color: UI_CONFIG.colors.textPrimary,
    strokeThickness: 6,
  });

  // 提示文字（带脉冲动画）
  const hintText = createPulsingText(scene, centerX, centerY + 40, texts.hint, {
    fontSize: '22px',
    color: UI_CONFIG.colors.textAccent,
  });

  const allElements: Phaser.GameObjects.GameObject[] = [panel, titleText, hintText];

  return { panel, titleText, hintText, allElements };
}
