/**
 * 暗色主题配置 - 霓虹风格
 */
import type { Theme } from './theme-types';

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: {
      top: 0x0a0a2e,      // 深蓝紫色
      bottom: 0x1a0a1a,   // 深紫红色
      htmlBg: '#000000',
    },
    danger: {
      fill: 0xff0088,
      fillAlpha: 0.25,
      line: 0xff0088,
      lineAlpha: 0.8,
    },
    platformSchemes: [
      { primary: 0x00ffff, secondary: 0x0088ff }, // 青色霓虹
      { primary: 0xff00ff, secondary: 0x8800ff }, // 品红霓虹
      { primary: 0x00ff88, secondary: 0x00ffcc }, // 绿色霓虹
      { primary: 0xffff00, secondary: 0xff8800 }, // 黄色霓虹
      { primary: 0xff0088, secondary: 0xff00ff }, // 粉红霓虹
    ],
    ui: {
      panelBg: 0x0a0a2e,
      panelBgAlpha: 0.85,
      buttonBg: 0x000000,
      buttonBgAlpha: 0.5,
      buttonBorder: 0x00ffff,
      textPrimary: '#00ffff',
      textAccent: '#ff00ff',
      textSuccess: '#00ff88',
      textDanger: '#ff0088',
      textStroke: '#000000',
      textStrokeThickness: 4,
      neonPrimary: 0x00ffff,
      neonSecondary: 0xff00ff,
    },
    effects: {
      trailColor: 0xff88aa,
      starColors: [0x00ffff, 0xff00ff, 0x00ff88, 0xffff00],
      particlePrimary: 0x00ffff,
      particleSecondary: 0x0088ff,
    },
  },
};
