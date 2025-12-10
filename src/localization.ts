/**
 * 多语言支持系统
 * 支持：中文、英语、日语
 */
import type {
  Translations,
  TranslationKey,
  LanguageInfo,
} from './types.ts';

// 所有翻译文本
const translations: Translations = {
  // 中文（简体）
  zh: {
    gameTitle: '坠落小球',
    distance: '距离',
    score: '分数',
    difficulty: '难度',
    level: '级',
    meters: 'm',
    tapToStart: '点击屏幕开始',
    dragToControl: '左右拖动控制小球',
    gameOver: '游戏结束!',
    finalScore: '最终分数',
    tapToRestart: '点击重新开始',
    languageButton: '语言',
  },

  // 中文（繁体）
  'zh-TW': {
    gameTitle: '墜落小球',
    distance: '距離',
    score: '分數',
    difficulty: '難度',
    level: '級',
    meters: 'm',
    tapToStart: '點擊屏幕開始',
    dragToControl: '左右拖動控制小球',
    gameOver: '遊戲結束!',
    finalScore: '最終分數',
    tapToRestart: '點擊重新開始',
    languageButton: '語言',
  },

  // 英语
  en: {
    gameTitle: 'Falling Ball',
    distance: 'Distance',
    score: 'Score',
    difficulty: 'Difficulty',
    level: 'Lv',
    meters: 'm',
    tapToStart: 'Tap to Start',
    dragToControl: 'Drag to Move',
    gameOver: 'Game Over!',
    finalScore: 'Final Score',
    tapToRestart: 'Tap to Restart',
    languageButton: 'Language',
  },

  // 日语
  ja: {
    gameTitle: '落下ボール',
    distance: '距離',
    score: 'スコア',
    difficulty: '難易度',
    level: 'Lv',
    meters: 'm',
    tapToStart: 'タップして開始',
    dragToControl: '左右にドラッグして操作',
    gameOver: 'ゲームオーバー!',
    finalScore: '最終スコア',
    tapToRestart: 'タップして再開',
    languageButton: '言語',
  },
};

/**
 * i18n 国际化类
 */
class I18n {
  private currentLanguage: string;
  private translations: Translations;

  constructor() {
    this.translations = translations;
    this.currentLanguage = this.detectLanguage();

    // 如果检测到的语言不支持，默认使用英语
    if (!this.translations[this.currentLanguage]) {
      // 尝试使用语言代码的基础部分（如 zh-CN -> zh）
      const baseLang = this.currentLanguage.split('-')[0];
      if (this.translations[baseLang]) {
        this.currentLanguage = baseLang;
      } else {
        this.currentLanguage = 'en';
      }
    }
  }

  /**
   * 检测系统语言
   */
  private detectLanguage(): string {
    // 首先检查 localStorage 中是否有保存的语言设置
    const savedLanguage = localStorage.getItem('gameLanguage');
    if (savedLanguage && translations[savedLanguage]) {
      return savedLanguage;
    }

    // 检测浏览器语言
    const browserLang = navigator.language;

    // 处理不同的语言代码格式
    if (browserLang.startsWith('zh')) {
      // 中文：区分简体和繁体
      if (
        browserLang.includes('TW') ||
        browserLang.includes('HK') ||
        browserLang.includes('MO')
      ) {
        return 'zh-TW'; // 繁体中文
      }
      return 'zh'; // 简体中文
    } else if (browserLang.startsWith('ja')) {
      return 'ja'; // 日语
    } else if (browserLang.startsWith('en')) {
      return 'en'; // 英语
    }

    // 默认英语
    return 'en';
  }

  /**
   * 获取翻译文本
   */
  t(key: TranslationKey): string {
    const translation = this.translations[this.currentLanguage]?.[key];
    if (translation) {
      return translation;
    }

    // 如果找不到翻译，尝试使用英语
    if (this.currentLanguage !== 'en' && this.translations['en']?.[key]) {
      console.warn(
        `Translation missing for key "${key}" in language "${this.currentLanguage}", using English fallback`
      );
      return this.translations['en'][key];
    }

    // 如果还是找不到，返回 key 本身
    console.error(`Translation missing for key "${key}"`);
    return key;
  }

  /**
   * 设置语言
   */
  setLanguage(lang: string): boolean {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      // 保存到 localStorage
      localStorage.setItem('gameLanguage', lang);
      return true;
    }
    console.error('Language not supported:', lang);
    return false;
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * 获取所有支持的语言列表
   */
  getSupportedLanguages(): LanguageInfo[] {
    return [
      { code: 'zh', name: '简体中文', native: '简体中文' },
      { code: 'zh-TW', name: '繁體中文', native: '繁體中文' },
      { code: 'en', name: 'English', native: 'English' },
      { code: 'ja', name: '日本語', native: '日本語' },
    ];
  }

  /**
   * 获取当前语言的名称
   */
  getCurrentLanguageName(): string {
    const languages = this.getSupportedLanguages();
    const current = languages.find(
      (lang) => lang.code === this.currentLanguage
    );
    return current ? current.native : this.currentLanguage;
  }
}

// 创建全局 i18n 实例
export const i18n = new I18n();
export { I18n };
