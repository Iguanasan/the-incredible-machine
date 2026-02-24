/**
 * BaseObject — Abstract base class for all game objects.
 *
 * Every interactive object in the game (balls, ramps, fans, etc.)
 * extends this class. It defines the contract that the physics engine,
 * renderer, toolbox, and serialization system all depend on.
 *
 * ═══════════════════════════════════════════════════════════════
 *  THIS IS THE SHARED INTERFACE CONTRACT BETWEEN AGENT A AND B.
 *  Both agents code against this interface.
 * ═══════════════════════════════════════════════════════════════
 */

let _nextId = 1;

export default class BaseObject {
    /**
     * @param {number} x - Initial x position (center)
     * @param {number} y - Initial y position (center)
     * @param {object} [options={}] - Object-specific configuration
     */
    constructor(x, y, options = {}) {
        /** @type {number} Unique instance ID */
        this._id = _nextId++;

        /** @type {number} World x position */
        this._x = x;

        /** @type {number} World y position */
        this._y = y;

        /** @type {number} Rotation angle in radians */
        this._angle = options.angle || 0;

        /** @type {boolean} If true, this object is pre-placed and cannot be moved by the player */
        this._isFixed = options.isFixed || false;

        /** @type {object} Original options for serialization */
        this._options = { ...options };
    }

    // ── Identity ──────────────────────────────────

    /** @returns {number} Unique instance ID */
    get id() {
        return this._id;
    }

    /**
     * Object type identifier (e.g., 'ball', 'ramp', 'fan').
     * Must be overridden by subclasses.
     * @returns {string}
     */
    get type() {
        throw new Error(`${this.constructor.name} must override get type()`);
    }

    // ── Physics Bodies ────────────────────────────

    /**
     * Return Matter.js Body instances owned by this object.
     * Must be overridden by subclasses.
     * @returns {Matter.Body[]}
     */
    get bodies() {
        throw new Error(`${this.constructor.name} must override get bodies()`);
    }

    /**
     * Return Matter.js Constraint instances owned by this object.
     * Override if the object uses constraints (ropes, pulleys, etc.)
     * @returns {Matter.Constraint[]}
     */
    get constraints() {
        return [];
    }

    // ── Position & Bounds ─────────────────────────

    /** @returns {number} */
    get x() { return this._x; }

    /** @returns {number} */
    get y() { return this._y; }

    /** @returns {number} angle in radians */
    get angle() { return this._angle; }

    /** @returns {boolean} */
    get isFixed() { return this._isFixed; }

    /**
     * Get the bounding box of this object.
     * Must be overridden by subclasses.
     * @returns {{ x: number, y: number, width: number, height: number }}
     */
    get bounds() {
        throw new Error(`${this.constructor.name} must override get bounds()`);
    }

    // ── Edit Mode Operations ──────────────────────

    /**
     * Move the object to a new position (edit mode only).
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        this._x = x;
        this._y = y;
        // Subclasses should also update their Matter.js bodies
    }

    /**
     * Set the rotation angle (edit mode only).
     * @param {number} angle - Angle in radians
     */
    setAngle(angle) {
        this._angle = angle;
        // Subclasses should also update their Matter.js bodies
    }

    // ── Runtime Hooks ─────────────────────────────

    /**
     * Called every physics step before the engine updates.
     * Override to apply custom forces, behaviors, etc.
     * (e.g., Fan applies wind force, Conveyor applies surface velocity)
     * @param {object} engine - PhysicsEngine instance
     */
    onBeforeUpdate(engine) {
        // Default: no-op
    }

    /**
     * Called when this object collides with another.
     * Override to handle collision responses.
     * @param {BaseObject} other - The other game object
     * @param {Matter.Pair} pair - The collision pair from Matter.js
     */
    onCollision(other, pair) {
        // Default: no-op
    }

    // ── Rendering ─────────────────────────────────

    /**
     * Draw this object on the canvas.
     * Must be overridden by subclasses.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        throw new Error(`${this.constructor.name} must override draw(ctx)`);
    }

    /**
     * Draw a small icon for the toolbox panel.
     * Override for custom icons; default draws a scaled-down version.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} w - Icon width
     * @param {number} h - Icon height
     */
    drawToolboxIcon(ctx, w, h) {
        // Default: draw a small gray square placeholder
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(4, 4, w - 8, h - 8);
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1;
        ctx.strokeRect(4, 4, w - 8, h - 8);
    }

    // ── Serialization ─────────────────────────────

    /**
     * Serialize this object to a plain JSON-friendly object.
     * @returns {object}
     */
    serialize() {
        return {
            type: this.type,
            x: this._x,
            y: this._y,
            angle: this._angle,
            isFixed: this._isFixed,
            options: { ...this._options },
        };
    }

    /**
     * Reconstruct an object from serialized data.
     * Must be overridden by subclasses.
     * @param {object} data
     * @returns {BaseObject}
     */
    static deserialize(data) {
        throw new Error('Subclasses must override static deserialize(data)');
    }

    // ── Cleanup ───────────────────────────────────

    /**
     * Remove this object from the physics world and clean up resources.
     * Override to remove specific bodies/constraints.
     */
    dispose() {
        // Subclasses should remove their Matter.js bodies and constraints
    }
}
