/**
 * GameLoop ΓÇö Play/pause/reset state machine
 *
 * Controls simulation lifecycle with requestAnimationFrame,
 * speed scaling, capped delta-time, and snapshot management.
 */

import { eventBus } from '../EventBus.js';

/** @enum {string} */
export const LoopState = Object.freeze({
    STOPPED: 'stopped',
    RUNNING: 'running',
    PAUSED: 'paused',
});

export class GameLoop {
    /**
     * @param {import('./PhysicsEngine.js').PhysicsEngine} physics
     * @param {(objects: Set, physics: import('./PhysicsEngine.js').PhysicsEngine) => void} renderCallback
     */
    constructor(physics, renderCallback) {
        /** @type {import('./PhysicsEngine.js').PhysicsEngine} */
        this.physics = physics;

        /** @type {Function} */
        this._renderCallback = renderCallback;

        /** @type {string} */
        this._state = LoopState.STOPPED;

        /** @type {number|null} */
        this._rafId = null;

        /** @type {number} Elapsed simulation time in ms */
        this._elapsed = 0;

        /** @type {number} Last rAF timestamp */
        this._lastTimestamp = 0;

        /** @type {number} 1 or 2 */
        this._speed = 1;

        /** @type {number} Max dt cap to prevent spiral of death (ms) */
        this._maxDt = 50;

        // Bind the frame method
        this._frame = this._frame.bind(this);
    }

    // ΓöÇΓöÇ State Queries ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /** @returns {string} */
    get state() { return this._state; }

    /** @returns {boolean} */
    get isRunning() { return this._state === LoopState.RUNNING; }

    /** @returns {boolean} */
    get isPaused() { return this._state === LoopState.PAUSED; }

    /** @returns {boolean} */
    get isStopped() { return this._state === LoopState.STOPPED; }

    /** @returns {number} */
    get elapsed() { return this._elapsed; }

    /** @returns {number} */
    get speed() { return this._speed; }

    // ΓöÇΓöÇ Controls ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /** Start or resume the simulation. */
    play() {
        if (this._state === LoopState.RUNNING) return;

        if (this._state === LoopState.STOPPED) {
            // Take snapshot on first play so we can reset
            this.physics.takeSnapshot();
            this._elapsed = 0;
        }

        this._state = LoopState.RUNNING;
        this._lastTimestamp = 0;
        this._rafId = requestAnimationFrame(this._frame);

        eventBus.emit('loop:play', { elapsed: this._elapsed });
    }

    /** Pause the simulation (can resume). */
    pause() {
        if (this._state !== LoopState.RUNNING) return;

        this._state = LoopState.PAUSED;
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        eventBus.emit('loop:pause', { elapsed: this._elapsed });
    }

    /** Stop and reset to the snapshot. */
    reset() {
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        this._state = LoopState.STOPPED;
        this._elapsed = 0;
        this._lastTimestamp = 0;

        // Restore physics to snapshot
        this.physics.restoreSnapshot();
        this.physics.clearSnapshot();

        // One final render to show restored state
        this._renderCallback(this.physics.getObjects(), this.physics);

        eventBus.emit('loop:reset');
    }

    /** Toggle between 1├ù and 2├ù speed. */
    cycleSpeed() {
        this._speed = this._speed === 1 ? 2 : 1;
        this.physics.setTimeScale(this._speed);
        eventBus.emit('loop:speed', { speed: this._speed });
    }

    // ΓöÇΓöÇ Frame Loop ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /**
     * @private
     * @param {number} timestamp ΓÇö rAF timestamp in ms
     */
    _frame(timestamp) {
        if (this._state !== LoopState.RUNNING) return;

        // Calculate delta
        if (this._lastTimestamp === 0) {
            this._lastTimestamp = timestamp;
        }

        let dt = timestamp - this._lastTimestamp;
        this._lastTimestamp = timestamp;

        // Cap delta to prevent physics explosions
        if (dt > this._maxDt) dt = this._maxDt;
        if (dt <= 0) dt = 16.67;

        // Step physics
        this.physics.step(dt);
        this._elapsed += dt;

        // Render
        this._renderCallback(this.physics.getObjects(), this.physics);

        // Emit frame event
        eventBus.emit('loop:frame', { dt, elapsed: this._elapsed });

        // Schedule next frame
        this._rafId = requestAnimationFrame(this._frame);
    }

    // ΓöÇΓöÇ Cleanup ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /** Stop the loop and release resources. */
    dispose() {
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._state = LoopState.STOPPED;
    }
}

export default GameLoop;
