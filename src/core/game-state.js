/**
 * 核心游戏状态管理
 * 平台无关的游戏逻辑和状态
 */

import { getDifficulty } from './difficulty.js';

/**
 * 游戏状态类
 * 管理游戏的核心状态和逻辑，不依赖于任何渲染引擎
 */
export class GameState {
    constructor() {
        this.reset();
    }

    /**
     * 重置游戏状态
     */
    reset() {
        this.gameOver = false;
        this.gameStarted = false;
        this.score = 0;
        this.passedPlatforms = 0;
        this.platformSpawnTimer = 0;
        this.currentDifficulty = getDifficulty(0);
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.gameStarted = true;
    }

    /**
     * 触发游戏结束
     */
    triggerGameOver() {
        this.gameOver = true;
    }

    /**
     * 更新游戏状态
     * @param {number} delta - 时间增量（毫秒）
     * @returns {Object} 更新后的状态信息
     */
    update(delta) {
        if (!this.gameStarted || this.gameOver) {
            return {
                shouldUpdate: false,
                difficulty: this.currentDifficulty
            };
        }

        // 更新平台生成计时器
        this.platformSpawnTimer += delta;

        // 根据当前分数更新难度
        this.currentDifficulty = getDifficulty(this.score);

        // 更新分数（基于通过的平台数量）
        this.score = this.passedPlatforms * 10;

        return {
            shouldUpdate: true,
            difficulty: this.currentDifficulty,
            shouldSpawnPlatform: this.platformSpawnTimer >= this.currentDifficulty.spawnInterval,
            score: this.score
        };
    }

    /**
     * 重置平台生成计时器（在生成新平台后调用）
     */
    resetSpawnTimer() {
        this.platformSpawnTimer = 0;
    }

    /**
     * 增加通过的平台数量
     */
    incrementPassedPlatforms() {
        this.passedPlatforms++;
    }

    /**
     * 检查玩家是否触碰边界（失败条件）
     * @param {number} playerY - 玩家Y坐标
     * @param {number} gameHeight - 游戏区域高度
     * @returns {boolean} 是否触碰边界
     */
    checkBoundaryCollision(playerY, gameHeight) {
        // 顶部死亡线
        const TOP_DEATH_LINE = 35;
        // 底部死亡线
        const BOTTOM_DEATH_LINE = gameHeight - 50;

        return playerY <= TOP_DEATH_LINE || playerY >= BOTTOM_DEATH_LINE;
    }

    /**
     * 获取当前游戏状态
     */
    getState() {
        return {
            gameOver: this.gameOver,
            gameStarted: this.gameStarted,
            score: this.score,
            passedPlatforms: this.passedPlatforms,
            currentDifficulty: this.currentDifficulty
        };
    }

    /**
     * 是否可以开始游戏
     */
    canStart() {
        return !this.gameStarted;
    }

    /**
     * 是否游戏结束
     */
    isGameOver() {
        return this.gameOver;
    }

    /**
     * 是否游戏进行中
     */
    isPlaying() {
        return this.gameStarted && !this.gameOver;
    }
}
