/**
 * LevelManager — Load, validate, track, and serialize puzzle levels
 *
 * Loads level JSON from js/levels/puzzles/, validates structure,
 * tracks player progress in localStorage, and handles level sequencing.
 */

import { eventBus } from '../EventBus.js';

/** All available level IDs (linear progression order) */
const LEVEL_ORDER = [
    'level-01', 'level-02', 'level-03', 'level-04', 'level-05',
];

/** localStorage key for progress */
const STORAGE_KEY = 'tim-progress';

class LevelManager {
    constructor() {
        /** @type {object|null} Current loaded level data */
        this._currentLevel = null;

        /** @type {Map<string, object>} Cache of loaded levels */
        this._levelCache = new Map();

        /** @type {Set<string>} Completed level IDs */
        this._completedLevels = new Set();
    }

    /**
     * Initialize — load saved progress from localStorage.
     */
    init() {
        this._loadProgress();

        // Listen for goal:reached to mark level complete
        eventBus.on('goal:reached', () => {
            if (this._currentLevel) {
                this.markComplete(this._currentLevel.id);
            }
        });

        console.log('[LevelManager] Initialized');
    }

    /**
     * Load a level by ID. Fetches JSON, validates, caches, and emits 'level:loaded'.
     * @param {string} id - Level ID (e.g. 'level-01')
     * @returns {Promise<object>} Level data
     */
    async loadLevel(id) {
        // Check cache first
        if (this._levelCache.has(id)) {
            const data = this._levelCache.get(id);
            this._currentLevel = data;
            eventBus.emit('level:loaded', data);
            return data;
        }

        try {
            const url = `/js/levels/puzzles/${id}.json`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const data = await resp.json();
            this._validate(data);

            this._levelCache.set(id, data);
            this._currentLevel = data;

            eventBus.emit('level:loaded', data);
            console.log(`[LevelManager] Loaded: ${data.name}`);
            return data;
        } catch (e) {
            console.error(`[LevelManager] Failed to load level "${id}":`, e);
            throw e;
        }
    }

    /**
     * Get the current loaded level.
     * @returns {object|null}
     */
    getCurrentLevel() {
        return this._currentLevel;
    }

    /**
     * Get the next level after the current one (or null if last).
     * @returns {string|null} Level ID
     */
    getNextLevel() {
        if (!this._currentLevel) return LEVEL_ORDER[0] || null;
        const idx = LEVEL_ORDER.indexOf(this._currentLevel.id);
        if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null;
        return LEVEL_ORDER[idx + 1];
    }

    /**
     * Check if a level is completed.
     * @param {string} id
     * @returns {boolean}
     */
    isLevelCompleted(id) {
        return this._completedLevels.has(id);
    }

    /**
     * Check if a level is unlocked (first level always unlocked, rest require previous completion).
     * @param {string} id
     * @returns {boolean}
     */
    isLevelUnlocked(id) {
        const idx = LEVEL_ORDER.indexOf(id);
        if (idx <= 0) return true; // First level always unlocked
        // Unlocked if previous level is completed
        return this.isLevelCompleted(LEVEL_ORDER[idx - 1]);
    }

    /**
     * Mark a level as completed and persist.
     * @param {string} id
     */
    markComplete(id) {
        this._completedLevels.add(id);
        this._saveProgress();
        console.log(`[LevelManager] Completed: ${id}`);
    }

    /**
     * Get metadata for all levels (for level select screen).
     * @returns {Promise<Array<{ id, name, description, difficulty, unlocked, completed }>>}
     */
    async getLevelList() {
        const list = [];

        for (const id of LEVEL_ORDER) {
            // Try to load level data for metadata
            let data = this._levelCache.get(id);
            if (!data) {
                try {
                    const url = `/js/levels/puzzles/${id}.json`;
                    const resp = await fetch(url);
                    if (resp.ok) {
                        data = await resp.json();
                        this._levelCache.set(id, data);
                    }
                } catch (e) {
                    // Skip levels that can't be loaded
                    continue;
                }
            }

            if (data) {
                list.push({
                    id: data.id,
                    name: data.name,
                    description: data.description || '',
                    difficulty: data.difficulty || 1,
                    unlocked: this.isLevelUnlocked(id),
                    completed: this.isLevelCompleted(id),
                });
            }
        }

        return list;
    }

    /**
     * Get level order list.
     * @returns {string[]}
     */
    getLevelOrder() {
        return [...LEVEL_ORDER];
    }

    // ── Private ──────────────────────────────────

    _validate(data) {
        const required = ['id', 'name', 'goal', 'fixedObjects', 'availableParts'];
        for (const field of required) {
            if (!(field in data)) {
                throw new Error(`[LevelManager] Level missing required field: "${field}"`);
            }
        }

        if (!data.goal.type) {
            throw new Error('[LevelManager] Level goal must have a "type" field');
        }

        if (!Array.isArray(data.fixedObjects)) {
            throw new Error('[LevelManager] fixedObjects must be an array');
        }

        if (typeof data.availableParts !== 'object') {
            throw new Error('[LevelManager] availableParts must be an object');
        }
    }

    _loadProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                    this._completedLevels = new Set(arr);
                }
            }
        } catch (e) {
            console.warn('[LevelManager] Could not load progress:', e);
        }
    }

    _saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...this._completedLevels]));
        } catch (e) {
            console.warn('[LevelManager] Could not save progress:', e);
        }
    }
}

/** Singleton level manager instance */
export const levelManager = new LevelManager();
export default LevelManager;
