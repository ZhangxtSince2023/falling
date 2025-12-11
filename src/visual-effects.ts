/**
 * 视觉特效系统 - 霓虹风格
 */
import Phaser from 'phaser';
import type { ColorScheme } from './types.ts';

// 霓虹主色调
const NEON_CYAN = 0x00ffff;

// 拖尾效果相关
interface TrailParticle {
  sprite: Phaser.GameObjects.Rectangle;
  life: number;
}

let trailParticles: TrailParticle[] = [];
let lastTrailX = 0;
let lastTrailY = 0;
const TRAIL_INTERVAL = 8; // 每隔多少像素生成一个拖尾

/**
 * 创建玩家拖尾效果
 */
export function createPlayerTrail(
  scene: Phaser.Scene,
  player: Phaser.Physics.Arcade.Sprite
): void {
  if (!player || !scene) return;

  const dx = Math.abs(player.x - lastTrailX);
  const dy = Math.abs(player.y - lastTrailY);
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < TRAIL_INTERVAL) return;

  lastTrailX = player.x;
  lastTrailY = player.y;

  // 创建拖尾粒子
  const size = player.displayWidth * 0.7;
  const trail = scene.add.rectangle(
    player.x,
    player.y,
    size,
    size,
    NEON_CYAN,
    0.5
  );
  trail.setDepth(player.depth - 1);
  trail.setStrokeStyle(2, NEON_CYAN, 0.8);

  trailParticles.push({ sprite: trail, life: 1 });
}

/**
 * 更新拖尾效果
 */
export function updateTrailEffect(delta: number): void {
  const fadeSpeed = delta / 200; // 200ms 完全消失

  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const particle = trailParticles[i];
    particle.life -= fadeSpeed;

    if (particle.life <= 0) {
      particle.sprite.destroy();
      trailParticles.splice(i, 1);
    } else {
      particle.sprite.setAlpha(particle.life * 0.4);
      particle.sprite.setScale(particle.life * 0.8 + 0.2);
    }
  }
}

/**
 * 重置拖尾效果
 */
export function resetTrailEffect(): void {
  trailParticles.forEach((p) => p.sprite.destroy());
  trailParticles = [];
  lastTrailX = 0;
  lastTrailY = 0;
}

// 创建程序化的球体纹理（带渐变效果）
export function createBallTexture(
  scene: Phaser.Scene,
  key: string,
  color1: number,
  color2: number
): void {
  const graphics = scene.make.graphics({ x: 0, y: 0 });
  const radius = 32;

  // 创建渐变填充
  for (let i = 0; i < radius; i++) {
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(color1),
      Phaser.Display.Color.ValueToColor(color2),
      radius,
      i
    );
    const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    const alpha = i / radius;

    graphics.fillStyle(hexColor, 1 - alpha * 0.3);
    graphics.fillCircle(radius, radius, radius - i);
  }

  graphics.generateTexture(key, radius * 2, radius * 2);
  graphics.destroy();
}

// 平台碰撞闪烁效果
export function flashPlatform(
  scene: Phaser.Scene,
  platform: Phaser.GameObjects.Sprite
): void {
  if (!platform || !scene) return;

  scene.tweens.add({
    targets: platform,
    alpha: 0.6,
    duration: 50,
    yoyo: true,
    ease: 'Quad.easeInOut',
  });
}

// 创建碰撞粒子效果 - 霓虹风格
export function createImpactParticles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colorScheme?: ColorScheme
): void {
  const scheme = colorScheme ?? { primary: NEON_CYAN, secondary: 0x0088ff };

  // 霓虹方块粒子
  const particleCount = 8;

  for (let i = 0; i < particleCount; i++) {
    const angle = -Math.PI / 6 - ((Math.PI * 2) / 3) * (i / particleCount);
    const speed = Phaser.Math.Between(100, 250);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const color = i % 2 === 0 ? scheme.primary : scheme.secondary;
    const particleSize = Phaser.Math.Between(4, 8);

    // 使用方形粒子
    const particle = scene.add.rectangle(x, y, particleSize, particleSize, color, 0.8);
    particle.setStrokeStyle(1, 0xffffff, 0.5);
    particle.setDepth(100);

    scene.tweens.add({
      targets: particle,
      x: x + vx * 0.35,
      y: y + vy * 0.35,
      alpha: 0,
      scale: 0.1,
      rotation: Math.PI,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        particle.destroy();
      },
    });
  }

  // 霓虹火花线条
  const sparkCount = 6;
  for (let i = 0; i < sparkCount; i++) {
    const angle = -Math.PI / 4 - (Math.PI / 2) * Math.random();
    const speed = Phaser.Math.Between(60, 150);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const spark = scene.add.rectangle(
      x + Phaser.Math.Between(-8, 8),
      y,
      2,
      6,
      0xffffff,
      0.9
    );
    spark.setDepth(101);

    scene.tweens.add({
      targets: spark,
      x: x + vx * 0.25,
      y: y + vy * 0.25,
      alpha: 0,
      scaleY: 0.2,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => {
        spark.destroy();
      },
    });
  }
}

// 屏幕震动效果
export function shakeCamera(scene: Phaser.Scene): void {
  if (scene?.cameras?.main) {
    scene.cameras.main.shake(100, 0.005);
  }
}

// 球体挤压动画（增强版）
export function squashBallAnimation(
  scene: Phaser.Scene,
  ball: Phaser.GameObjects.Sprite,
  impactVelocity: number = 100
): void {
  if (!ball) return;

  scene.tweens.killTweensOf(ball);

  // 根据撞击速度计算挤压程度
  const velocityFactor = Math.min(impactVelocity / 200, 1);
  const squashX = 0.5 + 0.25 * velocityFactor; // 0.5 ~ 0.75
  const squashY = 0.5 - 0.2 * velocityFactor; // 0.5 ~ 0.3

  // 挤压阶段
  scene.tweens.add({
    targets: ball,
    scaleX: squashX,
    scaleY: squashY,
    duration: 60,
    ease: 'Quad.easeOut',
    onComplete: () => {
      // 反弹拉伸阶段
      scene.tweens.add({
        targets: ball,
        scaleX: 0.45,
        scaleY: 0.58,
        duration: 80,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // 恢复原状（带弹性）
          scene.tweens.add({
            targets: ball,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 150,
            ease: 'Elastic.easeOut',
          });
        },
      });
    },
  });
}

// 创建撞击冲击波效果 - 霓虹方形波
export function createImpactRing(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colorScheme?: ColorScheme
): void {
  const scheme = colorScheme ?? { primary: NEON_CYAN, secondary: 0x0088ff };

  // 创建多层方形冲击波
  for (let i = 0; i < 2; i++) {
    const size = 20;
    const ring = scene.add.rectangle(x, y, size, size, scheme.primary, 0);
    ring.setStrokeStyle(3 - i, scheme.primary, 0.9);
    ring.setDepth(99);

    scene.tweens.add({
      targets: ring,
      scaleX: 4 + i,
      scaleY: 4 + i,
      alpha: 0,
      duration: 250 + i * 80,
      delay: i * 40,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        const alpha = ring.alpha;
        ring.setStrokeStyle((3 - i) * alpha, scheme.primary, alpha);
      },
      onComplete: () => {
        ring.destroy();
      },
    });
  }
}

// 创建方块发光闪烁效果 - 霓虹风格
export function createBallGlow(
  scene: Phaser.Scene,
  ball: Phaser.GameObjects.Sprite,
  colorScheme?: ColorScheme
): void {
  if (!ball) return;

  const color = colorScheme?.primary ?? NEON_CYAN;
  const size = ball.displayWidth * 0.9;

  // 方形发光
  const glow = scene.add.rectangle(ball.x, ball.y, size, size, color, 0.5);
  glow.setDepth(ball.depth - 1);
  glow.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: glow,
    scaleX: 2,
    scaleY: 2,
    alpha: 0,
    duration: 200,
    ease: 'Quad.easeOut',
    onUpdate: () => {
      glow.setPosition(ball.x, ball.y);
    },
    onComplete: () => {
      glow.destroy();
    },
  });
}

// 星星类型定义
interface NeonStar {
  shape: Phaser.GameObjects.Rectangle;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

let stars: NeonStar[] = [];

// 创建霓虹星星装饰
export function createClouds(
  scene: Phaser.Scene,
  gameWidth: number,
  gameHeight: number
): Phaser.GameObjects.Ellipse[] {
  // 清理旧的星星
  stars.forEach((s) => s.shape.destroy());
  stars = [];

  // 创建霓虹星星
  const starColors = [NEON_CYAN, 0xff00ff, 0x00ff88, 0xffff00];

  for (let i = 0; i < 20; i++) {
    const size = Phaser.Math.Between(2, 5);
    const color = starColors[i % starColors.length];
    const alpha = Phaser.Math.FloatBetween(0.2, 0.6);

    const star = scene.add.rectangle(
      Phaser.Math.Between(0, gameWidth),
      Phaser.Math.Between(0, gameHeight),
      size,
      size,
      color,
      alpha
    );
    star.setDepth(-5);

    stars.push({
      shape: star,
      baseAlpha: alpha,
      pulseSpeed: Phaser.Math.FloatBetween(1, 3),
      pulsePhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
    });
  }

  // 返回空数组保持类型兼容
  return [];
}

// 更新星星位置和闪烁
export function updateClouds(
  _clouds: Phaser.GameObjects.Ellipse[],
  deltaSeconds: number,
  riseSpeed: number,
  gameWidth: number,
  gameHeight: number
): void {
  const time = Date.now() / 1000;

  stars.forEach((star) => {
    // 星星随平台上升
    star.shape.y -= riseSpeed * 0.3 * deltaSeconds;

    // 闪烁效果
    const pulse = Math.sin(time * star.pulseSpeed + star.pulsePhase);
    star.shape.setAlpha(star.baseAlpha * (0.5 + pulse * 0.5));

    // 循环
    if (star.shape.y < -20) {
      star.shape.y = gameHeight + 20;
      star.shape.x = Phaser.Math.Between(0, gameWidth);
    }
  });
}
