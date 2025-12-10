/**
 * 视觉特效系统
 */
import Phaser from 'phaser';
import type { ColorScheme } from './types.ts';

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

// 创建碰撞粒子效果（增强版）
export function createImpactParticles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colorScheme?: ColorScheme
): void {
  const scheme = colorScheme ?? { primary: 0xff6b9d, secondary: 0xffa06b };

  // 主要向上和两侧飞溅的粒子
  const particleCount = 12;

  for (let i = 0; i < particleCount; i++) {
    // 粒子主要向上飞溅（-30度到-150度范围）
    const angle = -Math.PI / 6 - ((Math.PI * 2) / 3) * (i / particleCount);
    const speed = Phaser.Math.Between(150, 350);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const color = i % 2 === 0 ? scheme.primary : scheme.secondary;
    const particleSize = Phaser.Math.Between(4, 8);
    const particle = scene.add.circle(x, y, particleSize, color);
    particle.setAlpha(1);
    particle.setDepth(100);

    scene.tweens.add({
      targets: particle,
      x: x + vx * 0.4,
      y: y + vy * 0.4,
      alpha: 0,
      scale: 0.1,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        particle.destroy();
      },
    });
  }

  // 添加小型火花粒子
  const sparkCount = 8;
  for (let i = 0; i < sparkCount; i++) {
    const angle = -Math.PI / 4 - (Math.PI / 2) * Math.random();
    const speed = Phaser.Math.Between(80, 200);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const spark = scene.add.circle(
      x + Phaser.Math.Between(-10, 10),
      y,
      2,
      0xffffff
    );
    spark.setAlpha(0.9);
    spark.setDepth(101);

    scene.tweens.add({
      targets: spark,
      x: x + vx * 0.3,
      y: y + vy * 0.3,
      alpha: 0,
      duration: 300,
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

// 创建撞击冲击波效果
export function createImpactRing(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colorScheme?: ColorScheme
): void {
  const scheme = colorScheme ?? { primary: 0xff6b9d, secondary: 0xffa06b };

  // 创建多层冲击波
  for (let i = 0; i < 2; i++) {
    const ring = scene.add.circle(x, y, 15, scheme.primary, 0);
    ring.setStrokeStyle(4 - i, scheme.secondary, 0.8);
    ring.setDepth(99);

    scene.tweens.add({
      targets: ring,
      radius: 60 + i * 20,
      alpha: 0,
      lineWidth: 0,
      duration: 300 + i * 100,
      delay: i * 50,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        ring.setStrokeStyle(ring.lineWidth, scheme.secondary, ring.alpha);
      },
      onComplete: () => {
        ring.destroy();
      },
    });
  }
}

// 创建小球发光闪烁效果
export function createBallGlow(
  scene: Phaser.Scene,
  ball: Phaser.GameObjects.Sprite,
  colorScheme?: ColorScheme
): void {
  if (!ball || !colorScheme) return;

  const glow = scene.add.circle(
    ball.x,
    ball.y,
    ball.displayWidth * 0.8,
    colorScheme.primary,
    0.6
  );
  glow.setDepth(ball.depth - 1);
  glow.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: glow,
    scale: 1.8,
    alpha: 0,
    duration: 250,
    ease: 'Quad.easeOut',
    onUpdate: () => {
      glow.setPosition(ball.x, ball.y);
    },
    onComplete: () => {
      glow.destroy();
    },
  });
}

// 创建云朵装饰
export function createClouds(
  scene: Phaser.Scene,
  gameWidth: number,
  gameHeight: number
): Phaser.GameObjects.Ellipse[] {
  const clouds: Phaser.GameObjects.Ellipse[] = [];
  for (let i = 0; i < 4; i++) {
    const cloud = scene.add.ellipse(
      Phaser.Math.Between(0, gameWidth),
      Phaser.Math.Between(50, gameHeight / 2),
      Phaser.Math.Between(40, 80),
      Phaser.Math.Between(20, 35),
      0xffffff,
      0.2
    );
    cloud.setDepth(-5);
    clouds.push(cloud);
  }
  return clouds;
}

// 更新云朵位置
export function updateClouds(
  clouds: Phaser.GameObjects.Ellipse[],
  deltaSeconds: number,
  riseSpeed: number,
  gameWidth: number,
  gameHeight: number
): void {
  clouds.forEach((cloud) => {
    cloud.y -= riseSpeed * 0.5 * deltaSeconds;

    if (cloud.y < -100) {
      cloud.y = gameHeight + 100;
      cloud.x = Phaser.Math.Between(0, gameWidth);
    }
  });
}
