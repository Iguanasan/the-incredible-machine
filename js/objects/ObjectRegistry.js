/**
 * ObjectRegistry — Catalog of all available game object types.
 *
 * Provides a central factory for creating, listing, and categorizing
 * game objects. Both the toolbox UI and the level deserializer use this.
 *
 * Usage:
 *   import { objectRegistry } from './ObjectRegistry.js';
 *   objectRegistry.register('ball', Ball, { ... });
 *   const ball = objectRegistry.create('ball', 100, 200);
 */

class ObjectRegistry {
    constructor() {
        /** @type {Map<string, { ObjectClass: Function, metadata: object }>} */
        this._registry = new Map();
    }

    /**
     * Register a game object type.
     * @param {string} type - Unique type identifier (e.g., 'ball', 'ramp')
     * @param {Function} ObjectClass - The class (must extend BaseObject)
     * @param {object} metadata - Display info for the toolbox
     * @param {string} metadata.displayName - Human-readable name
     * @param {string} metadata.category - Category for toolbox grouping
     * @param {string} [metadata.description] - Tooltip description
     */
    register(type, ObjectClass, metadata) {
        if (this._registry.has(type)) {
            console.warn(`[ObjectRegistry] Overwriting existing type: ${type}`);
        }
        this._registry.set(type, { ObjectClass, metadata });
    }

    /**
     * Create an instance of a registered object type.
     * @param {string} type
     * @param {number} x
     * @param {number} y
     * @param {object} [options={}]
     * @returns {BaseObject}
     */
    create(type, x, y, options = {}) {
        const entry = this._registry.get(type);
        if (!entry) {
            throw new Error(`[ObjectRegistry] Unknown object type: "${type}"`);
        }
        return new entry.ObjectClass(x, y, options);
    }

    /**
     * Deserialize an object from saved data.
     * @param {object} data - Serialized object data (must include `type`)
     * @returns {BaseObject}
     */
    deserialize(data) {
        const entry = this._registry.get(data.type);
        if (!entry) {
            throw new Error(`[ObjectRegistry] Cannot deserialize unknown type: "${data.type}"`);
        }
        return entry.ObjectClass.deserialize(data);
    }

    /**
     * Get all registered types with their metadata.
     * @returns {Array<{ type: string, metadata: object }>}
     */
    getAll() {
        const result = [];
        for (const [type, { metadata }] of this._registry) {
            result.push({ type, ...metadata });
        }
        return result;
    }

    /**
     * Get registered types filtered by category.
     * @param {string} category
     * @returns {Array<{ type: string, metadata: object }>}
     */
    getByCategory(category) {
        return this.getAll().filter(item => item.category === category);
    }

    /**
     * Get all unique categories.
     * @returns {string[]}
     */
    getCategories() {
        const cats = new Set();
        for (const [, { metadata }] of this._registry) {
            cats.add(metadata.category);
        }
        return [...cats];
    }

    /**
     * Check if a type is registered.
     * @param {string} type
     * @returns {boolean}
     */
    has(type) {
        return this._registry.has(type);
    }
}

/** Singleton registry instance */
export const objectRegistry = new ObjectRegistry();
export default ObjectRegistry;
