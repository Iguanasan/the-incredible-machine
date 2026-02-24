/**
 * Scissors — Sharp cutting tool that severs ropes and pops balloons
 *
 * Static object that acts as a hazard trigger.
 * Balloons and ropes that touch scissors are destroyed/severed.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body } = Matter;

const SCISSORS_COLOR = '#c0c0c0';
const HANDLE_COLOR = '#cc4444';
const BLADE_COLOR = '#d0d0d0';

export default class Scissors extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);

        // Use a simple rectangle body for physics
        this._body = Bodies.rectangle(x, y, 30, 8, {
            isStatic: true,
            label: 'scissors',
            angle: this._angle,
        });
    }

    get type() { return 'scissors'; }
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
        const pos = this._body.position;
        const angle = this._body.angle;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        // Top blade
        ctx.beginPath();
        ctx.moveTo(-15, -1);
        ctx.lineTo(12, -4);
        ctx.lineTo(15, -2);
        ctx.lineTo(12, 0);
        ctx.closePath();
        ctx.fillStyle = BLADE_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Bottom blade
        ctx.beginPath();
        ctx.moveTo(-15, 1);
        ctx.lineTo(12, 4);
        ctx.lineTo(15, 2);
        ctx.lineTo(12, 0);
        ctx.closePath();
        ctx.fillStyle = SCISSORS_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pivot screw
        ctx.beginPath();
        ctx.arc(-2, 0, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#777';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Top handle
        ctx.beginPath();
        ctx.ellipse(-22, -3, 8, 5, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = HANDLE_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#993333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Bottom handle
        ctx.beginPath();
        ctx.ellipse(-22, 3, 8, 5, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = HANDLE_COLOR;
        ctx.fill();
        ctx.stroke();

        // Handle holes
        ctx.beginPath();
        ctx.ellipse(-23, -3, 4, 2.5, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#e8e0d0';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-23, 3, 4, 2.5, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.3);

        // Blades - simplified
        ctx.strokeStyle = SCISSORS_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, -3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 3);
        ctx.stroke();

        // Handles
        ctx.strokeStyle = HANDLE_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(-11, -2, 4, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-11, 2, 4, 3, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    serialize() {
        return super.serialize();
    }

    static deserialize(data) {
        return new Scissors(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
        });
    }

    dispose() {
        this._body = null;
    }
}
