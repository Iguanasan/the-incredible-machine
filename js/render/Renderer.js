/**
 * Renderer — Canvas 2D drawing orchestrator
 *
 * Manages the <canvas> element, draws all game objects each frame,
 * handles selection UI and ghost drag previews, and provides
 * hit-testing for click-to-select.
 */

import { eventBus } from '../EventBus.js';
import { objectRegistry } from '../objects/ObjectRegistry.js';

class Renderer {
    constructor() {
        /** @type {HTMLCanvasElement} */
        this.canvas = null;
        /** @type {CanvasRenderingContext2D} */
        this.ctx = null;

        /** Currently selected object (or null) */
        this.selectedObject = null;

        /** Drag ghost state: { type, x, y } or null */
        this.ghostState = null;

        /** Ghost object instance for drawing */
        this._ghostObj = null;

        /** Current application mode */
        this._mode = 'MENU';

        /** Objects list reference (set each frame) */
        this._objects = [];

        /** Animation frame ID */
        this._rafId = null;

        /** Playfield background color (TIM warm off-white) */
        this.BG_COLOR = '#e8e0d0';

        /** Selection handle colors */
        this.HANDLE_COLORS = {
            move: '#4080ff',
            rotate: '#40c040',
            delete: '#e04040',
        };
    }

    /**
     * Initialize the renderer with the canvas element.
     * @param {HTMLCanvasElement} canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Listen for mode changes
        eventBus.on('mode:changed', ({ newMode }) => {
            this._mode = newMode;
            if (newMode === 'PLAYING' || newMode === 'PAUSED') {
                this.selectedObject = null;
            }
        });

        // Listen for object selection
        eventBus.on('object:selected', (obj) => {
            this.selectedObject = obj;
        });

        // Listen for drag ghost
        eventBus.on('drag:ghost-update', (state) => {
            this.ghostState = state;
            if (state && state.type) {
                try {
                    if (!this._ghostObj || this._ghostObj.type !== state.type) {
                        this._ghostObj = objectRegistry.create(state.type, state.x, state.y);
                    } else {
                        this._ghostObj.setPosition(state.x, state.y);
                    }
                } catch (e) {
                    this._ghostObj = null;
                }
            } else {
                this._ghostObj = null;
            }
        });

        eventBus.on('drag:ghost-clear', () => {
            this.ghostState = null;
            this._ghostObj = null;
        });

        console.log('[Renderer] Initialized');
    }

    /**
     * Set the objects list to render each frame.
     * @param {BaseObject[]} objects
     */
    setObjects(objects) {
        this._objects = objects;
    }

    /**
     * Main render call — draw one frame.
     * @param {BaseObject[]} [objects] - Optional override
     */
    render(objects) {
        const objs = objects || this._objects;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Clear with background
        ctx.fillStyle = this.BG_COLOR;
        ctx.fillRect(0, 0, w, h);

        // 2. Draw subtle grid for visual reference (edit/sandbox mode only)
        if (this._mode === 'EDITING' || this._mode === 'SANDBOX') {
            this._drawGrid(ctx, w, h);
        }

        // 3. Draw all placed objects
        for (const obj of objs) {
            ctx.save();
            obj.draw(ctx);
            ctx.restore();
        }

        // 4. Draw selection handles on the selected object (edit modes only)
        if (this.selectedObject && (this._mode === 'EDITING' || this._mode === 'SANDBOX')) {
            this._drawSelectionHandles(ctx, this.selectedObject);
        }

        // 5. Draw drag ghost
        if (this._ghostObj && this.ghostState) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            this._ghostObj.setPosition(this.ghostState.x, this.ghostState.y);
            this._ghostObj.draw(ctx);
            ctx.restore();
        }
    }

    /**
     * Start the render loop.
     */
    startLoop() {
        const loop = () => {
            this.render();
            this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
    }

    /**
     * Stop the render loop.
     */
    stopLoop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    /**
     * Hit-test: find the topmost object at a canvas point.
     * @param {number} x - Canvas x
     * @param {number} y - Canvas y
     * @param {BaseObject[]} [objects]
     * @returns {BaseObject|null}
     */
    getObjectAtPoint(x, y, objects) {
        const objs = objects || this._objects;
        // Iterate in reverse so topmost (last-drawn) objects are tested first
        for (let i = objs.length - 1; i >= 0; i--) {
            const obj = objs[i];
            const b = obj.bounds;
            if (x >= b.x && x <= b.x + b.width &&
                y >= b.y && y <= b.y + b.height) {
                return obj;
            }
        }
        return null;
    }

    /**
     * Convert page coordinates to canvas coordinates.
     * @param {number} pageX
     * @param {number} pageY
     * @returns {{ x: number, y: number }}
     */
    pageToCanvas(pageX, pageY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (pageX - rect.left) * scaleX,
            y: (pageY - rect.top) * scaleY,
        };
    }

    /**
     * Get the selection handle hit at a canvas point.
     * @param {number} x
     * @param {number} y
     * @returns {'move'|'rotate'|'delete'|null}
     */
    getHandleAtPoint(x, y) {
        if (!this.selectedObject) return null;
        const handles = this._getHandlePositions(this.selectedObject);
        for (const [name, hx, hy] of handles) {
            const dx = x - hx, dy = y - hy;
            if (dx * dx + dy * dy <= 12 * 12) {
                return name;
            }
        }
        return null;
    }

    // ── Private helpers ──────────────────────────

    _drawGrid(ctx, w, h) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = step; x < w; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = step; y < h; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawSelectionHandles(ctx, obj) {
        const b = obj.bounds;

        // Dashed selection box
        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
        ctx.setLineDash([]);

        // Handles
        const handles = this._getHandlePositions(obj);
        for (const [name, hx, hy] of handles) {
            ctx.beginPath();
            ctx.arc(hx, hy, 8, 0, Math.PI * 2);
            ctx.fillStyle = this.HANDLE_COLORS[name];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icons inside handles
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (name === 'move') ctx.fillText('✥', hx, hy);
            else if (name === 'rotate') ctx.fillText('↻', hx, hy);
            else if (name === 'delete') ctx.fillText('✕', hx, hy);
        }

        ctx.restore();
    }

    _getHandlePositions(obj) {
        const b = obj.bounds;
        return [
            ['move', b.x + b.width / 2, b.y - 14],
            ['rotate', b.x + b.width + 14, b.y + b.height / 2],
            ['delete', b.x - 14, b.y + b.height / 2],
        ];
    }
}

/** Singleton renderer instance */
export const renderer = new Renderer();
export default Renderer;
