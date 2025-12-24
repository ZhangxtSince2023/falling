/**
 * 音频管理系统
 * 支持根据主题切换 BGM
 */
import Phaser from 'phaser';
import { themeManager, type Theme, type ThemeMode } from './theme';

// BGM 配置
const BGM_CONFIG = {
  dark: {
    key: 'bgm-dark',
    path: 'assets/audio/pixel-heartbeat.mp3',
  },
  light: {
    key: 'bgm-light',
    path: 'assets/audio/sugar-sky.mp3',
  },
};

// 音量配置
const VOLUME_CONFIG = {
  bgm: 0.5,          // BGM 音量
  fadeTime: 1000,    // 淡入淡出时间 (ms)
};

class AudioManager {
  private scene: Phaser.Scene | null = null;
  private currentBgm: Phaser.Sound.BaseSound | null = null;
  private currentThemeMode: ThemeMode | null = null;
  private unsubscribeTheme: (() => void) | null = null;
  private isInitialized = false;
  // 用于追踪 preload 监听器，避免重复注册
  private preloadListenersRegistered = false;
  private onFileComplete: ((key: string) => void) | null = null;
  private onLoadError: ((file: Phaser.Loader.File) => void) | null = null;

  // 预加载音频资源
  preload(scene: Phaser.Scene): void {
    console.log('[AudioManager] Preloading audio files...');
    scene.load.audio(BGM_CONFIG.dark.key, BGM_CONFIG.dark.path);
    scene.load.audio(BGM_CONFIG.light.key, BGM_CONFIG.light.path);

    // 避免重复注册监听器（修复 HMR/重复 preload 时的监听器累积）
    if (this.preloadListenersRegistered) {
      return;
    }

    // 创建监听器函数引用（便于后续移除）
    this.onFileComplete = (key: string) => {
      if (key === BGM_CONFIG.dark.key || key === BGM_CONFIG.light.key) {
        console.log(`[AudioManager] Audio loaded: ${key}`);
      }
    };

    this.onLoadError = (file: Phaser.Loader.File) => {
      console.error(`[AudioManager] Failed to load: ${file.key}`, file);
    };

    // 监听加载完成
    scene.load.on('filecomplete', this.onFileComplete);
    scene.load.on('loaderror', this.onLoadError);

    this.preloadListenersRegistered = true;
  }

  // 初始化音频系统
  init(scene: Phaser.Scene): void {
    if (this.isInitialized) return;

    this.scene = scene;
    this.currentThemeMode = themeManager.getMode();

    // 检查音频是否已加载到缓存
    const darkLoaded = scene.cache.audio.exists(BGM_CONFIG.dark.key);
    const lightLoaded = scene.cache.audio.exists(BGM_CONFIG.light.key);
    console.log(`[AudioManager] Init - Audio cache status: dark=${darkLoaded}, light=${lightLoaded}`);

    // 检查 sound manager 状态
    const soundManager = scene.sound;
    console.log(`[AudioManager] Sound manager locked: ${soundManager.locked}`);

    // 监听 Phaser sound manager 解锁事件
    if (soundManager.locked) {
      soundManager.once('unlocked', () => {
        console.log('[AudioManager] Sound manager unlocked!');
        // 如果有待播放的 BGM，现在播放
        if (this.pendingPlay) {
          this.pendingPlay = false;
          void this.doPlayBgm().catch((e) => {
            console.error('[AudioManager] Failed to play BGM after unlock:', e);
          });
        }
      });
    }

    // 订阅主题变化
    this.unsubscribeTheme = themeManager.subscribe((theme) => {
      this.onThemeChange(theme);
    });

    this.isInitialized = true;
  }

  private pendingPlay = false;

  // 播放当前主题的 BGM
  async playBgm(): Promise<void> {
    if (!this.scene) {
      console.warn('[AudioManager] No scene available');
      return;
    }

    console.log('[AudioManager] playBgm called');

    // 如果 sound manager 仍然锁定，标记待播放
    if (this.scene.sound.locked) {
      console.log('[AudioManager] Sound manager still locked, will play after unlock');
      this.pendingPlay = true;
      return;
    }

    await this.doPlayBgm();
  }

  // 实际播放 BGM 的方法
  private async doPlayBgm(): Promise<void> {
    if (!this.scene) return;

    // iOS WebView 需要在用户交互时解锁 AudioContext
    await this.unlockAudioContext();

    const mode = themeManager.getMode();
    const config = BGM_CONFIG[mode];

    console.log(`[AudioManager] Playing BGM for mode: ${mode}, key: ${config.key}`);

    // 如果已经在播放相同的 BGM，不重复播放
    if (this.currentBgm && this.currentThemeMode === mode) {
      console.log('[AudioManager] Already playing same BGM');
      return;
    }

    // 停止当前 BGM
    this.stopCurrentBgm();

    // 检查音频是否已加载
    if (!this.scene.cache.audio.exists(config.key)) {
      console.error(`[AudioManager] Audio not in cache: ${config.key}`);
      return;
    }

    // 播放新 BGM
    try {
      this.currentBgm = this.scene.sound.add(config.key, {
        loop: true,
        volume: VOLUME_CONFIG.bgm,
      });

      this.currentBgm.play();
      this.currentThemeMode = mode;

      console.log(`[AudioManager] BGM started: ${config.key}, isPlaying: ${this.currentBgm.isPlaying}`);
    } catch (e) {
      console.error('[AudioManager] Failed to play BGM:', e);
      this.currentBgm = null;
      this.currentThemeMode = null;
    }
  }

  // 解锁 iOS AudioContext (必须在用户交互事件中调用)
  private async unlockAudioContext(): Promise<void> {
    if (!this.scene) return;

    const soundManager = this.scene.sound;

    // 检查是否是 WebAudioSoundManager
    if ('context' in soundManager) {
      const webAudioManager = soundManager as Phaser.Sound.WebAudioSoundManager;
      const context = webAudioManager.context;

      if (context && context.state === 'suspended') {
        try {
          await context.resume();
          console.log('AudioContext resumed successfully');
        } catch (e) {
          console.warn('Failed to resume AudioContext:', e);
        }
      }
    }
  }

  // 主题切换处理
  private onThemeChange(theme: Theme): void {
    if (!this.scene || !this.currentBgm) return;

    const newMode = theme.mode;
    if (newMode === this.currentThemeMode) return;

    // 淡出当前 BGM，然后播放新 BGM
    this.crossfadeTo(newMode);
  }

  // 交叉淡入淡出切换 BGM
  private crossfadeTo(newMode: ThemeMode): void {
    if (!this.scene) return;

    const oldBgm = this.currentBgm;
    const config = BGM_CONFIG[newMode];

    // 检查音频是否已在缓存中
    if (!this.scene.cache.audio.exists(config.key)) {
      console.warn(`[AudioManager] crossfadeTo: Audio not in cache: ${config.key}, skipping switch`);
      return;
    }

    // 创建新 BGM（带错误处理）
    let newBgm: Phaser.Sound.BaseSound;
    try {
      newBgm = this.scene.sound.add(config.key, {
        loop: true,
        volume: 0,
      });
      newBgm.play();
    } catch (e) {
      console.error(`[AudioManager] crossfadeTo: Failed to create/play new BGM: ${config.key}`, e);
      // 播放失败时保持旧 BGM 继续播放，不做任何切换
      return;
    }

    // 淡入新 BGM
    this.fadeIn(newBgm);

    // 淡出旧 BGM（只有新 BGM 成功播放后才淡出旧的）
    if (oldBgm) {
      this.fadeOut(oldBgm, () => {
        oldBgm.destroy();
      });
    }

    this.currentBgm = newBgm;
    this.currentThemeMode = newMode;
  }

  // 淡入效果
  private fadeIn(sound: Phaser.Sound.BaseSound): void {
    if (!this.scene) return;

    this.scene.tweens.add({
      targets: sound,
      volume: VOLUME_CONFIG.bgm,
      duration: VOLUME_CONFIG.fadeTime,
      ease: 'Linear',
    });
  }

  // 淡出效果
  private fadeOut(sound: Phaser.Sound.BaseSound, onComplete?: () => void): void {
    if (!this.scene) return;

    this.scene.tweens.add({
      targets: sound,
      volume: 0,
      duration: VOLUME_CONFIG.fadeTime,
      ease: 'Linear',
      onComplete: onComplete,
    });
  }

  // 停止当前 BGM (内部方法)
  private stopCurrentBgm(): void {
    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm.destroy();
      this.currentBgm = null;
    }
  }

  // 停止 BGM (公开方法，游戏结束时调用)
  stopBgm(): void {
    this.stopCurrentBgm();
    this.currentThemeMode = null;
  }

  // 暂停 BGM
  pause(): void {
    if (this.currentBgm && 'pause' in this.currentBgm) {
      (this.currentBgm as Phaser.Sound.WebAudioSound).pause();
    }
  }

  // 恢复 BGM
  resume(): void {
    if (this.currentBgm && 'resume' in this.currentBgm) {
      (this.currentBgm as Phaser.Sound.WebAudioSound).resume();
    }
  }

  // 设置 BGM 音量
  setVolume(volume: number): void {
    VOLUME_CONFIG.bgm = Math.max(0, Math.min(1, volume));
    if (this.currentBgm && 'setVolume' in this.currentBgm) {
      (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(VOLUME_CONFIG.bgm);
    }
  }

  // 静音切换
  toggleMute(): boolean {
    if (!this.scene) return false;
    this.scene.sound.mute = !this.scene.sound.mute;
    return this.scene.sound.mute;
  }

  // 获取静音状态
  isMuted(): boolean {
    return this.scene?.sound.mute ?? false;
  }

  // 清理资源
  destroy(): void {
    this.stopCurrentBgm();
    if (this.unsubscribeTheme) {
      this.unsubscribeTheme();
      this.unsubscribeTheme = null;
    }
    // 移除 preload 监听器（如果还有场景引用）
    if (this.scene && this.scene.load) {
      if (this.onFileComplete) {
        this.scene.load.off('filecomplete', this.onFileComplete);
      }
      if (this.onLoadError) {
        this.scene.load.off('loaderror', this.onLoadError);
      }
    }
    this.onFileComplete = null;
    this.onLoadError = null;
    this.preloadListenersRegistered = false;
    this.scene = null;
    this.isInitialized = false;
  }
}

export const audioManager = new AudioManager();
