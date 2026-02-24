/**
 * registerAllObjects — Bootstrap registration of all game object types
 *
 * Called once at app startup to populate the ObjectRegistry
 * with all available game objects and their metadata.
 */

import { objectRegistry } from './ObjectRegistry.js';

import Ball from './Ball.js';
import Ramp from './Ramp.js';
import Conveyor from './Conveyor.js';
import Trampoline from './Trampoline.js';
import Fan from './Fan.js';
import Spring from './Spring.js';
import Domino from './Domino.js';
import Gear from './Gear.js';
import Pulley from './Pulley.js';
import Balloon from './Balloon.js';
import Bucket from './Bucket.js';
import Candle from './Candle.js';
import Rope from './Rope.js';
import Scissors from './Scissors.js';
import Mouse from './Mouse.js';

/**
 * Register all game objects with the central ObjectRegistry.
 * Must be called before any toolbox rendering or level loading.
 */
export function registerAllObjects() {
    // ── Balls ────────────────────────────────────
    objectRegistry.register('ball', Ball, {
        displayName: 'Bowling Ball',
        category: 'balls',
        description: 'Heavy ball — rolls, bounces, and smashes.',
    });

    objectRegistry.register('tennis-ball', class TennisBall extends Ball {
        constructor(x, y, opts = {}) { super(x, y, { ...opts, variant: 'tennis' }); }
        get type() { return 'tennis-ball'; }
        static deserialize(data) { return new TennisBall(data.x, data.y, data.options); }
    }, {
        displayName: 'Tennis Ball',
        category: 'balls',
        description: 'Light bouncy ball.',
    });

    objectRegistry.register('baseball', class Baseball extends Ball {
        constructor(x, y, opts = {}) { super(x, y, { ...opts, variant: 'baseball' }); }
        get type() { return 'baseball'; }
        static deserialize(data) { return new Baseball(data.x, data.y, data.options); }
    }, {
        displayName: 'Baseball',
        category: 'balls',
        description: 'Medium-weight ball.',
    });

    // ── Surfaces ─────────────────────────────────
    objectRegistry.register('ramp', Ramp, {
        displayName: 'Ramp',
        category: 'surfaces',
        description: 'Angled surface — redirect rolling objects.',
    });

    objectRegistry.register('conveyor', Conveyor, {
        displayName: 'Conveyor Belt',
        category: 'surfaces',
        description: 'Moving belt that pushes objects along.',
    });

    objectRegistry.register('trampoline', Trampoline, {
        displayName: 'Trampoline',
        category: 'surfaces',
        description: 'Bouncy surface — launches objects skyward.',
    });

    // ── Machines ─────────────────────────────────
    objectRegistry.register('fan', Fan, {
        displayName: 'Fan',
        category: 'machines',
        description: 'Blows wind to push objects away.',
    });

    objectRegistry.register('spring', Spring, {
        displayName: 'Spring',
        category: 'machines',
        description: 'Compressed launcher — flings objects upward.',
    });

    objectRegistry.register('gear', Gear, {
        displayName: 'Gear',
        category: 'machines',
        description: 'Rotating wheel — meshes with adjacent gears.',
    });

    objectRegistry.register('pulley', Pulley, {
        displayName: 'Pulley',
        category: 'machines',
        description: 'Two platforms linked by ropes — one goes up, the other goes down.',
    });

    // ── Triggers / Special ───────────────────────
    objectRegistry.register('domino', Domino, {
        displayName: 'Domino',
        category: 'triggers',
        description: 'Thin tile that topples over — chain reaction!',
    });

    objectRegistry.register('balloon', Balloon, {
        displayName: 'Balloon',
        category: 'triggers',
        description: 'Floats upward — pop with scissors or flame.',
    });

    objectRegistry.register('bucket', Bucket, {
        displayName: 'Bucket',
        category: 'triggers',
        description: 'Goal container — catch objects inside.',
    });

    objectRegistry.register('candle', Candle, {
        displayName: 'Candle',
        category: 'triggers',
        description: 'Flickering flame — burns ropes, pops balloons.',
    });

    objectRegistry.register('rope', Rope, {
        displayName: 'Rope',
        category: 'triggers',
        description: 'Flexible connector — attach objects together.',
    });

    objectRegistry.register('scissors', Scissors, {
        displayName: 'Scissors',
        category: 'triggers',
        description: 'Sharp blades — cut ropes, pop balloons.',
    });

    objectRegistry.register('mouse', Mouse, {
        displayName: 'Mouse',
        category: 'triggers',
        description: 'Walks left and right — adds life to puzzles.',
    });

    console.log(`[ObjectRegistry] Registered ${objectRegistry.getAll().length} object types across ${objectRegistry.getCategories().length} categories.`);
}

export default registerAllObjects;
