/**
 * 视觉特效系统
 */

// 创建程序化的球体纹理（带渐变效果）
function createBallTexture(scene, key, color1, color2) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    const radius = 32;

    // 创建渐变填充
    for (let i = 0; i < radius; i++) {
        const alpha = i / radius;
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(color1),
            Phaser.Display.Color.ValueToColor(color2),
            radius,
            i
        );
        const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

        graphics.fillStyle(hexColor, 1 - alpha * 0.3);
        graphics.fillCircle(radius, radius, radius - i);
    }

    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
}

// 平台碰撞闪烁效果
function flashPlatform(scene, platform) {
    if (!platform || !scene) return;

    scene.tweens.add({
        targets: platform,
        alpha: 0.6,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeInOut'
    });
}

// 创建碰撞粒子效果
function createImpactParticles(scene, x, y, colorScheme) {
    if (!colorScheme) {
        console.error('colorScheme 未定义！使用默认颜色');
        colorScheme = { primary: 0xFF6B9D, secondary: 0xFFA06B };
    }

    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = Phaser.Math.Between(200, 400);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const color = i % 2 === 0 ? colorScheme.primary : colorScheme.secondary;
        const particleSize = Phaser.Math.Between(5, 10);
        const particle = scene.add.circle(x, y, particleSize, color);
        particle.setAlpha(1);
        particle.setDepth(100);

        scene.tweens.add({
            targets: particle,
            x: x + vx * 0.5,
            y: y + vy * 0.5,
            alpha: 0,
            scale: 0.2,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                particle.destroy();
            }
        });
    }
}

// 屏幕震动效果
function shakeCamera(scene) {
    if (scene && scene.cameras && scene.cameras.main) {
        scene.cameras.main.shake(100, 0.005);
    }
}

// 球体挤压动画
function squashBallAnimation(scene, ball) {
    if (!ball) return;

    scene.tweens.killTweensOf(ball);

    scene.tweens.add({
        targets: ball,
        scaleX: 0.65,
        scaleY: 0.35,
        duration: 80,
        ease: 'Quad.easeOut',
        onComplete: () => {
            scene.tweens.add({
                targets: ball,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 120,
                ease: 'Elastic.easeOut'
            });
        }
    });
}

// 创建云朵装饰
function createClouds(scene, GAME_WIDTH, GAME_HEIGHT) {
    const clouds = [];
    for (let i = 0; i < 4; i++) {
        const cloud = scene.add.ellipse(
            Phaser.Math.Between(0, GAME_WIDTH),
            Phaser.Math.Between(50, GAME_HEIGHT / 2),
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
function updateClouds(clouds, deltaSeconds, riseSpeed, GAME_WIDTH, GAME_HEIGHT) {
    clouds.forEach(cloud => {
        cloud.y -= riseSpeed * 0.5 * deltaSeconds;

        if (cloud.y < -100) {
            cloud.y = GAME_HEIGHT + 100;
            cloud.x = Phaser.Math.Between(0, GAME_WIDTH);
        }
    });
}
