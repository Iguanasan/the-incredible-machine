/**
 * Balloon — Buoyant floating object
 *
 * Rises upward due to negative gravity effect.
 * Can be attached to other objects via ropes to lift them.
 * Pops on contact with sharp objects (scissors, candle flame).
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';
import { eventBus } from '../EventBus.js';

const { Bodies, Body } = Matter;

const BALLOON_RADIUS = 18;
const BUOYANCY_FORCE = -0.0015;

const COLORS = ['#e04040', '#4080e0', '#40c040', '#e0c040', '#d060d0'];

export default class Balloon extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._radius = options.radius || BALLOON_RADIUS;
        this._colorIndex = options.colorIndex ?? Math.floor(Math.random() * COLORS.length);
        this._color = COLORS[this._colorIndex];
        this._popped = false;
        this._bobPhase = Math.random() * Math.PI * 2;

        this._body = Bodies.circle(x, y, this._radius, {
            density: 0.0003,
            friction: 0.1,
            frictionAir: 0.04,
            restitution: 0.5,
            label: 'balloon',
        });
    }

    get type() { return 'balloon'; }
    get bodies() { return this._popped ? [] : [this._body]; }

    get bounds() {
        if (this._popped) return { x: 0, y: 0, width: 0, height: 0 };
        const pos = this._body.position;
        const r = this._radius;
        return { x: pos.x - r, y: pos.y - r - 8, width: r * 2, height: r * 2 + 20 };
    }

    setPosition(x, y) {
        super.setPosition(x, y);
        if (!this._popped) Body.setPosition(this._body, { x, y });
    }

    setAngle(angle) {
        super.setAngle(angle);
        if (!this._popped) Body.setAngle(this._body, angle);
    }

    /** Apply upward buoyancy force each frame. */
    onBeforeUpdate(engine) {
        if (this._popped) return;

        this._bobPhase += 0.03;

        // Buoyancy — upward force
        Body.applyForce(this._body, this._body.position, {
            x: Math.sin(this._bobPhase) * 0.00005,
            y: BUOYANCY_FORCE * this._body.mass * 20,
        });
    }

    onCollision(other, pair) {
        if (this._popped) return;

        // Pop on contact with scissors or candle
        if (other.type === 'scissors' || other.type === 'candle') {
            this.pop();
        }
    }

    pop() {
        if (this._popped) return;
        this._popped = true;
        eventBus.emit('balloon:popped', { balloon: this });
    }

    get isPopped() {
        return this._popped;
    }

    draw(ctx) {
        if (this._popped) return;

        const pos = this._body.position;
        const r = this._radius;

        ctx.save();
        ctx.translate(pos.x, pos.y);

        // Balloon body (oval shape)
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this._color;
        ctx.fill();

        // Shine highlight
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.25, r * 0.35, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();

        // Outline
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 1.2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Knot
        ctx.beginPath();
        ctx.moveTo(-2, r * 1.2);
        ctx.lineTo(0, r * 1.2 + 4);
        ctx.lineTo(2, r * 1.2);
        ctx.fillStyle = this._color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // String
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, r * 1.2 + 4);
        const stringLen = 25;
        // Curvy string
        ctx.quadraticCurveTo(-6, r * 1.2 + stringLen / 2, 2, r * 1.2 + stringLen);
        ctx.stroke();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2;
        const cy = h * 0.4;
        const r = Math.min(w, h) * 0.25;

        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this._color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // String
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 1.2 + 2);
        ctx.lineTo(cx, h * 0.85);
        ctx.stroke();
    }

    serialize() {
        return {
            ...super.serialize(),
            options: { ...this._options, colorIndex: this._colorIndex },
        };
    }

    static deserialize(data) {
        return new Balloon(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            colorIndex: data.options?.colorIndex,
        });
    }

    dispose() {
        this._body = null;
    }
}
