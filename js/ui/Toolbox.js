/**
 * Toolbox — Left-side part inventory panel
 *
 * Populates the #toolbox DOM element with available parts grouped by
 * category. Each item shows a canvas icon, name, and quantity.
 * Emits drag-start events for the DragDropManager to pick up.
 */

import { eventBus } from '../EventBus.js';
import { objectRegistry } from '../objects/ObjectRegistry.js';

class Toolbox {
    constructor() {
        /** @type {HTMLElement} */
        this.container = null;

        /** Available parts inventory: { type: count } */
        this._inventory = {};

        /** Whether we're in sandbox mode (infinite parts) */
        this._isSandbox = false;

        /** Whether editing is allowed (disabled during play) */
        this._enabled = true;

        /** Current mode */
        this._mode = 'MENU';

        /** Map of type → DOM element for quick updates */
        this._itemElements = new Map();
    }

    /**
     * Initialize the toolbox panel.
     */
    init() {
        this.container = document.getElementById('toolbox-categories');
        if (!this.container) {
            console.error('[Toolbox] #toolbox-categories element not found');
            return;
        }

        // Listen for mode changes
        eventBus.on('mode:changed', ({ newMode }) => {
            this._mode = newMode;
            this._isSandbox = newMode === 'SANDBOX';
            this._enabled = (newMode === 'EDITING' || newMode === 'SANDBOX');
            this._updateAllItems();
        });

        // Listen for object placed / removed to update counts
        eventBus.on('object:placed', ({ type }) => {
            if (!this._isSandbox && this._inventory[type] !== undefined) {
                this._inventory[type] = Math.max(0, this._inventory[type] - 1);
                this._updateItemCount(type);
            }
        });

        eventBus.on('object:removed', ({ type }) => {
            if (!this._isSandbox && this._inventory[type] !== undefined) {
                this._inventory[type]++;
                this._updateItemCount(type);
            }
        });

        // Listen for level loaded to set inventory
        eventBus.on('level:loaded', (levelData) => {
            this.setInventory(levelData.availableParts || {});
        });

        this._buildCategories();

        console.log('[Toolbox] Initialized');
    }

    /**
     * Set the parts inventory for the current level.
     * @param {Object<string, number>} parts - { type: quantity }
     */
    setInventory(parts) {
        this._inventory = { ...parts };
        this._updateAllItems();
    }

    /**
     * Get remaining count for a type.
     * @param {string} type
     * @returns {number|Infinity}
     */
    getCount(type) {
        if (this._isSandbox) return Infinity;
        return this._inventory[type] || 0;
    }

    // ── Private ──────────────────────────────────

    _buildCategories() {
        this.container.innerHTML = '';
        this._itemElements.clear();

        const categories = objectRegistry.getCategories();

        for (const category of categories) {
            const items = objectRegistry.getByCategory(category);
            if (items.length === 0) continue;

            // Category wrapper
            const catDiv = document.createElement('div');
            catDiv.className = 'toolbox-category';

            // Category title
            const title = document.createElement('div');
            title.className = 'toolbox-category-title';
            title.textContent = category;
            catDiv.appendChild(title);

            // Items
            for (const item of items) {
                const el = this._createItemElement(item);
                catDiv.appendChild(el);
                this._itemElements.set(item.type, el);
            }

            this.container.appendChild(catDiv);
        }
    }

    _createItemElement(item) {
        const div = document.createElement('div');
        div.className = 'toolbox-item';
        div.dataset.type = item.type;

        // Icon canvas
        const iconCanvas = document.createElement('canvas');
        iconCanvas.className = 'toolbox-item-icon';
        iconCanvas.width = 36;
        iconCanvas.height = 36;
        div.appendChild(iconCanvas);

        // Draw icon
        try {
            const tmpObj = objectRegistry.create(item.type, 0, 0);
            const iconCtx = iconCanvas.getContext('2d');
            tmpObj.drawToolboxIcon(iconCtx, 36, 36);
            tmpObj.dispose();
        } catch (e) {
            // Fallback — plain gray square is drawn by BaseObject default
        }

        // Name
        const name = document.createElement('span');
        name.className = 'toolbox-item-name';
        name.textContent = item.displayName || item.type;
        div.appendChild(name);

        // Count badge
        const count = document.createElement('span');
        count.className = 'toolbox-item-count';
        count.dataset.type = item.type;
        count.textContent = '—';
        div.appendChild(count);

        // Drag start via mousedown
        div.addEventListener('mousedown', (e) => {
            if (!this._enabled) return;

            const remaining = this.getCount(item.type);
            if (remaining <= 0) return;

            e.preventDefault();
            eventBus.emit('toolbox:drag-start', {
                type: item.type,
                pageX: e.pageX,
                pageY: e.pageY,
            });
        });

        // Tooltip
        if (item.description) {
            div.title = item.description;
        }

        return div;
    }

    _updateItemCount(type) {
        const el = this._itemElements.get(type);
        if (!el) return;

        const countEl = el.querySelector('.toolbox-item-count');
        if (!countEl) return;

        if (this._isSandbox) {
            countEl.textContent = '∞';
            el.classList.remove('disabled');
        } else {
            const count = this._inventory[type] || 0;
            countEl.textContent = count > 0 ? count : '0';
            el.classList.toggle('disabled', count <= 0);
        }
    }

    _updateAllItems() {
        for (const [type] of this._itemElements) {
            this._updateItemCount(type);
        }

        // Disable all items during play
        if (!this._enabled) {
            for (const [, el] of this._itemElements) {
                el.classList.add('disabled');
            }
        }
    }
}

/** Singleton toolbox instance */
export const toolbox = new Toolbox();
export default Toolbox;
