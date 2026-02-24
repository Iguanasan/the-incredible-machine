/**
 * Spring — Compressed launcher that releases stored energy
 *
 * When an object lands on the spring, it compresses and then
 * launches the object upward with a burst of force.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body, Composite } = Matter;

const SPRING_WIDTH = 30;
const SPRING_HEIGHT = 40;
const LAUNCH_FORCE = 0.08;
const SPRING_COLOR = '#cc6633';
const COIL_COLOR = '#999';
const PLATFORM_COLOR = '#777';

export default class Spring extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._launchForce = options.launchForce || LAUNCH_FORCE;

        // The base is static
        this._base = Bodies.rectangle(x, y + SPRING_HEIGHT / 2 - 5, SPRING_WIDTH + 10, 10, {
            isStatic: true,
            label: 'spring-base',
            angle: this._angle,
        });

        // The platform (top) detects objects landing on it
        this._platform = Bodies.rectangle(x, y - SPRING_HEIGHT / 2 + 5, SPRING_WIDTH, 8, {
            isStatic: true,
            label: 'spring-platform',
            restitution: 0.1,
            angle: this._angle,
        });

        /** @type {number} compression: 0 = rest, 1 = fully compressed */
        this._compression = 0;
        /** @type {boolean} */
        this._triggered = false;
        /** @type {number} trigger cooldown timer */
        this._cooldown = 0;
    }

    get type() { return 'spring'; }
    get bodies() { return [this._base, this._platform]; }

    get bounds() {
        return {
            x: this._base.position.x - SPRING_WIDTH / 2 - 5,
            y: this._platform.position.y - 4,
            width: SPRING_WIDTH + 10,
            height: SPRING_HEIGHT,
        };
    }

    setPosition(x, y) {
        super.setPosition(x, y);
        Body.setPosition(this._base, { x, y: y + SPRING_HEIGHT / 2 - 5 });
        Body.setPosition(this._platform, { x, y: y - SPRING_HEIGHT / 2 + 5 });
    }

    setAngle(angle) {
        super.setAngle(angle);
        Body.setAngle(this._base, angle);
        Body.setAngle(this._platform, angle);
    }

    onCollision(other, pair) {
        if (this._cooldown > 0) return;

        // Check if something hit the platform
        const hitPlatform = pair.bodyA === this._platform || pair.bodyB === this._platform;
        if (hitPlatform && !this._triggered) {
            this._triggered = true;
            this._compression = 1;
        }
    }

    onBeforeUpdate(engine) {
        if (this._cooldown > 0) {
            this._cooldown--;
        }

        if (this._triggered && this._compression > 0) {
            // Animate compression
            this._compression -= 0.08;

            if (this._compression <= 0) {
                this._compression = 0;
                this._triggered = false;
                this._cooldown = 30; // Cooldown frames before retriggering

                // Launch! Apply upward force to any body touching the platform
                const angle = this._base.angle;
                const launchDirX = -Math.sin(angle);
                const launchDirY = -Math.cos(angle);

                const allBodies = Composite.allBodies(engine.world);
                for (const body of allBodies) {
                    if (body.isStatic || body === this._base || body === this._platform) continue;

                    const collision = Matter.SAT.collides(this._platform, body);
                    if (collision && collision.collided) {
                        Body.applyForce(body, body.position, {
                            x: launchDirX * this._launchForce,
                            y: launchDirY * this._launchForce,
                        });
                    }
                }
            }
        }
    }

    draw(ctx) {
        const basePos = this._base.position;
        const platPos = this._platform.position;
        const angle = this._base.angle;

        ctx.save();
        ctx.translate(basePos.x, basePos.y);
        ctx.rotate(angle);

        const hw = SPRING_WIDTH / 2;
        const baseTop = -5;
        const platY = -(SPRING_HEIGHT - 10) + this._compression * 15;

        // Base
        ctx.fillStyle = SPRING_COLOR;
        ctx.fillRect(-hw - 5, baseTop - 5, SPRING_WIDTH + 10, 10);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-hw - 5, baseTop - 5, SPRING_WIDTH + 10, 10);

        // Coil spring
        ctx.strokeStyle = COIL_COLOR;
        ctx.lineWidth = 2.5;
        const coils = 5;
        const coilTop = platY + 4;
        const coilBot = baseTop - 5;
        const coilHeight = coilBot - coilTop;
        ctx.beginPath();
        for (let i = 0; i <= coils; i++) {
            const cy = coilTop + (coilHeight / coils) * i;
            const sx = (i % 2 === 0) ? -hw + 4 : hw - 4;
            if (i === 0) {
                ctx.moveTo(sx, cy);
            } else {
                ctx.lineTo(sx, cy);
            }
        }
        ctx.stroke();

        // Platform
        ctx.fillStyle = PLATFORM_COLOR;
        ctx.fillRect(-hw, platY, SPRING_WIDTH, 8);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-hw, platY, SPRING_WIDTH, 8);

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2;
        // Base
        ctx.fillStyle = SPRING_COLOR;
        ctx.fillRect(cx - 10, h * 0.65, 20, 5);
        // Coil
        ctx.strokeStyle = COIL_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 6, h * 0.35);
        ctx.lineTo(cx + 6, h * 0.42);
        ctx.lineTo(cx - 6, h * 0.49);
        ctx.lineTo(cx + 6, h * 0.56);
        ctx.lineTo(cx - 6, h * 0.63);
        ctx.stroke();
        // Platform
        ctx.fillStyle = PLATFORM_COLOR;
        ctx.fillRect(cx - 8, h * 0.3, 16, 4);
    }

    serialize() {
        return {
            ...super.serialize(),
            options: { ...this._options, launchForce: this._launchForce },
        };
    }

    static deserialize(data) {
        return new Spring(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            launchForce: data.options?.launchForce || LAUNCH_FORCE,
        });
    }

    dispose() {
        this._base = null;
        this._platform = null;
    }
}
