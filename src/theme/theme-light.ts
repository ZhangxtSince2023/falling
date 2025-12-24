/**
 * 亮色主题配置 - 极简柔和风格（清爽蓝白）
 */
import type { Theme } from './theme-types';

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: {
      top: 0xE1F5FE,      // 极淡的蓝
      bottom: 0xFFF3E0,   // 极淡的暖橙
      htmlBg: '#E1F5FE',
    },
    danger: {
      fill: 0xFF5252,     // 红色
      fillAlpha: 0.05,    // 极低透明度，只保留淡淡的红晕
      line: 0xFF1744,     // 红色线条
      lineAlpha: 0.2,     // 低透明度线条
    },
    platformSchemes: [
      { primary: 0xFF7043, secondary: 0xFFCCBC }, // 柔和橙
      { primary: 0x66BB6A, secondary: 0xC8E6C9 }, // 柔和绿
      { primary: 0x42A5F5, secondary: 0xBBDEFB }, // 柔和蓝
      { primary: 0xFFCA28, secondary: 0xFFECB3 }, // 柔和黄
      { primary: 0xAB47BC, secondary: 0xE1BEE7 }, // 柔和紫
    ],
    ui: {
      panelBg: 0xFFFFFF,
      panelBgAlpha: 0.95,
      buttonBg: 0xFFFFFF,
      buttonBgAlpha: 0.98,
      buttonBorder: 0xE0E0E0,
      textPrimary: '#455A64',   // 蓝灰色字体
      textAccent: '#FF4081',    // 强调色
      textSuccess: '#00E676',
      textDanger: '#FF5252',
      textStroke: '#FFFFFF',    // 白色描边，产生镂空或柔和感
      textStrokeThickness: 4,
      neonPrimary: 0x81D4FA,    // 亮色模式下不需要太强的霓虹
      neonSecondary: 0xFF80AB,
    },
    effects: {
      trailColor: 0x29B6F6,
      starColors: [0xFFE082, 0xA5D6A7, 0x90CAF9, 0xF48FB1],
      particlePrimary: 0xFF7043,
      particleSecondary: 0x29B6F6,
    },
  },
};
