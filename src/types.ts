/**
 * 游戏类型定义
 */
import type Phaser from 'phaser';

// 颜色方案
export interface ColorScheme {
  primary: number;
  secondary: number;
}

// 难度配置
export interface DifficultyConfig {
  MAX_DIFFICULTY_SCORE: number;
  SPEED: { MIN: number; MAX: number };
  PLATFORM_GAP: { MIN: number; MAX: number };
  PLATFORM_WIDTH: { MIN: number; MAX: number };
  REST_PLATFORM_INTERVAL: number;
  REST_PLATFORM_WIDTH_MULTIPLIER: number;
  REST_PLATFORM_GAP_MULTIPLIER: number;
  BASE_PLATFORM_WIDTH_MAX: number;
}

// 当前难度参数
export interface Difficulty {
  riseSpeed: number;
  spawnInterval: number;
  platformWidthMin: number;
  platformWidthMax: number;
  isRestPlatform: boolean;
}

// 平台生成策略配置
export interface SpawnStrategyConfig {
  JUMP_DISTANCE_MAX: number;
  JUMP_DISTANCE_MIN: number;
  NARROW_WIDTH_THRESHOLD: number;
  SIDE_SWITCH_CHANCE: number;
  MAX_SAME_SIDE_COUNT: number;
}

// 平台生成结果
export interface PlatformSpawnResult {
  x: number;
  width: number;
}

// 语言信息
export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
}

// 翻译键
export type TranslationKey =
  | 'gameTitle'
  | 'distance'
  | 'score'
  | 'difficulty'
  | 'level'
  | 'meters'
  | 'tapToStart'
  | 'dragToControl'
  | 'gameOver'
  | 'finalScore'
  | 'tapToRestart'
  | 'languageButton';

// 单语言翻译
export type Translation = Record<TranslationKey, string>;

// 所有翻译
export type Translations = Record<string, Translation>;

// 震动类型
export type VibrationType = 'light' | 'medium' | 'heavy' | 'error';

// 扩展 Phaser Sprite 以包含自定义属性
export interface GamePlatform extends Phaser.Physics.Arcade.Sprite {
  counted: boolean;
  colorScheme: ColorScheme;
}

// Capacitor 类型声明
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      Plugins: {
        Haptics: {
          impact: (options: { style: string }) => Promise<void>;
          notification: (options: { type: string }) => Promise<void>;
        };
      };
    };
  }
}
