/**
 * Pulley — Rope with two platforms over a pivot
 *
 * One side goes up when the other side goes down.
 * Uses Matter.js constraints to link two platforms.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body, Constraint, Composite } = Matter;

const PLATFORM_WIDTH = 60;
const PLATFORM_HEIGHT = 8;
const ROPE_COLOR = '#8B6914';
const PLATFORM_COLOR = '#7B6B5A';
const WHEEL_COLOR = '#888';
const WHEEL_RADIUS = 10;

export default class Pulley extends BaseObject {
    /**
     * @param {number} x - Pivot point x (top center)
     * @param {number} y - Pivot point y
     * @param {object} [options={}]
     * @param {number} [options.ropeLength=150] - Total rope length
     */
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._ropeLength = options.ropeLength || 150;
        const halfRope = this._ropeLength / 2;

        // Pivot wheel (static)
        this._wheel = Bodies.circle(x, y, WHEEL_RADIUS, {
            isStatic: true,
            label: 'pulley-wheel',
            collisionFilter: { category: 0x0002, mask: 0 }, // no collision
        });

        // Left platform
        this._leftPlatform = Bodies.rectangle(
            x - 60, y + halfRope / 2, PLATFORM_WIDTH, PLATFORM_HEIGHT, {
            density: 0.002,
            friction: 0.6,
            label: 'pulley-left',
        }
        );

        // Right platform
        this._rightPlatform = Bodies.rectangle(
            x + 60, y + halfRope / 2, PLATFORM_WIDTH, PLATFORM_HEIGHT, {
            density: 0.002,
            friction: 0.6,
            label: 'pulley-right',
        }
        );

        // Constraints — connect each platform to the pivot point
        this._leftConstraint = Constraint.create({
            bodyA: this._leftPlatform,
            pointB: { x: x - 60, y },
            stiffness: 0.9,
            damping: 0.05,
            length: halfRope / 2,
            label: 'pulley-rope-left',
            render: { strokeStyle: ROPE_COLOR },
        });

        this._rightConstraint = Constraint.create({
            bodyA: this._rightPlatform,
            pointB: { x: x + 60, y },
            stiffness: 0.9,
            damping: 0.05,
            length: halfRope / 2,
            label: 'pulley-rope-right',
            render: { strokeStyle: ROPE_COLOR },
        });
    }

    get type() { return 'pulley'; }

    get bodies() {
        return [this._wheel, this._leftPlatform, this._rightPlatform];
    }

    get constraints() {
        return [this._leftConstraint, this._rightConstraint];
    }

    get bounds() {
        return {
            x: this._x - 100,
            y: this._y - WHEEL_RADIUS,
            width: 200,
            height: this._ropeLength + WHEEL_RADIUS,
        };
    }

    setPosition(x, y) {
        const dx = x - this._x;
        const dy = y - this._y;
        super.setPosition(x, y);

        Body.setPosition(this._wheel, { x, y });
        Body.translate(this._leftPlatform, { x: dx, y: dy });
        Body.translate(this._rightPlatform, { x: dx, y: dy });

        this._leftConstraint.pointB.x += dx;
        this._leftConstraint.pointB.y += dy;
        this._rightConstraint.pointB.x += dx;
        this._rightConstraint.pointB.y += dy;
    }

    draw(ctx) {
        const pivotPos = this._wheel.position;
        const leftPos = this._leftPlatform.position;
        const rightPos = this._rightPlatform.position;

        ctx.save();

        // Ropes
        ctx.strokeStyle = ROPE_COLOR;
        ctx.lineWidth = 2;

        // Left rope
        ctx.beginPath();
        ctx.moveTo(pivotPos.x - 6, pivotPos.y);
        ctx.lineTo(leftPos.x, leftPos.y);
        ctx.stroke();

        // Right rope
        ctx.beginPath();
        ctx.moveTo(pivotPos.x + 6, pivotPos.y);
        ctx.lineTo(rightPos.x, rightPos.y);
        ctx.stroke();

        // Pivot wheel
        ctx.beginPath();
        ctx.arc(pivotPos.x, pivotPos.y, WHEEL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = WHEEL_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Wheel groove
        ctx.beginPath();
        ctx.arc(pivotPos.x, pivotPos.y, WHEEL_RADIUS - 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center axle
        ctx.beginPath();
        ctx.arc(pivotPos.x, pivotPos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#555';
        ctx.fill();

        // Left platform
        this._drawPlatform(ctx, leftPos);

        // Right platform
        this._drawPlatform(ctx, rightPos);

        ctx.restore();
    }

    _drawPlatform(ctx, pos) {
        const hw = PLATFORM_WIDTH / 2;
        const hh = PLATFORM_HEIGHT / 2;

        ctx.fillStyle = PLATFORM_COLOR;
        ctx.fillRect(pos.x - hw, pos.y - hh, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pos.x - hw, pos.y - hh, PLATFORM_WIDTH, PLATFORM_HEIGHT);

        // Rope attachment point
        ctx.fillStyle = ROPE_COLOR;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - hh, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2;
        const top = h * 0.2;

        // Wheel
        ctx.beginPath();
        ctx.arc(cx, top, 5, 0, Math.PI * 2);
        ctx.fillStyle = WHEEL_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ropes
        ctx.strokeStyle = ROPE_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 3, top);
        ctx.lineTo(cx - 10, h * 0.65);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 3, top);
        ctx.lineTo(cx + 10, h * 0.65);
        ctx.stroke();

        // Platforms
        ctx.fillStyle = PLATFORM_COLOR;
        ctx.fillRect(cx - 17, h * 0.65, 14, 3);
        ctx.fillRect(cx + 3, h * 0.65, 14, 3);
    }

    serialize() {
        return {
            ...super.serialize(),
            options: { ...this._options, ropeLength: this._ropeLength },
        };
    }

    static deserialize(data) {
        return new Pulley(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            ropeLength: data.options?.ropeLength || 150,
        });
    }

    dispose() {
        this._wheel = null;
        this._leftPlatform = null;
        this._rightPlatform = null;
        this._leftConstraint = null;
        this._rightConstraint = null;
    }
}
