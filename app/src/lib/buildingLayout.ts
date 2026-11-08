// DEMO layout of the Administration Building, the same on every level.
// The team gave the stairs and said each level has a men's and a women's toilet.
// The room areas, the toilet positions and the corridor are estimates.
// Coordinates are in the floor plan's SVG units (viewBox 0 0 380 300).

export type StairName = "north" | "west" | "east";
export type Point = { x: number; y: number };
export type Area = { id: string; label: string; toilet?: "Men" | "Women"; x: number; y: number; w: number; h: number; door: Point };
export type Route = { stair: StairName; points: Point[] };
/** Stairs closed by the admin. Nobody can pass that level, so they are closed from it upward. */
export type ClosedStair = { stair: StairName; level: number };
/** Where the admin says the fire started. spot is an area id, or "stair-east" for a stairwell. */
export type FireOrigin = { level: number; spot: string };

const LEFT = 70;
const RIGHT = 310;
const TOP = 55;
const BOTTOM = 235;
const DEPTH = 34;

// The corridor runs around the courtyard, as a rectangle with these centre lines.
// The north and south corridors also run on to the corners.
const CORRIDOR = { left: 111, right: 269, top: 96, bottom: 194 };
const WING_TOP = 103; // west and east areas sit between the north and south corridors
const WING_BOTTOM = 187;

export const STAIRS: Record<StairName, { x: number; y: number; w: number; h: number; door: Point }> = {
  north: { x: 174, y: TOP, w: 32, h: DEPTH, door: { x: 190, y: CORRIDOR.top } },
  west: { x: LEFT, y: 129, w: DEPTH, h: 32, door: { x: CORRIDOR.left, y: 145 } },
  east: { x: RIGHT - DEPTH, y: 129, w: DEPTH, h: 32, door: { x: CORRIDOR.right, y: 145 } },
};

const TOILET_WIDTH = 32;
const SOUTH_MIDDLE = { from: 166, to: 214 };

export const LOBBY = { x: SOUTH_MIDDLE.from, y: BOTTOM - DEPTH, w: SOUTH_MIDDLE.to - SOUTH_MIDDLE.from, h: DEPTH };

// doorX: the toilets are small, so the big north areas open near them and reach the north stairs first.
const north = (id: string, label: string, from: number, to: number, doorX: number, toilet?: Area["toilet"]): Area => ({
  id, label, toilet, x: from, y: TOP, w: to - from, h: DEPTH, door: { x: doorX, y: CORRIDOR.top },
});
const south = (id: string, label: string, from: number, to: number): Area => ({
  id, label, x: from, y: BOTTOM - DEPTH, w: to - from, h: DEPTH, door: { x: (from + to) / 2, y: CORRIDOR.bottom },
});
const west = (id: string, label: string, from: number, to: number): Area => ({
  id, label, x: LEFT, y: from, w: DEPTH, h: to - from, door: { x: CORRIDOR.left, y: (from + to) / 2 },
});
const east = (id: string, label: string, from: number, to: number): Area => ({
  id, label, x: RIGHT - DEPTH, y: from, w: DEPTH, h: to - from, door: { x: CORRIDOR.right, y: (from + to) / 2 },
});

const AREAS: Area[] = [
  north("north-west", "North wing, west side", LEFT, STAIRS.north.x - TOILET_WIDTH, 130),
  north("men", "Men's toilet", STAIRS.north.x - TOILET_WIDTH, STAIRS.north.x, 158, "Men"),
  north("women", "Women's toilet", STAIRS.north.x + STAIRS.north.w, STAIRS.north.x + STAIRS.north.w + TOILET_WIDTH, 222, "Women"),
  north("north-east", "North wing, east side", STAIRS.north.x + STAIRS.north.w + TOILET_WIDTH, RIGHT, 250),
  west("west-north", "West wing, north side", WING_TOP, STAIRS.west.y),
  west("west-south", "West wing, south side", STAIRS.west.y + STAIRS.west.h, WING_BOTTOM),
  east("east-north", "East wing, north side", WING_TOP, STAIRS.east.y),
  east("east-south", "East wing, south side", STAIRS.east.y + STAIRS.east.h, WING_BOTTOM),
  south("south-west", "South wing, west side", LEFT, SOUTH_MIDDLE.from),
  south("south-middle", "South wing, middle", SOUTH_MIDDLE.from, SOUTH_MIDDLE.to),
  south("south-east", "South wing, east side", SOUTH_MIDDLE.to, RIGHT),
];

/** Level 1 has the lobby in the middle of the south wing, where the main entrance is. */
export const areasOnLevel = (level: number): Area[] => (level === 1 ? AREAS.filter((a) => a.id !== "south-middle") : AREAS);

// Distance clockwise around the corridor, starting from its north-west corner.
const WIDE = CORRIDOR.right - CORRIDOR.left;
const TALL = CORRIDOR.bottom - CORRIDOR.top;
const LOOP = 2 * (WIDE + TALL);
const CORNERS: { at: number; point: Point }[] = [
  { at: 0, point: { x: CORRIDOR.left, y: CORRIDOR.top } },
  { at: WIDE, point: { x: CORRIDOR.right, y: CORRIDOR.top } },
  { at: WIDE + TALL, point: { x: CORRIDOR.right, y: CORRIDOR.bottom } },
  { at: 2 * WIDE + TALL, point: { x: CORRIDOR.left, y: CORRIDOR.bottom } },
];

function positionOf({ x, y }: Point) {
  if (y === CORRIDOR.top) return x - CORRIDOR.left;
  if (x === CORRIDOR.right) return WIDE + (y - CORRIDOR.top);
  if (y === CORRIDOR.bottom) return WIDE + TALL + (CORRIDOR.right - x);
  return 2 * WIDE + TALL + (CORRIDOR.bottom - y);
}

/** Where a door joins the rectangle: a door past the corner first walks along to the corner. */
const onLoop = ({ x, y }: Point): Point => ({ x: Math.min(CORRIDOR.right, Math.max(CORRIDOR.left, x)), y });

/** The two ways around the corridor, each with its length, and whether it passes the fire. */
function corridorWays(from: Point, to: Point, firePosition: number | null) {
  const start = positionOf(from);
  const clockwise = (positionOf(to) - start + LOOP) % LOOP;
  const ahead = (at: number) => (at - start + LOOP) % LOOP;
  const behind = (at: number) => (start - at + LOOP) % LOOP;
  const counter = (LOOP - clockwise) % LOOP;
  return [
    {
      length: clockwise,
      passesFire: firePosition !== null && ahead(firePosition) > 0 && ahead(firePosition) < clockwise,
      points: [from, ...CORNERS.filter((c) => ahead(c.at) > 0 && ahead(c.at) < clockwise).sort((a, b) => ahead(a.at) - ahead(b.at)).map((c) => c.point), to],
    },
    {
      length: counter,
      passesFire: firePosition !== null && behind(firePosition) > 0 && behind(firePosition) < counter,
      points: [from, ...CORNERS.filter((c) => behind(c.at) > 0 && behind(c.at) < counter).sort((a, b) => behind(a.at) - behind(b.at)).map((c) => c.point), to],
    },
  ];
}

const centre = (box: { x: number; y: number; w: number; h: number }): Point => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });

const STAIR_NAMES = Object.keys(STAIRS) as StairName[];

/** The stairs someone on this level cannot use. Level 1 has its own exits, so it never needs stairs. */
export function stairsClosedFor(level: number, closed: ClosedStair[]): StairName[] {
  if (level === 1) return [];
  return STAIR_NAMES.filter((name) => closed.some((c) => c.stair === name && c.level <= level));
}

/**
 * The way from an area to stairs. Closed stairs are never used, even if the alert names them.
 * On the fire's level the route never walks past the fire, even if that means longer or other stairs.
 * Null on level 1, where people leave by the nearest exit, or when no safe way is left.
 */
export function findRoute(level: number, areaId: string, alertStair: StairName | null, closed: ClosedStair[] = [], fire: FireOrigin | null = null): Route | null {
  const area = areasOnLevel(level).find((a) => a.id === areaId);
  if (!area || level === 1) return null;
  const shut = stairsClosedFor(level, closed);
  const entry = onLoop(area.door);
  const fireArea = fire?.level === level ? areasOnLevel(level).find((a) => a.id === fire.spot) : undefined;
  const firePosition = fireArea ? positionOf(onLoop(fireArea.door)) : null;

  const options = STAIR_NAMES.filter((name) => !shut.includes(name)).flatMap((stair) =>
    corridorWays(entry, STAIRS[stair].door, firePosition)
      .filter((way) => !way.passesFire)
      .map((way) => ({ stair, ...way })),
  );
  if (options.length === 0) return null;
  const shortest = (list: typeof options) => list.reduce((best, option) => (option.length < best.length ? option : best));
  const named = options.filter((option) => option.stair === alertStair);
  const best = shortest(named.length > 0 ? named : options);
  return { stair: best.stair, points: [area.door, ...best.points, centre(STAIRS[best.stair])] };
}

/** Everywhere a fire can be marked on a level: each area, then each stairwell. */
export function fireSpots(level: number): { id: string; label: string; point: Point }[] {
  return [
    ...areasOnLevel(level).map((a) => ({ id: a.id, label: a.label, point: centre(a) })),
    ...STAIR_NAMES.map((name) => ({ id: `stair-${name}`, label: `${name[0].toUpperCase()}${name.slice(1)} stairs`, point: centre(STAIRS[name]) })),
  ];
}

export function stairOfSpot(spot: string): StairName | null {
  const name = spot.replace("stair-", "") as StairName;
  return spot.startsWith("stair-") && STAIR_NAMES.includes(name) ? name : null;
}

/** The model is of one building, so another building's alert must not mark anything on it. */
export const isModelBuilding = (building: string | null | undefined) => /administration|อำนวยการ/i.test(building ?? "");

/** Reads "East Stairwell" or "west stairs" from an alert, so the map follows security's instruction. */
export function stairFromInstruction(instruction: string | null | undefined): StairName | null {
  const match = instruction?.match(/\b(north|west|east)\s+stair/i);
  return match ? (match[1].toLowerCase() as StairName) : null;
}
