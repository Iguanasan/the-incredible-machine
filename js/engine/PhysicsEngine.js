/**
 * PhysicsEngine ΓÇö Matter.js wrapper
 *
 * Manages the Matter.js world, object lifecycle, collision events,
 * snapshot/restore for reset, boundary walls, and hit-testing.
 */

import Matter from 'matter-js';
import { eventBus } from '../EventBus.js';

const { Engine, World, Bodies, Body, Composite, Events, Query, Sleeping } = Matter;

export class PhysicsEngine {
    /**
     * @param {number} width   ΓÇö playfield width in px
     * @param {number} height  ΓÇö playfield height in px
     * @param {object} [opts]
     * @param {number} [opts.gravityX=0]
     * @param {number} [opts.gravityY=1]
     * @param {boolean} [opts.enableSleeping=true]
     */
    constructor(width, height, opts = {}) {
        this.width = width;
        this.height = height;

        // Create Matter.js engine
        this.engine = Engine.create({
            gravity: {
                x: opts.gravityX ?? 0,
                y: opts.gravityY ?? 1,
            },
            enableSleeping: opts.enableSleeping ?? true,
        });

        this.world = this.engine.world;

        /** @type {Set<import('../objects/BaseObject.js').default>} */
        this._objects = new Set();

        /** @type {Map<number, import('../objects/BaseObject.js').default>} */
        this._bodyToObject = new Map();

        /** @type {object|null} Serialized snapshot for reset */
        this._snapshot = null;

        // Add boundary walls
        this._addBoundaries();

        // Forward collision events
        this._setupCollisionEvents();
    }

    // ΓöÇΓöÇ Object Lifecycle ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /**
     * Add a game object to the physics world.
     * @param {import('../objects/BaseObject.js').default} gameObject
     */
    addObject(gameObject) {
        this._objects.add(gameObject);

        // Add all bodies
        for (const body of gameObject.bodies) {
            Composite.add(this.world, body);
            this._bodyToObject.set(body.id, gameObject);
        }

        // Add all constraints
        if (gameObject.constraints) {
            for (const constraint of gameObject.constraints) {
                Composite.add(this.world, constraint);
            }
        }

        eventBus.emit('physics:object-added', gameObject);
    }

    /**
     * Remove a game object from the physics world.
     * @param {import('../objects/BaseObject.js').default} gameObject
     */
    removeObject(gameObject) {
        // Remove constraints first
        if (gameObject.constraints) {
            for (const constraint of gameObject.constraints) {
                Composite.remove(this.world, constraint);
            }
        }

        // Remove bodies
        for (const body of gameObject.bodies) {
            Composite.remove(this.world, body);
            this._bodyToObject.delete(body.id);
        }

        this._objects.delete(gameObject);
        if (gameObject.dispose) gameObject.dispose();

        eventBus.emit('physics:object-removed', gameObject);
    }

    /** Remove all game objects (keeps boundaries). */
    clear() {
        for (const obj of [...this._objects]) {
            this.removeObject(obj);
        }
    }

    // ΓöÇΓöÇ Simulation ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /**
     * Advance the physics simulation by dt milliseconds.
     * @param {number} dt ΓÇö delta time in ms
     */
    step(dt) {
        // Pre-update hooks on all objects
        for (const obj of this._objects) {
            if (obj.onBeforeUpdate) {
                obj.onBeforeUpdate(dt, this);
            }
        }

        Engine.update(this.engine, dt);

        // Post-update hooks
        for (const obj of this._objects) {
            if (obj.onAfterUpdate) {
                obj.onAfterUpdate(dt, this);
            }
        }
    }

    /**
     * Set the time scale (1 = normal, 2 = double speed, etc.)
     * @param {number} scale
     */
    setTimeScale(scale) {
        this.engine.timing.timeScale = scale;
    }

    // ΓöÇΓöÇ Snapshot / Restore ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /** Save the current state for later reset. */
    takeSnapshot() {
        this._snapshot = [];
        for (const obj of this._objects) {
            this._snapshot.push({
                serialized: obj.serialize(),
                bodyStates: obj.bodies.map(b => ({
                    id: b.id,
                    position: { x: b.position.x, y: b.position.y },
                    angle: b.angle,
                    velocity: { x: b.velocity.x, y: b.velocity.y },
                    angularVelocity: b.angularVelocity,
                })),
            });
        }
    }

    /** Restore to the last snapshot. */
    restoreSnapshot() {
        if (!this._snapshot) return;

        // Restore body states
        const objectArray = [...this._objects];
        for (let i = 0; i < this._snapshot.length && i < objectArray.length; i++) {
            const snap = this._snapshot[i];
            const obj = objectArray[i];

            for (const bodyState of snap.bodyStates) {
                const body = obj.bodies.find(b => b.id === bodyState.id);
                if (body) {
                    Body.setPosition(body, bodyState.position);
                    Body.setAngle(body, bodyState.angle);
                    Body.setVelocity(body, bodyState.velocity);
                    Body.setAngularVelocity(body, bodyState.angularVelocity);
                    Sleeping.set(body, false);
                }
            }
        }
    }

    /** Clear the stored snapshot. */
    clearSnapshot() {
        this._snapshot = null;
    }

    /** @returns {boolean} */
    hasSnapshot() {
        return this._snapshot !== null;
    }

    // ΓöÇΓöÇ Queries ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /** @returns {Set<import('../objects/BaseObject.js').default>} */
    getObjects() {
        return this._objects;
    }

    /**
     * Find the game object whose body contains the given point.
     * @param {{ x: number, y: number }} point
     * @returns {import('../objects/BaseObject.js').default | null}
     */
    objectAtPoint(point) {
        const bodies = Query.point(Composite.allBodies(this.world), point);
        for (const body of bodies) {
            const obj = this._bodyToObject.get(body.id);
            if (obj) return obj;
        }
        return null;
    }

    /**
     * Find the game object for a given Matter.js body.
     * @param {Matter.Body} body
     * @returns {import('../objects/BaseObject.js').default | null}
     */
    getObjectForBody(body) {
        return this._bodyToObject.get(body.id) ?? null;
    }

    // ΓöÇΓöÇ Boundaries ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /** @private */
    _addBoundaries() {
        const wallThickness = 50;
        const walls = [
            // Floor
            Bodies.rectangle(this.width / 2, this.height + wallThickness / 2, this.width + wallThickness * 2, wallThickness, { isStatic: true, label: 'wall-floor' }),
            // Left
            Bodies.rectangle(-wallThickness / 2, this.height / 2, wallThickness, this.height, { isStatic: true, label: 'wall-left' }),
            // Right
            Bodies.rectangle(this.width + wallThickness / 2, this.height / 2, wallThickness, this.height, { isStatic: true, label: 'wall-right' }),
            // Ceiling
            Bodies.rectangle(this.width / 2, -wallThickness / 2, this.width + wallThickness * 2, wallThickness, { isStatic: true, label: 'wall-ceiling' }),
        ];
        Composite.add(this.world, walls);
    }

    // ΓöÇΓöÇ Collision Events ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /** @private */
    _setupCollisionEvents() {
        Events.on(this.engine, 'collisionStart', (event) => {
            for (const pair of event.pairs) {
                const objA = this._bodyToObject.get(pair.bodyA.id);
                const objB = this._bodyToObject.get(pair.bodyB.id);

                if (objA && objB) {
                    if (objA.onCollision) objA.onCollision(objB, pair);
                    if (objB.onCollision) objB.onCollision(objA, pair);
                    eventBus.emit('physics:collision', { objectA: objA, objectB: objB, pair });
                }
            }
        });
    }

    // ΓöÇΓöÇ Cleanup ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /** Tear down the engine completely. */
    dispose() {
        Events.off(this.engine);
        this.clear();
        World.clear(this.world);
        Engine.clear(this.engine);
    }
}

export default PhysicsEngine;
