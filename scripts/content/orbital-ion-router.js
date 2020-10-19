// Random default sector name
const names = [
	/* Non-references */
	"Orbital Ion Router",
	"Anuke's wrath",

	/* DS9 */
	"Deep Rout 9",
	"Star-rout 375",
	"Terout Tor", // Terok Nor

	/* Misc */
	"ISS Router",
	"Router 5",
	"The Routadel",
	"Router Star",
	"Routodus", // Exodus
	"Router Station",
	"ORION - Orbital Router ION weapon" // Play on ODIN
];

const routorio = this.global.routorio;
const items = routorio.items;

const orion = new JavaAdapter(Planet, {
	// Optimisation
	getLastSector() {
		return this.sectors.get(0);
	},
	setLastSector(){},
	getSector(i) {
		return this.lastSector;
	},

	isLandable() {
		return this.accessible
	},

	// Really build costs, it doesn't exist until researched/built
	researchRequirements: () => ItemStack.with(
		Items.titanium, 11000000,
		Items.silicon, 1500000,
		Items.metaglass, 800000,

		Vars.content.getByName(ContentType.item, "beryllium"), 500000,
		Vars.content.getByName(ContentType.item, "neutron-router"), 1
	),

	load() {
		// Make a smaller mesh TODO: use an actual satellite obj
		this.radius = 0.1;
		this.super$load();
		this.radius = 0.5;
	},

	init() {
		this.super$init();

		routorio.research(this, "phase-router");
	},

	onUnlock() {
		this.accessible = true;
	},

	// Don't draw it if it isn't built
	visible() {
		return this.accessible;
	},

	// Give it a database entry
	isHidden: () => false,
	displayInfo(table) {
		this.super$displayInfo(table);
		table.add("frog");
	}
}, "orbital-ion-router", Planets.serpulo, 0, 0.5);

Object.assign(orion, {
	hasAtmosphere: false,
	tidalLock: true,
	// This "planet" can only be used once researched
	accessible: Core.settings.getBool("routorio-orbital-ion-router-unlocked", false),
	orbitRadius: 3
});

const ptile = new PlanetGrid.Ptile(0, 6);
const corners = ptile.corners;
for (var i = 0; i < 6; i++) {
	corners[i] = new PlanetGrid.Corner(i);
	// TODO
	corners[i].v = new Vec3();
}

// TODO: Point towards/away from planet somehow
ptile.v = new Vec3();
ptile.tiles = [];
ptile.edges = [];

orion.sectorApproxRadius = ptile.v.dst(ptile.corners[0].v);

orion.grid = extendContent(PlanetGrid, 1, {
	tiles: [ptile],
	edges: [],
	corners: ptile.corners,

	// For sector drawing thing
	size: 0.1
});

orion.sectors.add(new JavaAdapter(Sector, {
	// Use random name
	name() {
		return this.info.name ? this.info.name : this.newName();
	},

	newName() {
		const name = names[Math.floor(Mathf.random(0, names.length))];
		print("name " + name)
		this.info.name = name;
		return name;
	},

	// There's only one sector, so no neighbours
	inRange: () => Seq.with(),
	neighbours: () => Seq.with(),

	hasEnemyBase: () => false,
	isUnderAttack: () => false,
	isCaptured: () => true
}, orion, ptile));

/// TODO: Ion Uplink, Ion Interface
// steal Lunchpad code

const map = new SectorPreset("central-command", orion, 0);
map.alwaysUnlocked = true;
map.difficulty = 0;

// TODO: custom mesh, load obj file
// orion.meshLoader = () => new HexMesh(orion, 3);

module.exports = orion;
