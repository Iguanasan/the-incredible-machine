/**
 * Conveyor — Moving belt surface
 *
 * A static surface that applies tangential force to objects touching it,
 * moving them along the belt direction.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body } = Matter;

const CONVEYOR_WIDTH = 140;
const CONVEYOR_HEIGHT = 16;
const BELT_COLOR = '#404040';
const FRAME_COLOR = '#707070';
const ROLLER_COLOR = '#909090';

export default class Conveyor extends BaseObject {
    /**
     * @param {number} x
     * @param {number} y
     * @param {object} [options={}]
     * @param {number} [options.speed=2] - Belt speed (positive = right, negative = left)
     * @param {number} [options.width=140]
     */
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._beltSpeed = options.speed ?? 2;
        this._width = options.width || CONVEYOR_WIDTH;
        this._height = CONVEYOR_HEIGHT;

        this._body = Bodies.rectangle(x, y, this._width, this._height, {
            isStatic: true,
            friction: 0.9,
            label: 'conveyor',
            angle: this._angle,
        });

        /** @type {number} animation offset for belt stripes */
        this._animOffset = 0;
    }

    get type() { return 'conveyor'; }

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

    /**
     * Apply tangential force to any body touching the conveyor belt.
     * Called each physics step.
     */
    onBeforeUpdate(engine) {
        // Get all bodies in the world
        const allBodies = Matter.Composite.allBodies(engine.world);

        for (const body of allBodies) {
            if (body.isStatic || body === this._body) continue;

            // Check collision between this conveyor and the body
            const collision = Matter.SAT.collides(this._body, body);
            if (collision && collision.collided) {
                // Apply surface velocity along the belt direction
                const angle = this._body.angle;
                const forceX = Math.cos(angle) * this._beltSpeed * 0.0004 * body.mass;
                const forceY = Math.sin(angle) * this._beltSpeed * 0.0004 * body.mass;
                Body.applyForce(body, body.position, { x: forceX, y: forceY });
            }
        }

        // Animate belt
        this._animOffset += this._beltSpeed * 0.5;
    }

    draw(ctx) {
        const pos = this._body.position;
        const angle = this._body.angle;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        const hw = this._width / 2;
        const hh = this._height / 2;

        // Frame
        ctx.fillStyle = FRAME_COLOR;
        ctx.fillRect(-hw - 4, -hh - 2, this._width + 8, this._height + 4);

        // Belt surface with moving stripes
        ctx.fillStyle = BELT_COLOR;
        ctx.fillRect(-hw, -hh, this._width, this._height);

        // Animated belt stripes
        ctx.save();
        ctx.beginPath();
        ctx.rect(-hw, -hh, this._width, this._height);
        ctx.clip();

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        const stripeSpacing = 12;
        const offset = this._animOffset % stripeSpacing;
        for (let sx = -hw + offset - stripeSpacing; sx <= hw + stripeSpacing; sx += stripeSpacing) {
            ctx.beginPath();
            ctx.moveTo(sx - 3, -hh);
            ctx.lineTo(sx + 3, hh);
            ctx.stroke();
        }
        ctx.restore();

        // Rollers at ends
        ctx.fillStyle = ROLLER_COLOR;
        ctx.beginPath();
        ctx.arc(-hw, 0, hh + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(hw, 0, hh + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Direction arrow
        ctx.fillStyle = '#aaa';
        ctx.globalAlpha = 0.6;
        const arrowDir = this._beltSpeed > 0 ? 1 : -1;
        const ax = arrowDir * 15;
        ctx.beginPath();
        ctx.moveTo(ax + arrowDir * 6, 0);
        ctx.lineTo(ax - arrowDir * 4, -5);
        ctx.lineTo(ax - arrowDir * 4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Outline
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-hw - 4, -hh - 2, this._width + 8, this._height + 4);

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const hw = w * 0.35;
        const hh = 3;
        ctx.fillStyle = BELT_COLOR;
        ctx.fillRect(w / 2 - hw, h / 2 - hh, hw * 2, hh * 2);
        // Rollers
        ctx.fillStyle = ROLLER_COLOR;
        ctx.beginPath();
        ctx.arc(w / 2 - hw, h / 2, hh + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w / 2 + hw, h / 2, hh + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(w / 2 - hw, h / 2 - hh, hw * 2, hh * 2);
    }

    serialize() {
        return {
            ...super.serialize(),
            options: { ...this._options, speed: this._beltSpeed, width: this._width },
        };
    }

    static deserialize(data) {
        return new Conveyor(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            speed: data.options?.speed ?? 2,
            width: data.options?.width || CONVEYOR_WIDTH,
        });
    }

    dispose() {
        this._body = null;
    }
}
