/**
 * LevelSelect — Puzzle browser / level selection screen
 *
 * Renders a grid of level cards into #level-select-overlay showing
 * level number, name, difficulty stars, lock/unlock state, and completion.
 */

import { eventBus } from '../EventBus.js';
import { levelManager } from '../levels/LevelManager.js';
import { setMode, AppMode } from '../main.js';

class LevelSelect {
    constructor() {
        /** @type {HTMLElement} */
        this.container = null;

        /** @type {HTMLElement} */
        this.overlayContainer = null;
    }

    /**
     * Initialize the level select screen.
     */
    init() {
        this.container = document.getElementById('level-select-overlay');
        this.overlayContainer = document.getElementById('overlay-container');

        if (!this.container) {
            console.error('[LevelSelect] #level-select-overlay not found');
            return;
        }

        // Show level select when returning to menu
        eventBus.on('overlay:menu', () => {
            this.show();
        });

        // Also show on app start (menu mode)
        eventBus.on('mode:changed', ({ newMode }) => {
            if (newMode === 'MENU') {
                this.show();
            } else {
                this.hide();
            }
        });

        console.log('[LevelSelect] Initialized');
    }

    /**
     * Show the level select screen.
     */
    async show() {
        const levels = await levelManager.getLevelList();
        this._render(levels);

        this.container.classList.remove('hidden');
        this.overlayContainer.classList.remove('hidden');
    }

    /**
     * Hide the level select screen.
     */
    hide() {
        this.container.classList.add('hidden');
        this.overlayContainer.classList.add('hidden');
    }

    // ── Private ──────────────────────────────────

    _render(levels) {
        this.container.innerHTML = '';

        // Title
        const title = document.createElement('h2');
        title.textContent = '🎯 Choose a Puzzle';
        this.container.appendChild(title);

        // Subtitle
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Build a Rube Goldberg machine to solve each puzzle!';
        subtitle.style.marginBottom = '20px';
        this.container.appendChild(subtitle);

        // Level grid
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
            max-height: 340px;
            overflow-y: auto;
            padding: 4px;
        `;

        for (const level of levels) {
            grid.appendChild(this._createLevelCard(level));
        }

        this.container.appendChild(grid);

        // Sandbox button
        const sandboxBtn = document.createElement('button');
        sandboxBtn.className = 'btn btn-primary';
        sandboxBtn.textContent = '🔧 Sandbox Mode';
        sandboxBtn.style.cssText = 'font-size: 15px; padding: 10px 24px;';
        sandboxBtn.addEventListener('click', () => {
            this.hide();
            setMode(AppMode.SANDBOX);
        });
        this.container.appendChild(sandboxBtn);
    }

    _createLevelCard(level) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: ${level.unlocked ? '#f8f8f0' : '#d0d0d0'};
            border: 3px solid ${level.completed ? '#4caf50' : level.unlocked ? '#6060a0' : '#808080'};
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            cursor: ${level.unlocked ? 'pointer' : 'not-allowed'};
            opacity: ${level.unlocked ? '1' : '0.6'};
            transition: transform 0.1s, box-shadow 0.1s;
            position: relative;
        `;

        // Hover effect for unlocked levels
        if (level.unlocked) {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '3px 3px 0 rgba(0,0,0,0.2)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
            });
        }

        // Level number
        const num = document.createElement('div');
        num.style.cssText = 'font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #404040;';
        num.textContent = level.id.replace('level-', '#');
        card.appendChild(num);

        // Level name
        const name = document.createElement('div');
        name.style.cssText = 'font-size: 13px; font-weight: bold; margin: 4px 0; color: #303030;';
        name.textContent = level.name;
        card.appendChild(name);

        // Difficulty stars
        const stars = document.createElement('div');
        stars.style.cssText = 'font-size: 12px; margin: 4px 0;';
        stars.textContent = '⭐'.repeat(level.difficulty) + '☆'.repeat(Math.max(0, 5 - level.difficulty));
        card.appendChild(stars);

        // Status indicator
        if (level.completed) {
            const check = document.createElement('div');
            check.style.cssText = `
                position: absolute; top: -6px; right: -6px;
                width: 22px; height: 22px; border-radius: 50%;
                background: #4caf50; color: white; font-size: 14px;
                display: flex; align-items: center; justify-content: center;
                border: 2px solid white;
            `;
            check.textContent = '✓';
            card.appendChild(check);
        } else if (!level.unlocked) {
            const lock = document.createElement('div');
            lock.style.cssText = 'font-size: 20px; margin-top: 4px;';
            lock.textContent = '🔒';
            card.appendChild(lock);
        }

        // Click handler
        if (level.unlocked) {
            card.addEventListener('click', async () => {
                this.hide();
                await levelManager.loadLevel(level.id);
                setMode(AppMode.EDITING);
            });
        }

        return card;
    }
}

/** Singleton level select instance */
export const levelSelect = new LevelSelect();
export default LevelSelect;
