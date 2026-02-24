/**
 * Rope — Flexible connector between two points
 *
 * Connects two objects or an object to a fixed point.
 * Can be burned by candle flame (severs the constraint).
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';
import { eventBus } from '../EventBus.js';

const { Bodies, Body, Constraint } = Matter;

const ROPE_COLOR = '#8B6914';
const SEGMENTS = 6;
const SEGMENT_RADIUS = 3;

export default class Rope extends BaseObject {
    /**
     * @param {number} x - Start anchor x
     * @param {number} y - Start anchor y
     * @param {object} [options={}]
     * @param {number} [options.length=100] - Rope length
     * @param {{x:number, y:number}} [options.endPoint] - End anchor point (default: straight down)
     */
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._length = options.length || 100;
        this._endPoint = options.endPoint || { x, y: y + this._length };
        this._severed = false;

        this._segments = [];
        this._constraints = [];

        // Build rope as chain of small circle segments
        const segLength = this._length / SEGMENTS;
        const dx = (this._endPoint.x - x) / SEGMENTS;
        const dy = (this._endPoint.y - y) / SEGMENTS;

        for (let i = 0; i < SEGMENTS; i++) {
            const sx = x + dx * (i + 0.5);
            const sy = y + dy * (i + 0.5);

            const seg = Bodies.circle(sx, sy, SEGMENT_RADIUS, {
                density: 0.001,
                friction: 0.8,
                frictionAir: 0.02,
                label: `rope-seg-${i}`,
                collisionFilter: {
                    group: -1, // rope segments don't collide with each other
                },
            });
            this._segments.push(seg);
        }

        // Static anchor at start
        this._anchor = Bodies.circle(x, y, 4, {
            isStatic: true,
            label: 'rope-anchor',
            collisionFilter: { group: -1 },
        });

        // Connect anchor to first segment
        this._constraints.push(Constraint.create({
            bodyA: this._anchor,
            bodyB: this._segments[0],
            stiffness: 0.8,
            damping: 0.1,
            length: segLength * 0.5,
        }));

        // Connect consecutive segments
        for (let i = 0; i < SEGMENTS - 1; i++) {
            this._constraints.push(Constraint.create({
                bodyA: this._segments[i],
                bodyB: this._segments[i + 1],
                stiffness: 0.8,
                damping: 0.1,
                length: segLength * 0.6,
            }));
        }
    }

    get type() { return 'rope'; }

    get bodies() {
        return [this._anchor, ...this._segments];
    }

    get constraints() {
        return this._constraints;
    }

    get bounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const seg of this._segments) {
            const p = seg.position;
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return { x: minX - 5, y: minY - 5, width: maxX - minX + 10, height: maxY - minY + 10 };
    }

    setPosition(x, y) {
        const dx = x - this._x;
        const dy = y - this._y;
        super.setPosition(x, y);
        Body.setPosition(this._anchor, { x, y });
        for (const seg of this._segments) {
            Body.translate(seg, { x: dx, y: dy });
        }
    }

    onCollision(other, pair) {
        if (other.type === 'candle' && !this._severed) {
            this.sever();
        }
    }

    /** Sever the rope (e.g., by candle flame). */
    sever() {
        if (this._severed) return;
        this._severed = true;
        eventBus.emit('rope:severed', { rope: this });
    }

    get isSevered() {
        return this._severed;
    }

    draw(ctx) {
        ctx.save();

        // Draw the rope as a smooth curve through segment positions
        const points = [this._anchor.position, ...this._segments.map(s => s.position)];

        ctx.strokeStyle = this._severed ? '#aaa' : ROPE_COLOR;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const midX = (prev.x + curr.x) / 2;
            const midY = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();

        // Anchor point
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(this._anchor.position.x, this._anchor.position.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        ctx.strokeStyle = ROPE_COLOR;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(w * 0.3, h * 0.2);
        ctx.quadraticCurveTo(w * 0.6, h * 0.5, w * 0.4, h * 0.8);
        ctx.stroke();

        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(w * 0.3, h * 0.2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    serialize() {
        return {
            ...super.serialize(),
            options: {
                ...this._options,
                length: this._length,
                endPoint: this._endPoint,
            },
        };
    }

    static deserialize(data) {
        return new Rope(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            length: data.options?.length || 100,
            endPoint: data.options?.endPoint,
        });
    }

    dispose() {
        this._anchor = null;
        this._segments = [];
        this._constraints = [];
    }
}
