/*
	Copyright (c) deltanedas 2024

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const routorio = global.routorio;
const register = require("routorio/lib/register");

const viewport = new Rect();

function onScreen(pos) {
	return viewport.overlaps(pos.x, pos.y, 16, 16);
}

// Similar to the chain blaster, except TODO fires extra shots when chained.
const weapon = new Weapon("chain-router");
Object.assign(weapon, {
	reload: 15,
	alternate: false,
	ejectEffect: Fx.coreLandDust,
	bullet: extend(BasicBulletType, 2.5, 9, {
		width: 7,
		height: 9,
		lifetime: 60
	})
});

const routerpede = extend(UnitType, "routerpede", {
	load() {
		this.super$load();
		this.region = Core.atlas.find("router");
		this.legRegion = Core.atlas.find(this.name + "-leg");
		this.baseRegion = Core.atlas.find("clear");
	}
});

routerpede.constructor = () => extend(MechUnit, {
	update() {
		this.super$update();
		const closest = Units.closest(this.team, this.x, this.y, routerpede.chainRadius, boolf(unit => {
			return unit !== this && unit.routerSegments !== undefined
				// The bigger chain consumes the smaller one
				&& unit.routerSegments().length <= this.segments.length
				// Max 255 segments
				&& unit.routerSegments().length + this.segments.length < 256;
		}));

		if (closest) {
			// Merge the others segments
			const segments = closest.routerSegments();
			for (var i in segments) {
				this.push();
			}

			// Then consume it
			this.push();
			closest.kill();
		}
	},

	draw() {
		this.drawSingle();

		if (this.segments.length > 0) {
			this.updateseg(0, this);
			for (var i = 1; i < this.segments.length; i++) {
				this.updateseg(i, this.segments[i - 1]);
			}
		}

		this.super$draw();
	},

	damage(amount, withEffect) {
		if (withEffect !== undefined) {
			this.super$damage(amount, withEffect);
		} else {
			this.super$damage(amount);
		}

		if (this.segments.length == 0) return;

		const remove = this.segments.length - (this.health / routerpede.health);
		for (var i = 0; i < remove; i++) {
			this.pop();
		}
	},

	writeSave(write, net) {
		this.super$writeSave(write, net === undefined ? false : net);
		write.b(this.segments.length);
	},

	readSave(read, version) {
		this.super$readSave(read, version);
		const count = read.b();
		// Saving each segment is wasteful, just recreate them
		for (var i = 0; i < count; i++) {
			this.push();
		}
	},

	classId: () => routerpede.classId,

	// Drag and draw a segment
	updateseg(i, to) {
		const seg = this.segments[i];
		const nextAngle = Angles.angle(seg.x, seg.y, to.x, to.y);
		const nextDist = Mathf.dst(seg.x, seg.y, to.x, to.y);

		// Lerp if moving too far away
		if (nextDist > Vars.tilesize) {
			seg.rotation = Mathf.slerp(seg.rotation, to.rotation, 0.07);
			seg.x = Mathf.lerp(seg.x, to.x - Angles.trnsx(seg.rotation, Vars.tilesize), Time.delta / routerpede.speed);
			seg.y = Mathf.lerp(seg.y, to.y - Angles.trnsy(seg.rotation, Vars.tilesize), Time.delta / routerpede.speed);
		}

		if (!onScreen(seg)) return;

		const old = {x: this.x, y: this.y, rotation: this.rotation};
		Object.assign(this, seg);
		this.drawSingle();
		Object.assign(this, old);
	},

	drawSingle() {
		// Draw legs and router individually vs draw() to avoid recursion
		routerpede.drawMech(this);
		Draw.rect(routerpede.region, this.x, this.y, this.rotation);
	},

	// Add a router to the chain
	push() {
		const last = this.segments[this.segments.length - 1] || this;
		this.segments.push({
			x: last.x - Angles.trnsx(last.rotation, Vars.tilesize),
			y: last.y - Angles.trnsy(last.rotation, Vars.tilesize),
			rotation: last.rotation
		});
		this.health += routerpede.health;
	},

	// Kill a router and create an effect if on the client
	pop() {
		const seg = this.segments.pop();
		if (Vars.ui && seg) {
			Effect.scorch(seg.x, seg.y, 2);
			Effect.create(Fx.explosion, seg.x, seg.y);
			// Less shake than if it fully died
			Effect.shake(1, 1, seg.x, seg.y);
		}
	},

	// Used in chain merging
	routerSegments() {
		return this.segments;
	},

	segments: []
});

// 1 tile radius for absorbing other chain routers
routerpede.chainRadius = Vars.tilesize;
routerpede.weapons.add(weapon);

// Update viewport for rendering stuff
Events.run(Trigger.preDraw, () => {
	Core.camera.bounds(viewport);
});

register(routerpede);

module.exports = routerpede;
