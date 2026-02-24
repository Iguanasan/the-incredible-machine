/**
 * Ramp — Angled surface for redirecting objects
 *
 * A static sloped surface that objects can roll or slide down.
 * Can be rotated during edit mode to change the angle.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body } = Matter;

const RAMP_WIDTH = 120;
const RAMP_HEIGHT = 12;
const RAMP_COLOR = '#8B7355';
const RAMP_EDGE = '#6b5335';

export default class Ramp extends BaseObject {
    /**
     * @param {number} x - Center x
     * @param {number} y - Center y
     * @param {object} [options={}]
     * @param {number} [options.width=120] - Ramp width
     */
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._width = options.width || RAMP_WIDTH;
        this._height = RAMP_HEIGHT;

        this._body = Bodies.rectangle(x, y, this._width, this._height, {
            isStatic: true,
            friction: 0.5,
            restitution: 0.1,
            angle: this._angle,
            label: 'ramp',
        });
    }

    get type() { return 'ramp'; }

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

    draw(ctx) {
        const vertices = this._body.vertices;

        ctx.save();

        // Fill
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = RAMP_COLOR;
        ctx.fill();

        // Wood grain lines
        const pos = this._body.position;
        const angle = this._body.angle;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        ctx.strokeStyle = RAMP_EDGE;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.4;
        const grainSpacing = 8;
        for (let gx = -this._width / 2 + grainSpacing; gx < this._width / 2; gx += grainSpacing) {
            ctx.beginPath();
            ctx.moveTo(gx, -this._height / 2);
            ctx.lineTo(gx, this._height / 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // Outline
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = RAMP_EDGE;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-0.2);
        const rw = w * 0.7;
        const rh = 4;
        ctx.fillStyle = RAMP_COLOR;
        ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
        ctx.strokeStyle = RAMP_EDGE;
        ctx.lineWidth = 1;
        ctx.strokeRect(-rw / 2, -rh / 2, rw, rh);
        ctx.restore();
    }

    serialize() {
        return {
            ...super.serialize(),
            options: { ...this._options, width: this._width },
        };
    }

    static deserialize(data) {
        return new Ramp(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            width: data.options?.width || RAMP_WIDTH,
        });
    }

    dispose() {
        this._body = null;
    }
}
