/**
 * Domino — Thin standing tile that tips over on impact
 *
 * A tall, thin rectangle with a low-friction base.
 * Satisfying chain reaction when a row of dominoes topple.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body } = Matter;

const DOMINO_WIDTH = 8;
const DOMINO_HEIGHT = 36;
const DOMINO_COLOR = '#f0e6d0';
const DOT_COLOR = '#333';

export default class Domino extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);

        this._body = Bodies.rectangle(x, y, DOMINO_WIDTH, DOMINO_HEIGHT, {
            density: 0.004,
            friction: 0.6,
            frictionStatic: 0.3,
            restitution: 0.15,
            label: 'domino',
            angle: this._angle,
        });
    }

    get type() { return 'domino'; }
    get bodies() { return [this._body]; }

    get bounds() {
        const b = this._body.bounds;
        return { x: b.min.x, y: b.min.y, width: b.max.x - b.min.x, height: b.max.y - b.min.y };
    }

    setPosition(x, y) {
        super.setPosition(x, y);
        Body.setPosition(this._body, { x, y });
    }

    setAngle(angle) {
        super.setAngle(angle);
        Body.setAngle(this._body, angle);
    }

    draw(ctx) {
        const vertices = this._body.vertices;
        const pos = this._body.position;
        const angle = this._body.angle;

        ctx.save();

        // Fill
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = DOMINO_COLOR;
        ctx.fill();

        // Dots (domino pip pattern)
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        ctx.fillStyle = DOT_COLOR;

        // Center divider line
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-DOMINO_WIDTH / 2 + 1, 0);
        ctx.lineTo(DOMINO_WIDTH / 2 - 1, 0);
        ctx.stroke();

        // Top half: 2 dots
        const dotR = 1.5;
        ctx.beginPath();
        ctx.arc(-1.5, -DOMINO_HEIGHT / 4 - 2, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(1.5, -DOMINO_HEIGHT / 4 + 2, dotR, 0, Math.PI * 2);
        ctx.fill();

        // Bottom half: 3 dots
        ctx.beginPath();
        ctx.arc(0, DOMINO_HEIGHT / 4, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-1.5, DOMINO_HEIGHT / 4 - 4, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(1.5, DOMINO_HEIGHT / 4 + 4, dotR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Outline
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const dw = 4;
        const dh = h * 0.6;
        const cx = w / 2;
        const cy = h / 2;
        ctx.fillStyle = DOMINO_COLOR;
        ctx.fillRect(cx - dw / 2, cy - dh / 2, dw, dh);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - dw / 2, cy - dh / 2, dw, dh);
        // Dots
        ctx.fillStyle = DOT_COLOR;
        ctx.beginPath();
        ctx.arc(cx, cy - dh / 4, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy + dh / 4, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    serialize() {
        return super.serialize();
    }

    static deserialize(data) {
        return new Domino(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
        });
    }

    dispose() {
        this._body = null;
    }
}
