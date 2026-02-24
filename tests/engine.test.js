/**
 * Unit tests for PhysicsEngine, GameLoop, and game object serialization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── PhysicsEngine Tests ───────────────────────────

describe('PhysicsEngine', () => {
    let PhysicsEngine;

    beforeEach(async () => {
        const mod = await import('../js/engine/PhysicsEngine.js');
        PhysicsEngine = mod.PhysicsEngine;
    });

    it('should create an engine with gravitational properties', () => {
        const engine = new PhysicsEngine(800, 600);
        expect(engine.engine).toBeDefined();
        expect(engine.engine.gravity.y).toBe(1);
        expect(engine.width).toBe(800);
        expect(engine.height).toBe(600);
        engine.dispose();
    });

    it('should allow custom gravity', () => {
        const engine = new PhysicsEngine(800, 600, { gravityX: 0.5, gravityY: 2 });
        expect(engine.engine.gravity.x).toBe(0.5);
        expect(engine.engine.gravity.y).toBe(2);
        engine.dispose();
    });

    it('should step the simulation without error', () => {
        const engine = new PhysicsEngine(800, 600);
        expect(() => engine.step(16.67)).not.toThrow();
        engine.dispose();
    });

    it('should take and restore snapshots', () => {
        const engine = new PhysicsEngine(800, 600);
        expect(engine.hasSnapshot()).toBe(false);

        engine.takeSnapshot();
        expect(engine.hasSnapshot()).toBe(true);

        engine.restoreSnapshot();
        engine.clearSnapshot();
        expect(engine.hasSnapshot()).toBe(false);

        engine.dispose();
    });

    it('should set time scale', () => {
        const engine = new PhysicsEngine(800, 600);
        engine.setTimeScale(2);
        expect(engine.engine.timing.timeScale).toBe(2);
        engine.dispose();
    });

    it('should clear all objects', () => {
        const engine = new PhysicsEngine(800, 600);
        engine.clear();
        expect(engine.getObjects().size).toBe(0);
        engine.dispose();
    });
});

// ── GameLoop Tests ─────────────────────────────────

describe('GameLoop', () => {
    let GameLoop, PhysicsEngine, LoopState;

    beforeEach(async () => {
        const engineMod = await import('../js/engine/PhysicsEngine.js');
        const loopMod = await import('../js/engine/GameLoop.js');
        PhysicsEngine = engineMod.PhysicsEngine;
        GameLoop = loopMod.GameLoop;
        LoopState = loopMod.LoopState;

        // Stub browser animation globals for Node environment
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should start in STOPPED state', () => {
        const physics = new PhysicsEngine(800, 600);
        const loop = new GameLoop(physics, () => { });

        expect(loop.state).toBe(LoopState.STOPPED);
        expect(loop.isStopped).toBe(true);
        expect(loop.isRunning).toBe(false);
        expect(loop.isPaused).toBe(false);

        loop.dispose();
        physics.dispose();
    });

    it('should transition to RUNNING on play', () => {
        const physics = new PhysicsEngine(800, 600);
        const loop = new GameLoop(physics, () => { });

        loop.play();
        expect(loop.state).toBe(LoopState.RUNNING);
        expect(loop.isRunning).toBe(true);

        loop.dispose();
        physics.dispose();
    });

    it('should transition to PAUSED on pause', () => {
        const physics = new PhysicsEngine(800, 600);
        const loop = new GameLoop(physics, () => { });

        loop.play();
        loop.pause();
        expect(loop.state).toBe(LoopState.PAUSED);
        expect(loop.isPaused).toBe(true);

        loop.dispose();
        physics.dispose();
    });

    it('should reset to STOPPED on reset', () => {
        const physics = new PhysicsEngine(800, 600);
        const loop = new GameLoop(physics, () => { });

        loop.play();
        loop.reset();
        expect(loop.state).toBe(LoopState.STOPPED);
        expect(loop.elapsed).toBe(0);

        loop.dispose();
        physics.dispose();
    });

    it('should cycle speed between 1× and 2×', () => {
        const physics = new PhysicsEngine(800, 600);
        const loop = new GameLoop(physics, () => { });

        expect(loop.speed).toBe(1);
        loop.cycleSpeed();
        expect(loop.speed).toBe(2);
        loop.cycleSpeed();
        expect(loop.speed).toBe(1);

        loop.dispose();
        physics.dispose();
    });
});

// ── Object Serialization Tests ────────────────────

describe('Object Serialization', () => {
    it('should serialize and deserialize a Ball', async () => {
        const { default: Ball } = await import('../js/objects/Ball.js');
        const ball = new Ball(100, 200, { variant: 'tennis' });

        const data = ball.serialize();
        expect(data.type).toBe('ball');
        expect(data.x).toBe(100);
        expect(data.y).toBe(200);
        expect(data.options.variant).toBe('tennis');

        const restored = Ball.deserialize(data);
        expect(restored.type).toBe('ball');
        expect(restored._variant).toBe('tennis');
    });

    it('should serialize and deserialize a Ramp', async () => {
        const { default: Ramp } = await import('../js/objects/Ramp.js');
        const ramp = new Ramp(300, 400, { width: 150, angle: 0.5 });

        const data = ramp.serialize();
        expect(data.type).toBe('ramp');
        expect(data.options.width).toBe(150);

        const restored = Ramp.deserialize(data);
        expect(restored.type).toBe('ramp');
    });

    it('should serialize and deserialize a Conveyor', async () => {
        const { default: Conveyor } = await import('../js/objects/Conveyor.js');
        const conveyor = new Conveyor(200, 300, { speed: -3 });

        const data = conveyor.serialize();
        expect(data.type).toBe('conveyor');
        expect(data.options.speed).toBe(-3);

        const restored = Conveyor.deserialize(data);
        expect(restored.type).toBe('conveyor');
    });

    it('should serialize and deserialize a Domino', async () => {
        const { default: Domino } = await import('../js/objects/Domino.js');
        const domino = new Domino(150, 250);

        const data = domino.serialize();
        expect(data.type).toBe('domino');

        const restored = Domino.deserialize(data);
        expect(restored.type).toBe('domino');
    });

    it('should serialize and deserialize a Bucket', async () => {
        const { default: Bucket } = await import('../js/objects/Bucket.js');
        const bucket = new Bucket(400, 500, { catchType: 'ball' });

        const data = bucket.serialize();
        expect(data.type).toBe('bucket');
        expect(data.options.catchType).toBe('ball');

        const restored = Bucket.deserialize(data);
        expect(restored.type).toBe('bucket');
    });

    it('should serialize and deserialize a Balloon', async () => {
        const { default: Balloon } = await import('../js/objects/Balloon.js');
        const balloon = new Balloon(200, 100, { colorIndex: 2 });

        const data = balloon.serialize();
        expect(data.type).toBe('balloon');
        expect(data.options.colorIndex).toBe(2);

        const restored = Balloon.deserialize(data);
        expect(restored.type).toBe('balloon');
    });

    it('should serialize and deserialize a Mouse', async () => {
        const { default: Mouse } = await import('../js/objects/Mouse.js');
        const mouse = new Mouse(300, 400, { direction: -1, speed: 2 });

        const data = mouse.serialize();
        expect(data.type).toBe('mouse');
        expect(data.options.direction).toBe(-1);
        expect(data.options.speed).toBe(2);

        const restored = Mouse.deserialize(data);
        expect(restored.type).toBe('mouse');
    });
});

// ── ObjectRegistry Tests ──────────────────────────

describe('ObjectRegistry', () => {
    it('should register and create objects', async () => {
        const { objectRegistry } = await import('../js/objects/ObjectRegistry.js');
        const { default: Ball } = await import('../js/objects/Ball.js');

        // Register if not already
        if (!objectRegistry.has('ball')) {
            objectRegistry.register('ball', Ball, {
                displayName: 'Ball',
                category: 'balls',
            });
        }

        const ball = objectRegistry.create('ball', 100, 200);
        expect(ball.type).toBe('ball');
        expect(ball.bodies.length).toBe(1);
    });

    it('should throw for unknown types', async () => {
        const { objectRegistry } = await import('../js/objects/ObjectRegistry.js');

        expect(() => objectRegistry.create('nonexistent', 0, 0)).toThrow();
    });

    it('should list categories', async () => {
        const { registerAllObjects } = await import('../js/objects/registerAllObjects.js');
        const { objectRegistry } = await import('../js/objects/ObjectRegistry.js');

        registerAllObjects();

        const categories = objectRegistry.getCategories();
        expect(categories).toContain('balls');
        expect(categories).toContain('surfaces');
        expect(categories).toContain('machines');
        expect(categories).toContain('triggers');
    });

    it('should register all 17 object types', async () => {
        const { objectRegistry } = await import('../js/objects/ObjectRegistry.js');

        const all = objectRegistry.getAll();
        expect(all.length).toBeGreaterThanOrEqual(17);
    });
});
