/**
 * Mouse — Autonomous walking agent
 *
 * Walks left/right, changes direction when hitting walls.
 * A classic TIM object that adds life to puzzles.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body, Composite } = Matter;

const MOUSE_WIDTH = 20;
const MOUSE_HEIGHT = 12;
const MOUSE_SPEED = 1.2;
const BODY_COLOR = '#b0b0b0';
const EAR_COLOR = '#e0a0a0';

export default class Mouse extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._speed = options.speed || MOUSE_SPEED;
        this._direction = options.direction || 1; // 1 = right, -1 = left
        this._isWalking = false;
        this._walkPhase = 0;

        this._body = Bodies.rectangle(x, y, MOUSE_WIDTH, MOUSE_HEIGHT, {
            density: 0.002,
            friction: 0.5,
            frictionAir: 0.01,
            restitution: 0.1,
            label: 'mouse',
        });
    }

    get type() { return 'mouse'; }
    get bodies() { return [this._body]; }

    get bounds() {
        const pos = this._body.position;
        return {
            x: pos.x - MOUSE_WIDTH / 2 - 5,
            y: pos.y - MOUSE_HEIGHT / 2 - 5,
            width: MOUSE_WIDTH + 15,
            height: MOUSE_HEIGHT + 10,
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

    /** Check if the mouse is on a surface (grounded). */
    _isGrounded(engine) {
        const pos = this._body.position;
        const feetY = pos.y + MOUSE_HEIGHT / 2 + 2;

        const allBodies = Composite.allBodies(engine.world);
        const testBodies = Matter.Query.point(allBodies, { x: pos.x, y: feetY });

        return testBodies.some(b => b !== this._body && b.isStatic);
    }

    onBeforeUpdate(engine) {
        this._isWalking = this._isGrounded(engine);

        if (!this._isWalking) return;

        this._walkPhase += 0.2;

        // Apply horizontal velocity
        Body.setVelocity(this._body, {
            x: this._speed * this._direction,
            y: this._body.velocity.y,
        });

        // Check for wall or edge ahead
        const pos = this._body.position;
        const aheadX = pos.x + this._direction * (MOUSE_WIDTH / 2 + 5);
        const aheadY = pos.y;

        // Check wall collision
        const allBodies = Composite.allBodies(engine.world);
        const wallCheck = Matter.Query.point(allBodies, { x: aheadX, y: aheadY });
        const hitWall = wallCheck.some(b => b !== this._body && b.isStatic);

        if (hitWall) {
            this._direction *= -1;
        }

        // Check for edge (no ground ahead)
        const edgeCheckY = pos.y + MOUSE_HEIGHT / 2 + 5;
        const groundAhead = Matter.Query.point(allBodies, { x: aheadX, y: edgeCheckY });
        const hasGround = groundAhead.some(b => b !== this._body && b.isStatic);

        if (!hasGround) {
            this._direction *= -1;
        }
    }

    onCollision(other, pair) {
        // Reverse direction on collision with objects
        if (other.type !== 'mouse') {
            this._direction *= -1;
        }
    }

    draw(ctx) {
        const pos = this._body.position;
        const dir = this._direction;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        if (dir < 0) {
            ctx.scale(-1, 1);
        }

        const hw = MOUSE_WIDTH / 2;
        const hh = MOUSE_HEIGHT / 2;

        // Body (oval)
        ctx.beginPath();
        ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
        ctx.fillStyle = BODY_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Head (smaller circle at front)
        ctx.beginPath();
        ctx.ellipse(hw - 2, -2, 6, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#c0c0c0';
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Nose
        ctx.beginPath();
        ctx.arc(hw + 4, -2, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#e0a0a0';
        ctx.fill();

        // Eye
        ctx.beginPath();
        ctx.arc(hw, -4, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        // Ear
        ctx.beginPath();
        ctx.ellipse(hw - 5, -7, 4, 3.5, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = EAR_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#c08080';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Tail
        ctx.strokeStyle = '#c0a0a0';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-hw, 0);
        ctx.quadraticCurveTo(-hw - 8, -8, -hw - 5, -12);
        ctx.stroke();

        // Legs (animated when walking)
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1.5;
        const legBob = this._isWalking ? Math.sin(this._walkPhase) * 3 : 0;
        const legBob2 = this._isWalking ? Math.sin(this._walkPhase + Math.PI) * 3 : 0;

        // Front legs
        ctx.beginPath();
        ctx.moveTo(hw - 6, hh);
        ctx.lineTo(hw - 6 + legBob, hh + 4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hw - 10, hh);
        ctx.lineTo(hw - 10 + legBob2, hh + 4);
        ctx.stroke();

        // Back legs
        ctx.beginPath();
        ctx.moveTo(-hw + 4, hh);
        ctx.lineTo(-hw + 4 + legBob2, hh + 4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-hw + 8, hh);
        ctx.lineTo(-hw + 8 + legBob, hh + 4);
        ctx.stroke();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2;

        // Body
        ctx.beginPath();
        ctx.ellipse(cx, cy, 8, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = BODY_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(cx + 7, cy - 1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.beginPath();
        ctx.arc(cx + 7, cy - 2, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        // Ear
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy - 5, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = EAR_COLOR;
        ctx.fill();

        // Tail
        ctx.strokeStyle = '#c0a0a0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy);
        ctx.quadraticCurveTo(cx - 12, cy - 5, cx - 10, cy - 8);
        ctx.stroke();
    }

    serialize() {
        return {
            ...super.serialize(),
            options: {
                ...this._options,
                speed: this._speed,
                direction: this._direction,
            },
        };
    }

    static deserialize(data) {
        return new Mouse(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            speed: data.options?.speed || MOUSE_SPEED,
            direction: data.options?.direction || 1,
        });
    }

    dispose() {
        this._body = null;
    }
}
