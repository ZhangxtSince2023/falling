/**
 * 振动反馈封装
 * 优先调用 Capacitor Haptics，回退到浏览器 vibrate
 */
import type { VibrationType } from './types.ts';

export async function vibrate(type: VibrationType): Promise<void> {
  try {
    if (window.Capacitor?.isNativePlatform()) {
      const Haptics = window.Capacitor.Plugins.Haptics;

      if (type === 'light') {
        await Haptics.impact({ style: 'LIGHT' });
      } else if (type === 'medium') {
        await Haptics.impact({ style: 'MEDIUM' });
      } else if (type === 'heavy') {
        await Haptics.impact({ style: 'HEAVY' });
      } else if (type === 'error') {
        await Haptics.notification({ type: 'ERROR' });
      }
    } else if (navigator.vibrate) {
      // 浏览器振动回退（iOS Safari 不支持）
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(30);
      else if (type === 'heavy') navigator.vibrate(50);
      else if (type === 'error') navigator.vibrate([50, 50, 50]);
    }
  } catch (e) {
    console.warn('Vibration failed', e);
  }
}
