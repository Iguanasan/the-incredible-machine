/**
 * Ball — Simple physics ball (bowling ball, tennis ball, baseball)
 *
 * Pure physics object — falls under gravity, bounces, rolls.
 * Different variants have different mass, size, and restitution.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body } = Matter;

/** Ball variant presets */
const VARIANTS = {
    bowling: {
        radius: 18,
        density: 0.008,
        restitution: 0.3,
        friction: 0.4,
        color: '#1a1a2e',
        highlight: '#3a3a5e',
        label: 'Bowling Ball',
    },
    tennis: {
        radius: 12,
        density: 0.002,
        restitution: 0.75,
        friction: 0.5,
        color: '#c8e640',
        highlight: '#e0f870',
        label: 'Tennis Ball',
    },
    baseball: {
        radius: 14,
        density: 0.005,
        restitution: 0.45,
        friction: 0.5,
        color: '#f0f0e0',
        highlight: '#ffffff',
        label: 'Baseball',
    },
};

export default class Ball extends BaseObject {
    /**
     * @param {number} x
     * @param {number} y
     * @param {object} [options={}]
     * @param {string} [options.variant='bowling'] - 'bowling', 'tennis', or 'baseball'
     */
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._variant = options.variant || 'bowling';
        const preset = VARIANTS[this._variant] || VARIANTS.bowling;

        this._radius = preset.radius;
        this._color = preset.color;
        this._highlight = preset.highlight;

        this._body = Bodies.circle(x, y, this._radius, {
            density: preset.density,
            restitution: preset.restitution,
            friction: preset.friction,
            frictionAir: 0.001,
            label: `ball-${this._variant}`,
        });

        if (this._angle) {
            Body.setAngle(this._body, this._angle);
        }
    }

    get type() { return 'ball'; }

    get bodies() { return [this._body]; }

    get bounds() {
        const pos = this._body.position;
        const r = this._radius;
        return { x: pos.x - r, y: pos.y - r, width: r * 2, height: r * 2 };
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

        // Main ball fill
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, 0, Math.PI * 2);
        ctx.fillStyle = this._color;
        ctx.fill();

        // Highlight / shine
        ctx.beginPath();
        ctx.arc(-this._radius * 0.25, -this._radius * 0.25, this._radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = this._highlight;
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Outline
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Variant-specific details
        if (this._variant === 'bowling') {
            // Three finger holes
            ctx.fillStyle = '#333';
            for (const [dx, dy] of [[0, -6], [-4, -2], [4, -2]]) {
                ctx.beginPath();
                ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this._variant === 'baseball') {
            // Stitching lines
            ctx.strokeStyle = '#cc3333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, this._radius * 0.7, -0.8, 0.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, this._radius * 0.7, Math.PI - 0.8, Math.PI + 0.8);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const r = Math.min(w, h) * 0.35;
        const cx = w / 2;
        const cy = h / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = this._color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    serialize() {
        return {
            ...super.serialize(),
            options: { ...this._options, variant: this._variant },
        };
    }

    static deserialize(data) {
        return new Ball(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            variant: data.options?.variant || 'bowling',
        });
    }

    dispose() {
        // Body will be removed by PhysicsEngine.removeObject()
        this._body = null;
    }
}

/** Export variants for registry metadata */
Ball.VARIANTS = VARIANTS;
