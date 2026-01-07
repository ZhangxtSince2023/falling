/**
 * 亮色主题配置 - 玻璃拟态风格 (Glassmorphism)
 * 设计理念：毛玻璃面板、柔和阴影、无霓虹发光、现代简约
 */
import type { Theme } from './theme-types';

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: {
      top: 0xE8F4FD,      // 柔和天蓝
      bottom: 0xFDF4E8,   // 柔和暖米
      htmlBg: '#E8F4FD',
    },
    danger: {
      fill: 0xFF6B6B,     // 柔和珊瑚红
      fillAlpha: 0.08,    // 极低透明度
      line: 0xFF6B6B,     // 统一色调
      lineAlpha: 0.25,    // 柔和线条
    },
    platformSchemes: [
      { primary: 0xFF8A65, secondary: 0xFFE0D6 }, // 珊瑚橙
      { primary: 0x81C784, secondary: 0xD5EED7 }, // 薄荷绿
      { primary: 0x64B5F6, secondary: 0xD6EBFC }, // 天空蓝
      { primary: 0xFFD54F, secondary: 0xFFF3D0 }, // 向日葵黄
      { primary: 0xBA68C8, secondary: 0xEDD6F2 }, // 薰衣草紫
    ],
    ui: {
      panelBg: 0xFFFFFF,
      panelBgAlpha: 0.75,       // 更透明，显示玻璃质感
      buttonBg: 0xFFFFFF,
      buttonBgAlpha: 0.9,
      buttonBorder: 0xE8E8E8,   // 极淡边框
      textPrimary: '#1A1A2E',   // 深邃墨蓝（高对比度，易读）
      textAccent: '#FF6B6B',    // 珊瑚强调色
      textSuccess: '#00D9A5',   // 清新薄荷绿
      textDanger: '#FF6B6B',    // 柔和红
      textStroke: 'transparent', // 无描边！这是关键改变
      textStrokeThickness: 0,    // 取消描边
      neonPrimary: 0xE0E0E0,    // 浅灰（用于边框，非霓虹）
      neonSecondary: 0xF5F5F5,
    },
    effects: {
      trailColor: 0x64B5F6,     // 天蓝色轨迹
      starColors: [0xFFD54F, 0x81C784, 0x64B5F6, 0xBA68C8],
      particlePrimary: 0xFF8A65,
      particleSecondary: 0x64B5F6,
    },
  },
};
