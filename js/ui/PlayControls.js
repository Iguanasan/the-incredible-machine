/**
 * PlayControls — Play / Pause / Reset / Speed UI
 *
 * Renders transport-style control buttons into the #play-controls
 * DOM element and emits events on the EventBus.
 */

import { eventBus } from '../EventBus.js';

class PlayControls {
    constructor() {
        /** @type {HTMLElement} */
        this.container = null;

        /** @type {Object<string, HTMLButtonElement>} */
        this.buttons = {};

        /** Current speed multiplier */
        this._speed = 1;

        /** Current mode */
        this._mode = 'MENU';
    }

    /**
     * Initialize Play Controls — build buttons and wire events.
     */
    init() {
        this.container = document.getElementById('play-controls');
        if (!this.container) {
            console.error('[PlayControls] #play-controls element not found');
            return;
        }

        // Clear any placeholder content
        this.container.innerHTML = '';

        // Create buttons
        this._createButton('play', '▶', 'Play');
        this._createButton('pause', '⏸', 'Pause');
        this._createButton('reset', '⏹', 'Reset');
        this._createButton('speed', '1×', 'Speed Toggle');

        // Button click handlers
        this.buttons.play.addEventListener('click', () => this._onPlay());
        this.buttons.pause.addEventListener('click', () => this._onPause());
        this.buttons.reset.addEventListener('click', () => this._onReset());
        this.buttons.speed.addEventListener('click', () => this._onSpeed());

        // Keyboard shortcuts
        this._keyHandler = (e) => {
            // Don't capture keys when typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (this._mode === 'PLAYING') {
                    this._onPause();
                } else if (this._mode === 'EDITING' || this._mode === 'PAUSED' || this._mode === 'SANDBOX') {
                    this._onPlay();
                }
            } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this._onReset();
            }
        };
        document.addEventListener('keydown', this._keyHandler);

        // Listen for mode changes to update button states
        eventBus.on('mode:changed', ({ newMode }) => {
            this._mode = newMode;
            this._updateButtonStates();
        });

        // Initial state
        this._updateButtonStates();

        console.log('[PlayControls] Initialized');
    }

    // ── Private ──────────────────────────────────

    _createButton(name, label, title) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-icon';
        btn.id = `btn-${name}`;
        btn.textContent = label;
        btn.title = title;
        btn.setAttribute('aria-label', title);
        this.container.appendChild(btn);
        this.buttons[name] = btn;
    }

    _onPlay() {
        eventBus.emit('controls:play');
    }

    _onPause() {
        eventBus.emit('controls:pause');
    }

    _onReset() {
        eventBus.emit('controls:reset');
    }

    _onSpeed() {
        this._speed = this._speed === 1 ? 2 : 1;
        this.buttons.speed.textContent = `${this._speed}×`;
        this.buttons.speed.classList.toggle('btn-active', this._speed === 2);
        eventBus.emit('controls:speed', { speed: this._speed });
    }

    _updateButtonStates() {
        const mode = this._mode;

        // Reset all active states
        for (const btn of Object.values(this.buttons)) {
            btn.classList.remove('btn-active', 'btn-pressed');
            btn.disabled = false;
        }

        switch (mode) {
            case 'MENU':
                // Disable all buttons on the menu screen
                for (const btn of Object.values(this.buttons)) {
                    btn.disabled = true;
                }
                break;

            case 'EDITING':
            case 'SANDBOX':
                // Play is enabled, pause/reset grayed out
                this.buttons.pause.disabled = true;
                break;

            case 'PLAYING':
                // Pause enabled, play shows as pressed/active
                this.buttons.play.classList.add('btn-pressed');
                break;

            case 'PAUSED':
                // Both play and pause available
                this.buttons.pause.classList.add('btn-pressed');
                break;

            case 'WON':
                // Only reset is meaningful
                this.buttons.play.disabled = true;
                this.buttons.pause.disabled = true;
                this.buttons.speed.disabled = true;
                break;
        }
    }
}

/** Singleton play controls instance */
export const playControls = new PlayControls();
export default PlayControls;
