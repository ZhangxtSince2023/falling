/**
 * 微信小游戏平台适配器
 * 提供与 Web 平台兼容的 API
 */

/**
 * 创建微信平台的 i18n 适配器
 * @returns {Object} 平台适配器对象
 */
export function createWechatI18nPlatform() {
    return {
        getStoredLanguage: () => {
            try {
                return wx.getStorageSync('gameLanguage');
            } catch (e) {
                console.warn('Failed to get stored language:', e);
                return null;
            }
        },
        setStoredLanguage: (lang) => {
            try {
                wx.setStorageSync('gameLanguage', lang);
            } catch (e) {
                console.warn('Failed to store language:', e);
            }
        },
        detectSystemLanguage: () => {
            try {
                const systemInfo = wx.getSystemInfoSync();
                return systemInfo.language || 'zh';
            } catch (e) {
                console.warn('Failed to detect system language:', e);
                return 'zh';
            }
        }
    };
}

/**
 * 初始化微信小游戏环境
 */
export function initWechatEnv() {
    // 显示加载提示
    wx.showLoading({
        title: '加载中...',
        mask: true
    });

    // 设置保持屏幕常亮
    wx.setKeepScreenOn({
        keepScreenOn: true
    });

    console.log('WeChat mini-game environment initialized');
}

/**
 * 隐藏加载提示
 */
export function hideLoading() {
    wx.hideLoading();
}
