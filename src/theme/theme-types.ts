/**
 * 主题系统类型定义
 */

export type ThemeMode = 'dark' | 'light';

export interface ColorScheme {
  primary: number;
  secondary: number;
}

export interface ThemeColors {
  // 背景
  background: {
    top: number;
    bottom: number;
    htmlBg: string;
  };

  // 危险区域
  danger: {
    fill: number;
    fillAlpha: number;
    line: number;
    lineAlpha: number;
  };

  // 平台配色方案（5种）
  platformSchemes: ColorScheme[];

  // UI 颜色
  ui: {
    panelBg: number;
    panelBgAlpha: number;
    buttonBg: number;
    buttonBgAlpha: number;
    buttonBorder: number;
    textPrimary: string;
    textAccent: string;
    textSuccess: string;
    textDanger: string;
    textStroke: string;       // 新增：文本描边颜色
    textStrokeThickness: number; // 新增：文本描边宽度
    neonPrimary: number;
    neonSecondary: number;
  };

  // 视觉特效
  effects: {
    trailColor: number;
    starColors: number[];
    particlePrimary: number;
    particleSecondary: number;
  };
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

export type ThemeChangeCallback = (theme: Theme) => void;
