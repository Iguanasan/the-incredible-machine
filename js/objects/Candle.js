/**
 * Candle — Fire source that pops balloons and burns ropes
 *
 * Burns with an animated flickering flame.
 * Objects touching the flame area trigger interactions.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body } = Matter;

const CANDLE_WIDTH = 12;
const CANDLE_HEIGHT = 30;
const WAX_COLOR = '#f0e8d0';
const FLAME_COLORS = ['#ff4400', '#ff8800', '#ffcc00', '#ffee66'];

export default class Candle extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);

        // Candle body (solid wax stick)
        this._body = Bodies.rectangle(x, y, CANDLE_WIDTH, CANDLE_HEIGHT, {
            isStatic: true,
            label: 'candle',
        });

        // Flame sensor (above the candle)
        this._flameSensor = Bodies.circle(x, y - CANDLE_HEIGHT / 2 - 10, 10, {
            isStatic: true,
            isSensor: true,
            label: 'candle-flame',
        });

        /** @type {number} animation phase */
        this._flickerPhase = Math.random() * Math.PI * 2;
        this._isLit = true;
    }

    get type() { return 'candle'; }
    get bodies() { return [this._body, this._flameSensor]; }

    get bounds() {
        const pos = this._body.position;
        return {
            x: pos.x - CANDLE_WIDTH / 2,
            y: pos.y - CANDLE_HEIGHT / 2 - 25,
            width: CANDLE_WIDTH,
            height: CANDLE_HEIGHT + 25,
        };
    }

    setPosition(x, y) {
        super.setPosition(x, y);
        Body.setPosition(this._body, { x, y });
        Body.setPosition(this._flameSensor, { x, y: y - CANDLE_HEIGHT / 2 - 10 });
    }

    setAngle(angle) {
        super.setAngle(0); // candle stays upright
    }

    onBeforeUpdate() {
        this._flickerPhase += 0.15;
    }

    draw(ctx) {
        const pos = this._body.position;

        ctx.save();
        ctx.translate(pos.x, pos.y);

        const hw = CANDLE_WIDTH / 2;
        const hh = CANDLE_HEIGHT / 2;

        // Candle body
        ctx.fillStyle = WAX_COLOR;
        ctx.fillRect(-hw, -hh, CANDLE_WIDTH, CANDLE_HEIGHT);

        // Wax drips on the side
        ctx.fillStyle = '#e8dcc0';
        ctx.beginPath();
        ctx.ellipse(-hw + 1, -hh + 8, 3, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(hw - 2, -hh + 14, 2, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Wick
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -hh);
        ctx.lineTo(0, -hh - 6);
        ctx.stroke();

        // Flame (animated)
        if (this._isLit) {
            const flicker = Math.sin(this._flickerPhase) * 2;
            const flicker2 = Math.cos(this._flickerPhase * 1.3) * 1.5;

            // Outer flame (red-orange glow)
            ctx.beginPath();
            ctx.ellipse(
                flicker2 * 0.5, -hh - 15 + flicker * 0.3,
                6 + flicker2 * 0.5, 12 + flicker,
                0, 0, Math.PI * 2
            );
            ctx.fillStyle = FLAME_COLORS[0];
            ctx.globalAlpha = 0.4;
            ctx.fill();

            // Middle flame (orange)
            ctx.beginPath();
            ctx.ellipse(
                flicker2 * 0.3, -hh - 14 + flicker * 0.2,
                4 + flicker2 * 0.3, 9 + flicker * 0.7,
                0, 0, Math.PI * 2
            );
            ctx.fillStyle = FLAME_COLORS[1];
            ctx.globalAlpha = 0.6;
            ctx.fill();

            // Inner flame (yellow)
            ctx.beginPath();
            ctx.ellipse(
                0, -hh - 12,
                3, 7 + flicker * 0.5,
                0, 0, Math.PI * 2
            );
            ctx.fillStyle = FLAME_COLORS[2];
            ctx.globalAlpha = 0.8;
            ctx.fill();

            // Bright core
            ctx.beginPath();
            ctx.ellipse(0, -hh - 9, 1.5, 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = FLAME_COLORS[3];
            ctx.globalAlpha = 1;
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Outline
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(-hw, -hh, CANDLE_WIDTH, CANDLE_HEIGHT);

        // Base / holder
        ctx.fillStyle = '#888';
        ctx.fillRect(-hw - 3, hh - 3, CANDLE_WIDTH + 6, 5);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(-hw - 3, hh - 3, CANDLE_WIDTH + 6, 5);

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2;
        const candleH = h * 0.4;
        const candleW = 5;
        const cy = h * 0.55;

        // Candle
        ctx.fillStyle = WAX_COLOR;
        ctx.fillRect(cx - candleW / 2, cy - candleH / 2, candleW, candleH);

        // Flame
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.ellipse(cx, cy - candleH / 2 - 5, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base
        ctx.fillStyle = '#888';
        ctx.fillRect(cx - candleW / 2 - 2, cy + candleH / 2 - 1, candleW + 4, 3);
    }

    serialize() {
        return super.serialize();
    }

    static deserialize(data) {
        return new Candle(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
        });
    }

    dispose() {
        this._body = null;
        this._flameSensor = null;
    }
}
