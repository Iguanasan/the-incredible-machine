/**
 * MockObjects — Stub game objects for UI testing.
 *
 * These simple objects implement the BaseObject interface so that
 * the Renderer, Toolbox, and Drag-and-Drop system can be developed
 * and tested without Agent A's real physics objects.
 */

import BaseObject from '../objects/BaseObject.js';
import { objectRegistry } from '../objects/ObjectRegistry.js';

// ── Mock Ball ─────────────────────────────────

class MockBall extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._radius = options.radius || 18;
    }

    get type() { return 'ball'; }

    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._radius,
            y: this._y - this._radius,
            width: this._radius * 2,
            height: this._radius * 2,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);
        ctx.rotate(this._angle);

        // Bowling ball — dark blue with pastel highlights (TIM style)
        const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, this._radius);
        grad.addColorStop(0, '#7090d0');
        grad.addColorStop(0.7, '#3050a0');
        grad.addColorStop(1, '#203070');

        ctx.beginPath();
        ctx.arc(0, 0, this._radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#202040';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Finger holes
        ctx.fillStyle = '#1a2050';
        for (const [dx, dy] of [[-4, -6], [4, -6], [0, -1]]) {
            ctx.beginPath();
            ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 4;
        const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r);
        grad.addColorStop(0, '#7090d0');
        grad.addColorStop(1, '#3050a0');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#202040';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    static deserialize(data) {
        return new MockBall(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Mock Ramp ─────────────────────────────────

class MockRamp extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._width = options.width || 120;
        this._height = options.height || 12;
    }

    get type() { return 'ramp'; }

    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._width / 2,
            y: this._y - this._height / 2,
            width: this._width,
            height: this._height,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);
        ctx.rotate(this._angle);

        // Wooden ramp — warm brown with grain lines (TIM style)
        const hw = this._width / 2, hh = this._height / 2;
        ctx.fillStyle = '#c8a060';
        ctx.fillRect(-hw, -hh, this._width, this._height);

        // Grain lines
        ctx.strokeStyle = '#a08040';
        ctx.lineWidth = 0.5;
        for (let i = -hw + 15; i < hw; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, -hh + 2);
            ctx.lineTo(i + 5, hh - 2);
            ctx.stroke();
        }

        // Outline
        ctx.strokeStyle = '#604020';
        ctx.lineWidth = 2;
        ctx.strokeRect(-hw, -hh, this._width, this._height);

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-0.2);
        const rw = w - 10, rh = 6;
        ctx.fillStyle = '#c8a060';
        ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
        ctx.strokeStyle = '#604020';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-rw / 2, -rh / 2, rw, rh);
        ctx.restore();
    }

    static deserialize(data) {
        return new MockRamp(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Mock Bucket ───────────────────────────────

class MockBucket extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, { ...options, isFixed: true });
        this._w = 60;
        this._h = 50;
    }

    get type() { return 'bucket'; }
    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._w / 2,
            y: this._y - this._h / 2,
            width: this._w,
            height: this._h,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);

        // Bucket — trapezoid shape, silver/gray (TIM style)
        const tw = this._w / 2, bw = tw * 0.7, hh = this._h / 2;
        ctx.beginPath();
        ctx.moveTo(-tw, -hh);
        ctx.lineTo(tw, -hh);
        ctx.lineTo(bw, hh);
        ctx.lineTo(-bw, hh);
        ctx.closePath();
        ctx.fillStyle = '#b0b0c0';
        ctx.fill();
        ctx.strokeStyle = '#505060';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Handle
        ctx.beginPath();
        ctx.arc(0, -hh - 8, tw * 0.6, Math.PI, 0);
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2, cy = h / 2;
        const tw = w / 2 - 4, bw = tw * 0.7, hh = h / 2 - 6;
        ctx.beginPath();
        ctx.moveTo(cx - tw, cy - hh);
        ctx.lineTo(cx + tw, cy - hh);
        ctx.lineTo(cx + bw, cy + hh);
        ctx.lineTo(cx - bw, cy + hh);
        ctx.closePath();
        ctx.fillStyle = '#b0b0c0';
        ctx.fill();
        ctx.strokeStyle = '#505060';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    static deserialize(data) {
        return new MockBucket(data.x, data.y, { ...data.options, angle: data.angle, isFixed: true });
    }
}

// ── Mock Trampoline ───────────────────────────

class MockTrampoline extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._w = 80;
        this._h = 20;
    }

    get type() { return 'trampoline'; }
    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._w / 2,
            y: this._y - this._h / 2,
            width: this._w,
            height: this._h,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);
        ctx.rotate(this._angle);

        const hw = this._w / 2, hh = this._h / 2;

        // Frame legs
        ctx.strokeStyle = '#707070';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-hw + 5, -hh);
        ctx.lineTo(-hw + 10, hh);
        ctx.moveTo(hw - 5, -hh);
        ctx.lineTo(hw - 10, hh);
        ctx.stroke();

        // Bouncy surface
        ctx.fillStyle = '#e06060';
        ctx.fillRect(-hw + 5, -hh - 3, this._w - 10, 6);
        ctx.strokeStyle = '#903030';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-hw + 5, -hh - 3, this._w - 10, 6);

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        ctx.fillStyle = '#e06060';
        ctx.fillRect(4, h / 2 - 3, w - 8, 6);
        ctx.strokeStyle = '#903030';
        ctx.lineWidth = 1;
        ctx.strokeRect(4, h / 2 - 3, w - 8, 6);
        // Legs
        ctx.strokeStyle = '#707070';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, h / 2 - 3);
        ctx.lineTo(10, h - 4);
        ctx.moveTo(w - 8, h / 2 - 3);
        ctx.lineTo(w - 10, h - 4);
        ctx.stroke();
    }

    static deserialize(data) {
        return new MockTrampoline(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Mock Domino ───────────────────────────────

class MockDomino extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._w = 10;
        this._h = 40;
    }

    get type() { return 'domino'; }
    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._w / 2,
            y: this._y - this._h / 2,
            width: this._w,
            height: this._h,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);
        ctx.rotate(this._angle);
        const hw = this._w / 2, hh = this._h / 2;
        ctx.fillStyle = '#f0f0e0';
        ctx.fillRect(-hw, -hh, this._w, this._h);
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-hw, -hh, this._w, this._h);
        // Dots
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.arc(0, -hh / 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, hh / 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const rw = 8, rh = h - 8;
        ctx.fillStyle = '#f0f0e0';
        ctx.fillRect(w / 2 - rw / 2, 4, rw, rh);
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1;
        ctx.strokeRect(w / 2 - rw / 2, 4, rw, rh);
    }

    static deserialize(data) {
        return new MockDomino(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Mock Fan ──────────────────────────────────

class MockFan extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, { ...options, isFixed: options.isFixed ?? true });
        this._size = 40;
    }

    get type() { return 'fan'; }
    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._size / 2,
            y: this._y - this._size / 2,
            width: this._size,
            height: this._size,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);
        ctx.rotate(this._angle);
        const r = this._size / 2;

        // Housing
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#d0d0d0';
        ctx.fill();
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Blades
        ctx.fillStyle = '#80a0c0';
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI * 2) / 3);
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.4, r * 0.2, r * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Center hub
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#404040';
        ctx.fill();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#d0d0d0';
        ctx.fill();
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#80a0c0';
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((i * Math.PI * 2) / 3);
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.35, r * 0.15, r * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    static deserialize(data) {
        return new MockFan(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Mock Balloon ──────────────────────────────

class MockBalloon extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._rx = 16;
        this._ry = 22;
    }

    get type() { return 'balloon'; }
    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._rx,
            y: this._y - this._ry - 5,
            width: this._rx * 2,
            height: this._ry * 2 + 20,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);

        // String
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, this._ry);
        ctx.quadraticCurveTo(3, this._ry + 10, -2, this._ry + 18);
        ctx.stroke();

        // Balloon body
        const grad = ctx.createRadialGradient(-4, -6, 2, 0, 0, this._ry);
        grad.addColorStop(0, '#ff8080');
        grad.addColorStop(0.8, '#e03030');
        grad.addColorStop(1, '#a01010');
        ctx.beginPath();
        ctx.ellipse(0, 0, this._rx, this._ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#802020';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Knot
        ctx.beginPath();
        ctx.moveTo(-3, this._ry);
        ctx.lineTo(0, this._ry + 4);
        ctx.lineTo(3, this._ry);
        ctx.fillStyle = '#c03030';
        ctx.fill();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2, cy = h / 2 - 3;
        const rx = w / 2 - 5, ry = h / 2 - 7;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e03030';
        ctx.fill();
        ctx.strokeStyle = '#802020';
        ctx.lineWidth = 1;
        ctx.stroke();
        // String
        ctx.beginPath();
        ctx.moveTo(cx, cy + ry + 1);
        ctx.lineTo(cx, h - 2);
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }

    static deserialize(data) {
        return new MockBalloon(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Mock Rope ─────────────────────────────────

class MockRope extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._length = options.length || 80;
    }

    get type() { return 'rope'; }
    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - 5,
            y: this._y,
            width: 10,
            height: this._length,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);
        ctx.rotate(this._angle);
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this._length);
        ctx.stroke();
        ctx.setLineDash([]);
        // Attachment points
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, this._length, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 6);
        ctx.lineTo(w / 2, h - 6);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    static deserialize(data) {
        return new MockRope(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Mock Spring ───────────────────────────────

class MockSpring extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._w = 40;
        this._h = 30;
    }

    get type() { return 'spring'; }
    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._w / 2,
            y: this._y - this._h / 2,
            width: this._w,
            height: this._h,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);
        ctx.rotate(this._angle);
        const hw = this._w / 2, hh = this._h / 2;

        // Base plate
        ctx.fillStyle = '#808080';
        ctx.fillRect(-hw, hh - 6, this._w, 6);
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-hw, hh - 6, this._w, 6);

        // Coil (zig-zag)
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-hw + 8, hh - 6);
        const segments = 6;
        const segH = (this._h - 6) / segments;
        for (let i = 0; i < segments; i++) {
            const xOff = (i % 2 === 0) ? hw - 8 : -hw + 8;
            ctx.lineTo(xOff, hh - 6 - (i + 1) * segH);
        }
        ctx.stroke();

        // Top plate
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(-hw + 4, -hh, this._w - 8, 5);

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 6, h - 6);
        const segs = 4;
        for (let i = 0; i < segs; i++) {
            const xOff = (i % 2 === 0) ? w / 2 + 6 : w / 2 - 6;
            ctx.lineTo(xOff, h - 6 - ((i + 1) * (h - 12)) / segs);
        }
        ctx.stroke();
        ctx.fillStyle = '#808080';
        ctx.fillRect(6, h - 8, w - 12, 4);
    }

    static deserialize(data) {
        return new MockSpring(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Mock Mouse ────────────────────────────────

class MockMouse extends BaseObject {
    constructor(x, y, options = {}) {
        super(x, y, options);
        this._w = 30;
        this._h = 20;
    }

    get type() { return 'mouse'; }
    get bodies() { return []; }

    get bounds() {
        return {
            x: this._x - this._w / 2,
            y: this._y - this._h / 2,
            width: this._w,
            height: this._h,
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this._x, this._y);

        // Body
        ctx.fillStyle = '#c0a080';
        ctx.beginPath();
        ctx.ellipse(0, 0, this._w / 2, this._h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#806040';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Ears
        ctx.fillStyle = '#dfc0a0';
        ctx.beginPath();
        ctx.ellipse(-8, -this._h / 2 + 2, 5, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(8, -this._h / 2 + 2, 5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.arc(6, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#ff9090';
        ctx.beginPath();
        ctx.arc(this._w / 2 - 2, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.strokeStyle = '#c09070';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this._w / 2, 2);
        ctx.quadraticCurveTo(-this._w / 2 - 10, -8, -this._w / 2 - 6, -14);
        ctx.stroke();

        ctx.restore();
    }

    drawToolboxIcon(ctx, w, h) {
        const cx = w / 2, cy = h / 2;
        ctx.fillStyle = '#c0a080';
        ctx.beginPath();
        ctx.ellipse(cx, cy, w / 2 - 5, h / 2 - 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#806040';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Eye
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.arc(cx + 4, cy - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    static deserialize(data) {
        return new MockMouse(data.x, data.y, { ...data.options, angle: data.angle, isFixed: data.isFixed });
    }
}

// ── Registration ──────────────────────────────

export function registerMockObjects() {
    const mocks = [
        ['ball', MockBall, { displayName: 'Bowling Ball', category: 'balls', description: 'A heavy bowling ball that rolls and bounces' }],
        ['ramp', MockRamp, { displayName: 'Ramp', category: 'surfaces', description: 'An angled surface for rolling objects' }],
        ['bucket', MockBucket, { displayName: 'Bucket', category: 'triggers', description: 'A container — get the ball in here!' }],
        ['trampoline', MockTrampoline, { displayName: 'Trampoline', category: 'machines', description: 'Bounces objects upward' }],
        ['domino', MockDomino, { displayName: 'Domino', category: 'machines', description: 'Falls over and knocks the next one' }],
        ['fan', MockFan, { displayName: 'Fan', category: 'machines', description: 'Blows wind to push lightweight objects' }],
        ['balloon', MockBalloon, { displayName: 'Balloon', category: 'balls', description: 'Floats upward — attach it to things!' }],
        ['rope', MockRope, { displayName: 'Rope', category: 'machines', description: 'Connects two objects together' }],
        ['spring', MockSpring, { displayName: 'Spring', category: 'machines', description: 'Launches objects into the air' }],
        ['mouse', MockMouse, { displayName: 'Mouse', category: 'triggers', description: 'Walks forward on its own' }],
    ];

    for (const [type, ClassRef, meta] of mocks) {
        if (!objectRegistry.has(type)) {
            objectRegistry.register(type, ClassRef, meta);
        }
    }

    console.log(`[MockObjects] Registered ${mocks.length} mock object types`);
}

export {
    MockBall, MockRamp, MockBucket, MockTrampoline,
    MockDomino, MockFan, MockBalloon, MockRope,
    MockSpring, MockMouse,
};
