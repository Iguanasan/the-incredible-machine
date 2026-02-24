/**
 * ObjectRenderer ΓÇö Delegates per-object Canvas drawing
 *
 * This module orchestrates rendering of all game objects.
 * Each object's `draw(ctx)` method handles its own rendering,
 * but this module adds debug overlays, selection visuals, etc.
 */

export class ObjectRenderer {
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {
        this._ctx = ctx;
        this._showDebug = false;
        this._selectedObject = null;
    }

    /**
     * Render all game objects.
     * @param {Iterable<import('../objects/BaseObject.js').default>} objects
     */
    renderAll(objects) {
        for (const obj of objects) {
            this.renderObject(obj);
        }
    }

    /**
     * Render a single game object.
     * @param {import('../objects/BaseObject.js').default} obj
     */
    renderObject(obj) {
        const ctx = this._ctx;

        // Skip disposed objects
        if (!obj.bodies || obj.bodies.length === 0) return;

        ctx.save();

        // Let the object draw itself
        obj.draw(ctx);

        // Debug overlay: show bounds, body outlines, etc.
        if (this._showDebug) {
            this._drawDebugOverlay(obj);
        }

        ctx.restore();
    }

    /**
     * Draw selection handles around the selected object.
     * @param {import('../objects/BaseObject.js').default} obj
     */
    drawSelectionHandles(obj) {
        if (!obj) return;

        const ctx = this._ctx;
        const bounds = obj.bounds;

        ctx.save();

        const pad = 6;
        const x = bounds.x - pad;
        const y = bounds.y - pad;
        const w = bounds.width + pad * 2;
        const h = bounds.height + pad * 2;

        // Selection outline (dashed)
        ctx.strokeStyle = '#2090ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        // Corner handles
        const handleSize = 6;
        ctx.fillStyle = '#2090ff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;

        // Top-left
        ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

        // Top-right
        ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

        // Bottom-left
        ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);

        // Bottom-right
        ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);

        // Rotation handle (above center top)
        const rotX = x + w / 2;
        const rotY = y - 20;
        ctx.beginPath();
        ctx.arc(rotX, rotY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#20cc60';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Line from top center to rotation handle
        ctx.strokeStyle = '#2090ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(rotX, rotY + 5);
        ctx.stroke();

        // Delete handle (top-right corner, outside)
        const delX = x + w + 8;
        const delY = y - 8;
        ctx.beginPath();
        ctx.arc(delX, delY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#e04040';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // X mark in delete handle
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(delX - 3, delY - 3);
        ctx.lineTo(delX + 3, delY + 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(delX + 3, delY - 3);
        ctx.lineTo(delX - 3, delY + 3);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw a ghost preview of an object being dragged from the toolbox.
     * @param {import('../objects/BaseObject.js').default} obj
     * @param {number} opacity
     */
    drawGhost(obj, opacity = 0.5) {
        if (!obj) return;

        const ctx = this._ctx;
        ctx.save();
        ctx.globalAlpha = opacity;
        obj.draw(ctx);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    /**
     * Draw debug overlays for a game object.
     * @param {import('../objects/BaseObject.js').default} obj
     */
    _drawDebugOverlay(obj) {
        const ctx = this._ctx;

        // Draw bounds rectangle
        const bounds = obj.bounds;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.setLineDash([]);

        // Draw body outlines (raw physics shapes)
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 1;
        for (const body of obj.bodies) {
            if (body.vertices) {
                ctx.beginPath();
                ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
                for (let i = 1; i < body.vertices.length; i++) {
                    ctx.lineTo(body.vertices[i].x, body.vertices[i].y);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }

        // Draw center of mass
        for (const body of obj.bodies) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(body.position.x, body.position.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Type label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '9px monospace';
        ctx.fillText(obj.type, bounds.x, bounds.y - 3);
    }

    /** Toggle debug overlay rendering. */
    toggleDebug() {
        this._showDebug = !this._showDebug;
    }

    /** @param {boolean} enabled */
    set showDebug(enabled) {
        this._showDebug = enabled;
    }

    /** @returns {boolean} */
    get showDebug() {
        return this._showDebug;
    }
}

export default ObjectRenderer;
