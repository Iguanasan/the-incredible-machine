/**
 * EditorPanel — Sandbox / level editor controls
 *
 * Provides save/load level, set goal, set available parts,
 * and test functionality. Only visible in SANDBOX mode.
 */

import { eventBus } from '../EventBus.js';
import { objectRegistry } from '../objects/ObjectRegistry.js';
import { dragDropManager } from './DragDropManager.js';
import { setMode, AppMode } from '../main.js';

class EditorPanel {
    constructor() {
        /** @type {HTMLElement} */
        this.container = null;

        /** Current mode */
        this._mode = 'MENU';

        /** Whether the panel is built */
        this._built = false;
    }

    /**
     * Initialize the editor panel.
     */
    init() {
        this.container = document.getElementById('editor-overlay');

        if (!this.container) {
            console.error('[EditorPanel] #editor-overlay not found');
            return;
        }

        // Show/hide based on mode
        eventBus.on('mode:changed', ({ newMode }) => {
            this._mode = newMode;
            if (newMode === 'SANDBOX') {
                this._build();
                this._show();
            } else {
                this._hide();
            }
        });

        console.log('[EditorPanel] Initialized');
    }

    // ── Private ──────────────────────────────────

    _build() {
        if (this._built) return;
        this._built = true;

        this.container.innerHTML = '';
        this.container.style.cssText = `
            position: fixed;
            bottom: 16px;
            right: 16px;
            z-index: 50;
            background: rgba(96, 96, 160, 0.95);
            border: 3px solid #404040;
            border-radius: 8px;
            padding: 16px;
            min-width: 240px;
            color: #f0f0f0;
            font-size: 13px;
            box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
        `;

        // Title
        const title = document.createElement('h3');
        title.textContent = '🔧 Editor';
        title.style.cssText = 'margin: 0 0 12px; font-family: Georgia, serif; font-size: 16px; color: #ffd700;';
        this.container.appendChild(title);

        // Save Level
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = '💾 Save Level';
        saveBtn.style.cssText = 'width: 100%; margin-bottom: 8px;';
        saveBtn.addEventListener('click', () => this._saveLevel());
        this.container.appendChild(saveBtn);

        // Load Level
        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn btn-primary';
        loadBtn.textContent = '📂 Load Level';
        loadBtn.style.cssText = 'width: 100%; margin-bottom: 8px;';
        loadBtn.addEventListener('click', () => this._loadLevel());
        this.container.appendChild(loadBtn);

        // Hidden file input for loading
        this._fileInput = document.createElement('input');
        this._fileInput.type = 'file';
        this._fileInput.accept = '.json';
        this._fileInput.style.display = 'none';
        this._fileInput.addEventListener('change', (e) => this._onFileSelected(e));
        this.container.appendChild(this._fileInput);

        // Separator
        this.container.appendChild(this._makeSep());

        // Goal type
        const goalLabel = document.createElement('label');
        goalLabel.textContent = 'Goal Type:';
        goalLabel.style.cssText = 'display: block; margin-bottom: 4px; font-weight: bold;';
        this.container.appendChild(goalLabel);

        this._goalSelect = document.createElement('select');
        this._goalSelect.style.cssText = 'width: 100%; padding: 4px; margin-bottom: 8px; border-radius: 4px; border: 1px solid #404040;';
        const goalTypes = [
            'object_in_zone',
            'pop_all_balloons',
            'chain_complete',
            'mouse_in_zone',
            'custom',
        ];
        for (const gt of goalTypes) {
            const opt = document.createElement('option');
            opt.value = gt;
            opt.textContent = gt.replace(/_/g, ' ');
            this._goalSelect.appendChild(opt);
        }
        this.container.appendChild(this._goalSelect);

        this.container.appendChild(this._makeSep());

        // Test button
        const testBtn = document.createElement('button');
        testBtn.className = 'btn btn-success';
        testBtn.textContent = '▶ Test Puzzle';
        testBtn.style.cssText = 'width: 100%; margin-bottom: 8px;';
        testBtn.addEventListener('click', () => {
            eventBus.emit('controls:play');
        });
        this.container.appendChild(testBtn);

        // Back to menu
        const menuBtn = document.createElement('button');
        menuBtn.className = 'btn btn-primary';
        menuBtn.textContent = '📋 Back to Menu';
        menuBtn.style.cssText = 'width: 100%;';
        menuBtn.addEventListener('click', () => {
            eventBus.emit('overlay:menu');
        });
        this.container.appendChild(menuBtn);
    }

    _makeSep() {
        const hr = document.createElement('hr');
        hr.style.cssText = 'border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 8px 0;';
        return hr;
    }

    _show() {
        this.container.classList.remove('hidden');
        // Editor panel floats independently (not in overlay-container)
        this.container.style.display = 'block';
    }

    _hide() {
        this.container.classList.add('hidden');
        this.container.style.display = 'none';
    }

    _saveLevel() {
        const objects = dragDropManager.getObjects();
        const fixedObjects = [];
        const placedObjects = [];

        for (const obj of objects) {
            const data = obj.serialize();
            if (obj.isFixed) {
                fixedObjects.push(data);
            } else {
                placedObjects.push(data);
            }
        }

        const levelData = {
            id: `custom-${Date.now()}`,
            name: 'Custom Level',
            description: 'A custom puzzle created in the editor',
            difficulty: 1,
            goal: {
                type: this._goalSelect ? this._goalSelect.value : 'object_in_zone',
                targetType: 'ball',
                zoneId: 'bucket-goal',
            },
            fixedObjects,
            availableParts: this._inferAvailableParts(),
            hints: [],
        };

        // Download as JSON
        const blob = new Blob([JSON.stringify(levelData, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${levelData.id}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('[EditorPanel] Level saved');
    }

    _loadLevel() {
        this._fileInput.click();
    }

    _onFileSelected(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                this._applyLoadedLevel(data);
                console.log('[EditorPanel] Level loaded:', data.name);
            } catch (err) {
                console.error('[EditorPanel] Failed to parse level JSON:', err);
            }
        };
        reader.readAsText(file);

        // Reset input so same file can be selected again
        this._fileInput.value = '';
    }

    _applyLoadedLevel(data) {
        // Create fixed objects from level data
        const objects = [];

        if (data.fixedObjects) {
            for (const objData of data.fixedObjects) {
                try {
                    const obj = objectRegistry.create(objData.type, objData.x, objData.y, {
                        angle: objData.angle,
                        isFixed: true,
                    });
                    if (objData.id) obj._id = objData.id; // Preserve goal IDs
                    objects.push(obj);
                } catch (err) {
                    console.warn(`[EditorPanel] Could not create object: ${objData.type}`, err);
                }
            }
        }

        dragDropManager.setObjects(objects);

        // Emit level loaded for toolbox
        eventBus.emit('level:loaded', data);
    }

    _inferAvailableParts() {
        // In sandbox mode, list all known types with generous quantities
        const parts = {};
        const allTypes = objectRegistry.getAll();
        for (const { type } of allTypes) {
            parts[type] = 10;
        }
        return parts;
    }
}

/** Singleton editor panel instance */
export const editorPanel = new EditorPanel();
export default EditorPanel;
