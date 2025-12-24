/**
 * 主题管理器 - 单例模式
 * 检测系统主题并实时响应变化
 */
import { darkTheme } from './theme-dark';
import { lightTheme } from './theme-light';
import type { Theme, ThemeMode, ThemeChangeCallback } from './theme-types';

class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme;
  private listeners: Set<ThemeChangeCallback>;
  private mediaQuery: MediaQueryList | null = null;

  private constructor() {
    this.listeners = new Set();
    this.currentTheme = this.detectSystemTheme();
    this.setupSystemThemeListener();
    this.updateHtmlBackground();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // 检测系统主题偏好
  private detectSystemTheme(): Theme {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isDark ? darkTheme : lightTheme;
    }
    return darkTheme; // 默认暗色
  }

  // 设置系统主题变化监听
  private setupSystemThemeListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? darkTheme : lightTheme;
      this.setTheme(newTheme);
    };

    // 现代 API
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版
      this.mediaQuery.addListener(handleChange);
    }
  }

  // 获取当前主题
  getTheme(): Theme {
    return this.currentTheme;
  }

  // 获取当前模式
  getMode(): ThemeMode {
    return this.currentTheme.mode;
  }

  // 是否为暗色模式
  isDark(): boolean {
    return this.currentTheme.mode === 'dark';
  }

  // 设置主题（内部方法，由系统变化触发）
  private setTheme(theme: Theme): void {
    if (this.currentTheme.mode === theme.mode) return;

    this.currentTheme = theme;
    this.updateHtmlBackground();
    this.notifyListeners();
  }

  // 更新 HTML/body 背景色
  private updateHtmlBackground(): void {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = this.currentTheme.colors.background.htmlBg;
    }
  }

  // 订阅主题变化
  subscribe(callback: ThemeChangeCallback): () => void {
    this.listeners.add(callback);
    // 返回取消订阅函数
    return () => this.listeners.delete(callback);
  }

  // 通知所有监听者
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentTheme);
      } catch (error) {
        console.error('Theme change callback error:', error);
      }
    });
  }

  // 强制刷新当前主题（用于重新初始化）
  refresh(): void {
    this.notifyListeners();
  }
}

export const themeManager = ThemeManager.getInstance();
