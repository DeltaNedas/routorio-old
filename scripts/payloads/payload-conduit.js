/* Faster, more forceful payload conduit */

const cond = extend(PayloadConveyor, "payload-conduit", {
	load() {
		this.super$load();
		this.realEdge = this.edgeRegion;
		// Don't draw edge glass under the payload
		this.edgeRegion = Core.atlas.find("clear");

		this.glassRegion = Core.atlas.find(this.name + "-glass");
	},

	loadIcon() {
		this.fullIcon = Core.atlas.find(this.name + "-icon");
		this.uiIcon = this.fullIcon;
	},

	icons: () => [Core.atlas.find(this.name + "-icon")]
});

cond.buildType = () => extend(PayloadConveyor.PayloadConveyorBuild, cond, {
	draw() {
		this.super$draw();
		Draw.rect(cond.glassRegion, this.x, this.y, this.rotation * 90);

		for (var i = 0; i < 4; i++) {
			if (!this.blends(i)) {
				Draw.rect(cond.realEdge, this.x, this.y, i * 90);
			}
		}
	}
});

module.exports = cond;
