/**
 * main.js — Application entry point for The Incredible Machine
 *
 * Initializes the game engine, renderer, UI panels, and manages
 * the top-level application mode state machine.
 */

import { eventBus } from './EventBus.js';

// ──────────────────────────────────────────────
// Application Modes
// ──────────────────────────────────────────────
export const AppMode = Object.freeze({
    MENU: 'MENU',
    EDITING: 'EDITING',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    WON: 'WON',
    SANDBOX: 'SANDBOX',
});

// ──────────────────────────────────────────────
// Application State
// ──────────────────────────────────────────────
const state = {
    mode: AppMode.MENU,
    currentLevelId: null,
};

/**
 * Switch application mode and notify all listeners.
 * @param {string} newMode - One of AppMode values
 */
export function setMode(newMode) {
    const oldMode = state.mode;
    state.mode = newMode;
    eventBus.emit('mode:changed', { oldMode, newMode });
    console.log(`[App] Mode: ${oldMode} → ${newMode}`);
}

/**
 * Get current application mode.
 * @returns {string}
 */
export function getMode() {
    return state.mode;
}

// ──────────────────────────────────────────────
// Initialization
// ──────────────────────────────────────────────
function init() {
    console.log('🔧 The Incredible Machine — Initializing...');

    // Get DOM elements
    const canvas = document.getElementById('game-canvas');
    const gameArea = document.getElementById('game-area');

    if (!canvas || !gameArea) {
        console.error('[App] Required DOM elements not found');
        return;
    }

    // Size canvas to fill the game area
    function resizeCanvas() {
        canvas.width = gameArea.clientWidth;
        canvas.height = gameArea.clientHeight;
        eventBus.emit('canvas:resized', {
            width: canvas.width,
            height: canvas.height,
        });
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ── Module initialization order ──
    // These will be uncommented as modules are implemented:
    // 1. PhysicsEngine.init(canvas.width, canvas.height)
    // 2. Renderer.init(canvas)
    // 3. Toolbox.init()
    // 4. PlayControls.init()
    // 5. LevelManager.init()
    // 6. GameLoop.init()

    // For now, draw a placeholder to confirm everything is wired up
    const ctx = canvas.getContext('2d');
    drawPlaceholder(ctx, canvas.width, canvas.height);

    console.log('✅ The Incredible Machine — Ready!');
    eventBus.emit('app:ready');
}

/**
 * Draw a placeholder screen to confirm the canvas is working.
 */
function drawPlaceholder(ctx, w, h) {
    // Playfield background
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(0, 0, w, h);

    // Title text
    ctx.fillStyle = '#404040';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('The Incredible Machine', w / 2, h / 2 - 30);

    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#808080';
    ctx.fillText('Setting up the workshop...', w / 2, h / 2 + 10);

    // Draw a small gear icon
    drawGearIcon(ctx, w / 2, h / 2 + 60, 20);
}

/**
 * Draw a simple gear icon as a visual indicator.
 */
function drawGearIcon(ctx, cx, cy, r) {
    ctx.save();
    ctx.strokeStyle = '#6060a0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * Math.PI * 2;
        const outerR = r;
        const innerR = r * 0.65;
        const halfTooth = Math.PI / teeth * 0.4;

        ctx.lineTo(cx + Math.cos(angle - halfTooth) * innerR, cy + Math.sin(angle - halfTooth) * innerR);
        ctx.lineTo(cx + Math.cos(angle - halfTooth) * outerR, cy + Math.sin(angle - halfTooth) * outerR);
        ctx.lineTo(cx + Math.cos(angle + halfTooth) * outerR, cy + Math.sin(angle + halfTooth) * outerR);
        ctx.lineTo(cx + Math.cos(angle + halfTooth) * innerR, cy + Math.sin(angle + halfTooth) * innerR);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// Boot the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
