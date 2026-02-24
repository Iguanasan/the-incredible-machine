/**
 * Fan — Electric fan that blows objects in a direction
 *
 * Applies a directional force to objects within its wind zone.
 * The wind zone extends outward from the fan face.
 */

import Matter from 'matter-js';
import BaseObject from './BaseObject.js';

const { Bodies, Body, Composite, Query } = Matter;

const FAN_WIDTH = 40;
const FAN_HEIGHT = 50;
const WIND_RANGE = 200;
const WIND_FORCE = 0.0008;
const FAN_COLOR = '#5577aa';
const CAGE_COLOR = '#888';

export default class Fan extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._windRange = options.windRange || WIND_RANGE;
        this._windForce = options.windForce || WIND_FORCE;

        this._body = Bodies.rectangle(x, y, FAN_WIDTH, FAN_HEIGHT, {
            isStatic: true,
            label: 'fan',
            angle: this._angle,
        });

        /** @type {number} blade rotation animation */
        this._bladeAngle = 0;
        this._isBlowing = false;
    }

    get type() { return 'fan'; }
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

    /**
     * Apply wind force to bodies in the fan's wind zone.
     * Wind blows outward from the fan face (upward by default).
     */
    onBeforeUpdate(engine) {
        this._isBlowing = true;
        this._bladeAngle += 0.3;

        const pos = this._body.position;
        const angle = this._body.angle;

        // Wind direction is "up" relative to the fan (perpendicular to face)
        const windDirX = -Math.sin(angle);
        const windDirY = -Math.cos(angle);

        // Define the wind zone as a rectangular region in front of the fan
        const zoneCenterX = pos.x + windDirX * this._windRange / 2;
        const zoneCenterY = pos.y + windDirY * this._windRange / 2;
        const zoneHalfWidth = FAN_WIDTH;
        const zoneHalfHeight = this._windRange / 2;

        const bounds = {
            min: { x: zoneCenterX - zoneHalfWidth, y: zoneCenterY - zoneHalfHeight },
            max: { x: zoneCenterX + zoneHalfWidth, y: zoneCenterY + zoneHalfHeight },
        };

        const allBodies = Composite.allBodies(engine.world);
        const inRange = Query.region(allBodies, bounds);

        for (const body of inRange) {
            if (body.isStatic || body === this._body) continue;

            // Distance-based falloff
            const dx = body.position.x - pos.x;
            const dy = body.position.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this._windRange && dist > 0) {
                const factor = 1 - (dist / this._windRange);
                const fx = windDirX * this._windForce * factor * body.mass;
                const fy = windDirY * this._windForce * factor * body.mass;
                Body.applyForce(body, body.position, { x: fx, y: fy });
            }
        }
    }

    draw(ctx) {
        const pos = this._body.position;
        const angle = this._body.angle;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        const hw = FAN_WIDTH / 2;
        const hh = FAN_HEIGHT / 2;

        // Fan housing
        ctx.fillStyle = FAN_COLOR;
        ctx.fillRect(-hw, -hh, FAN_WIDTH, FAN_HEIGHT);

        // Front grille / cage
        ctx.strokeStyle = CAGE_COLOR;
        ctx.lineWidth = 1.5;
        for (let i = -hw + 6; i <= hw - 6; i += 6) {
            ctx.beginPath();
            ctx.moveTo(i, -hh);
            ctx.lineTo(i, -hh + 8);
            ctx.stroke();
        }

        // Spinning blades
        ctx.save();
        ctx.translate(0, 0);
        ctx.rotate(this._bladeAngle);
        ctx.fillStyle = '#aabbcc';
        const bladeCount = 3;
        const bladeLen = hw - 4;
        for (let i = 0; i < bladeCount; i++) {
            const ba = (i / bladeCount) * Math.PI * 2;
            ctx.save();
            ctx.rotate(ba);
            ctx.beginPath();
            ctx.ellipse(bladeLen / 2, 0, bladeLen / 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // Center hub
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Wind lines (when blowing)
        if (this._isBlowing) {
            ctx.strokeStyle = 'rgba(180, 200, 220, 0.4)';
            ctx.lineWidth = 1;
            const time = this._bladeAngle * 2;
            for (let i = 0; i < 4; i++) {
                const ly = -hh - 10 - i * 15 - ((time * 3 + i * 7) % 30);
                const waveAmp = 3 + i * 1.5;
                ctx.beginPath();
                ctx.moveTo(-hw + 8, ly);
                ctx.quadraticCurveTo(0, ly + waveAmp, hw - 8, ly);
                ctx.stroke();
            }
        }

        // Outline
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-hw, -hh, FAN_WIDTH, FAN_HEIGHT);

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        ctx.fillStyle = FAN_COLOR;
        ctx.fillRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
        // Simple blade icon
        ctx.strokeStyle = '#aabbcc';
        ctx.lineWidth = 2;
        const cx = w / 2;
        const cy = h / 2;
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 - Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
            ctx.stroke();
        }
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
    }

    serialize() {
        return {
            ...super.serialize(),
            options: {
                ...this._options,
                windRange: this._windRange,
                windForce: this._windForce,
            },
        };
    }

    static deserialize(data) {
        return new Fan(data.x, data.y, {
            angle: data.angle,
            isFixed: data.isFixed,
            windRange: data.options?.windRange || WIND_RANGE,
            windForce: data.options?.windForce || WIND_FORCE,
        });
    }

    dispose() {
        this._body = null;
    }
}
