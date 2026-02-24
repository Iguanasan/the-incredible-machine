/**
 * Trampoline — High-restitution bouncy surface
 *
 * Static surface that bounces objects strongly.
 * Shows a brief stretch animation on impact.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body } = Matter;

const TRAMP_WIDTH = 80;
const TRAMP_HEIGHT = 10;
const FABRIC_COLOR = '#e04040';
const FRAME_COLOR = '#606060';
const LEG_COLOR = '#808080';

export default class Trampoline extends BaseObject {
    /**
     * @param {number} x
     * @param {number} y
     * @param {object} [options={}]
     */
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._width = options.width || TRAMP_WIDTH;
        this._height = TRAMP_HEIGHT;

        this._body = Bodies.rectangle(x, y, this._width, this._height, {
            isStatic: true,
            restitution: 0.95,
            friction: 0.3,
            label: 'trampoline',
            angle: this._angle,
        });

        /** @type {number} animation: stretch amount (0 = none, 1 = max) */
        this._stretch = 0;
    }

    get type() { return 'trampoline'; }

    get bodies() { return [this._body]; }

    get bounds() {
        const b = this._body.bounds;
        return {
            x: b.min.x,
            y: b.min.y,
            width: b.max.x - b.min.x,
            height: b.max.y - b.min.y,
        };
    }

    setPosition(x, y) {
        super.setPosition(x, y);
        Body.setPosition(this._body, { x, y });
    }

    setAngle(angle) {
        super.setAngle(angle);
        Body.setAngle(this._body, angle);
    }

    onCollision(other, pair) {
        // Trigger stretch animation on impact
        this._stretch = 1;
    }

    onBeforeUpdate(engine) {
        // Decay the stretch animation
        if (this._stretch > 0.01) {
            this._stretch *= 0.85;
        } else {
            this._stretch = 0;
        }
    }

    draw(ctx) {
        const pos = this._body.position;
        const angle = this._body.angle;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        const hw = this._width / 2;
        const hh = this._height / 2;
        const legHeight = 18;
        const stretchOffset = this._stretch * 6;

        // Legs
        ctx.strokeStyle = LEG_COLOR;
        ctx.lineWidth = 3;
        // Left leg
        ctx.beginPath();
        ctx.moveTo(-hw + 6, hh);
        ctx.lineTo(-hw + 10, hh + legHeight + stretchOffset);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(hw - 6, hh);
        ctx.lineTo(hw - 10, hh + legHeight + stretchOffset);
        ctx.stroke();

        // Frame bar
        ctx.fillStyle = FRAME_COLOR;
        ctx.fillRect(-hw, hh - 3, this._width, 4);

        // Bouncy fabric (curved when stretched)
        ctx.beginPath();
        if (this._stretch > 0.01) {
            // Curved/stretched fabric
            ctx.moveTo(-hw, -hh);
            ctx.quadraticCurveTo(0, -hh + stretchOffset * 2, hw, -hh);
            ctx.lineTo(hw, hh - 3);
            ctx.lineTo(-hw, hh - 3);
        } else {
            ctx.rect(-hw, -hh, this._width, this._height - 3);
        }
        ctx.closePath();
        ctx.fillStyle = FABRIC_COLOR;
        ctx.fill();

        // Fabric stripes
        ctx.strokeStyle = '#c03030';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        const stripes = 6;
        for (let i = 1; i < stripes; i++) {
            const sx = -hw + (this._width / stripes) * i;
            ctx.beginPath();
            ctx.moveTo(sx, -hh);
            ctx.lineTo(sx, hh - 3);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Outline
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(-hw, -hh, this._width, this._height);
        ctx.stroke();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const hw = w * 0.35;
        const cy = h * 0.4;
        // Fabric
        ctx.fillStyle = FABRIC_COLOR;
        ctx.fillRect(w / 2 - hw, cy - 2, hw * 2, 5);
        // Frame
        ctx.fillStyle = FRAME_COLOR;
        ctx.fillRect(w / 2 - hw, cy + 3, hw * 2, 2);
        // Legs
        ctx.strokeStyle = LEG_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 - hw + 4, cy + 5);
        ctx.lineTo(w / 2 - hw + 6, cy + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 2 + hw - 4, cy + 5);
        ctx.lineTo(w / 2 + hw - 6, cy + 14);
        ctx.stroke();
    }

    serialize() {
        return {
            ...super.serialize(),
            options: { ...this._options, width: this._width },
        };
    }

    static deserialize(data) {
        return new Trampoline(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            width: data.options?.width || TRAMP_WIDTH,
        });
    }

    dispose() {
        this._body = null;
    }
}
