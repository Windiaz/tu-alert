import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowDown, Box as BoxIcon, Flame, Footprints, HandHelping, RotateCw, X } from "lucide-react";
import { areasOnLevel, findRoute, fireSpots, LOBBY, STAIRS, stairsClosedFor, type ClosedStair, type FireOrigin, type Point, type Route, type StairName } from "../lib/buildingLayout";

// An estimated model of the Faculty of Engineering Administration Building (อาคารอำนวยการ).
// Evidence used:
//   Outline and courtyard: satellite view (long side runs east to west).
//   7 levels: faculty renderings, and room numbers from 2xx to 7xx.
//   Outside links: faculty site plan, 2013. Entrance canopy: renderings.
//   Stairs, and a men's and women's toilet on each level: from the team.
// Room areas, toilet positions and the corridor are a demo layout (see lib/buildingLayout.ts), so
// the screen labels the route as a demo. It is not an official evacuation plan.

const FLOORS = [1, 2, 3, 4, 5, 6, 7];
const WIDTH = 190; // east to west
const DEPTH = 140; // north to south
const WING = 38;
const FLOOR_HEIGHT = 13;
const LIFT = 78;

/** Reads "Floor 3" or "ชั้น 3" from an alert's location. */
export function floorFromLocation(location: string | null | undefined): number | null {
  const match = location?.match(/(?:floor|ชั้น)\s*(\d+)/i);
  const floor = match ? Number(match[1]) : null;
  return floor !== null && FLOORS.includes(floor) ? floor : null;
}

type Look = { wall: string; glass: string; rail?: boolean };

// Colours follow the renderings: grey base, pale middle floors, red rail on level 6.
const LOOKS: Record<number, Look> = {
  1: { wall: "#7d7773", glass: "#ece9e2" },
  2: { wall: "#6c6662", glass: "#8d8782" },
  3: { wall: "#d5d2cc", glass: "#8ea7b5" },
  4: { wall: "#dedbd5", glass: "#9db3bf" },
  5: { wall: "#d5d2cc", glass: "#8ea7b5" },
  6: { wall: "#6c6662", glass: "#4a4745", rail: true },
  7: { wall: "#b9b5ae", glass: "#8ea7b5" },
};
const PICKED: Look = { wall: "#A31D3A", glass: "#f0c3cc" };
const FIRE_LOOK: Look = { wall: "#dc2626", glass: "#fecaca" };
const YOUR_LEVEL: Look = { wall: "#2563eb", glass: "#bfdbfe" };

function facade({ wall, glass, rail }: Look, sideways: boolean) {
  const across = sideways ? "0deg" : "90deg";
  const down = sideways ? "to right" : "to bottom";
  const layers = [`linear-gradient(${down}, ${wall} 0 3px, transparent 3px)`];
  if (rail) layers.push(`linear-gradient(${down}, transparent 45%, #a3273a 45% 70%, transparent 70%)`);
  layers.push(`repeating-linear-gradient(${across}, ${wall} 0 3px, ${glass} 3px 10px)`);
  return layers.join(", ");
}

const FACE: CSSProperties = { position: "absolute", backfaceVisibility: "hidden", transition: "opacity 300ms" };

type BoxProps = { x: number; y: number; w: number; d: number; z: number; h: number; top: string; south: string; east: string; opacity?: number; topOpacity?: number; topClass?: string };

function Box({ x, y, w, d, z, h, top, south, east, opacity = 1, topOpacity = opacity, topClass }: BoxProps) {
  const common = { ...FACE, opacity };
  return (
    <>
      <div className={topClass} style={{ ...common, opacity: topOpacity, left: x, top: y, width: w, height: d, background: top, transform: `translateZ(${z + h}px)` }} />
      <div style={{ ...common, left: x, top: y + d, width: w, height: h, background: south, transformOrigin: "top", transform: `translateZ(${z + h}px) rotateX(-90deg)`, boxShadow: "inset 0 0 0 99px rgb(0 0 0 / 0.04)" }} />
      <div style={{ ...common, left: x, top: y, width: w, height: h, background: south, transformOrigin: "top", transform: `translateZ(${z}px) rotateX(90deg)`, boxShadow: "inset 0 0 0 99px rgb(0 0 0 / 0.2)" }} />
      <div style={{ ...common, left: x + w, top: y, width: h, height: d, background: east, transformOrigin: "left", transform: `translateZ(${z + h}px) rotateY(90deg)`, boxShadow: "inset 0 0 0 99px rgb(0 0 0 / 0.1)" }} />
      <div style={{ ...common, left: x, top: y, width: h, height: d, background: east, transformOrigin: "left", transform: `translateZ(${z}px) rotateY(-90deg)`, boxShadow: "inset 0 0 0 99px rgb(0 0 0 / 0.14)" }} />
    </>
  );
}

// North and south wings run the full width, east and west wings fit between them.
function ring(over = 0) {
  return [
    { x: -over, y: -over, w: WIDTH + 2 * over, d: WING + 2 * over },
    { x: -over, y: DEPTH - WING - over, w: WIDTH + 2 * over, d: WING + 2 * over },
    { x: -over, y: WING, w: WING + 2 * over, d: DEPTH - 2 * WING },
    { x: WIDTH - WING - over, y: WING, w: WING + 2 * over, d: DEPTH - 2 * WING },
  ];
}

function Plane({ x, y, w, d, z, color }: { x: number; y: number; w: number; d: number; z: number; color: string }) {
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: d, background: color, transform: `translateZ(${z}px)` }} />;
}

function Compass({ letter, x, y }: { letter: string; x: number; y: number }) {
  return (
    <span style={{ position: "absolute", left: x, top: y, width: 16, textAlign: "center", transform: "translateZ(1px)" }} className="text-sm font-extrabold text-ink">
      {letter}
    </span>
  );
}

const TILT = 58;
const sceneTransform = (angle: number, scale: number) => `translateY(${36 * scale}px) rotateX(${TILT}deg) rotateZ(${angle}deg) scale3d(${scale}, ${scale}, ${scale})`;

// The floor plan's coordinates, in this model's units.
const scenePoint = ({ x, y }: Point) => ({ x: ((x - 70) * WIDTH) / 240, y: ((y - 55) * DEPTH) / 180 });
const levelBase = (level: number) => (level - 1) * FLOOR_HEIGHT;

/** Stands upright and keeps facing the viewer while the building turns. Its bottom centre sits on the spot. */
function Billboard({ at, z, size, children }: { at: Point; z: number; size: number; children: ReactNode }) {
  const { x, y } = scenePoint(at);
  return (
    <div
      style={{ position: "absolute", left: x - size / 2, top: y - size, width: size, height: size, transformOrigin: "50% 100%", transform: `translateZ(${z}px) rotateZ(calc(var(--turn) * -1)) rotateX(-${TILT}deg)` }}
      className="flex items-end justify-center"
    >
      {children}
    </div>
  );
}

function Shaft({ name, from, to, color }: { name: StairName; from: number; to: number; color: string }) {
  if (to <= from) return null;
  const box = STAIRS[name];
  // Thin and see-through, so the fire and the route behind a stairwell stay visible.
  const size = 14;
  const { x, y } = scenePoint({ x: box.x + box.w / 2, y: box.y + box.h / 2 });
  return <Box x={x - size / 2} y={y - size / 2} w={size} d={size} z={levelBase(from)} h={(to - from) * FLOOR_HEIGHT} top={color} south={color} east={color} opacity={0.6} />;
}

const SHAFT_OPEN = "#facc15";
const SHAFT_ROUTE = "#16a34a";
const SHAFT_CLOSED = "#b91c1c";

export type HelpPin = { id: string; level: number; area: string };

/** What the alert says about the building: fire, closed stairs, people asking for help, and this person's way out. */
function AlertMarks({ picked, fire, closed, route, help }: { picked: number | null; fire: FireOrigin | null; closed: ClosedStair[]; route: Route | null; help: HelpPin[] }) {
  const firePoint = fire && fireSpots(fire.level).find((spot) => spot.id === fire.spot)?.point;
  return (
    <>
      {(Object.keys(STAIRS) as StairName[]).map((name) => {
        const closedFrom = closed.find((c) => c.stair === name)?.level ?? FLOORS.length + 1;
        const routeTop = route?.stair === name && picked ? picked : 0;
        return (
          <div key={name} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
            <Shaft name={name} from={1} to={routeTop + 1} color={SHAFT_ROUTE} />
            <Shaft name={name} from={Math.max(routeTop + 1, 1)} to={closedFrom} color={SHAFT_OPEN} />
            <Shaft name={name} from={closedFrom} to={FLOORS.length + 1} color={SHAFT_CLOSED} />
            {closedFrom <= FLOORS.length && (
              <Billboard at={{ x: STAIRS[name].x + STAIRS[name].w / 2, y: STAIRS[name].y + STAIRS[name].h / 2 }} z={FLOORS.length * FLOOR_HEIGHT} size={24}>
                <span className="grid size-6 place-items-center rounded-full border-2 border-white bg-red-700 text-white">
                  <X className="size-4" strokeWidth={3.5} aria-hidden="true" />
                </span>
              </Billboard>
            )}
          </div>
        );
      })}

      {route && picked && (
        <>
          <svg viewBox="70 55 240 180" preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: DEPTH, overflow: "visible", transform: `translateZ(${levelBase(picked) + FLOOR_HEIGHT + 1}px)` }}>
            <polyline points={route.points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
            <polyline className="route-flow" points={route.points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#15803d" strokeWidth="6" strokeLinejoin="round" strokeDasharray="12 6" />
          </svg>
          <Billboard at={route.points[0]} z={levelBase(picked) + FLOOR_HEIGHT + 1} size={28}>
            <span className="rounded-full border-2 border-white bg-emerald-700 px-1.5 text-[10px] leading-4 font-bold text-white">You</span>
          </Billboard>
          <div className="stair-fall" style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateZ(${levelBase(picked)}px)`, "--from": `${levelBase(picked)}px` } as CSSProperties}>
            <Billboard at={route.points[route.points.length - 1]} z={FLOOR_HEIGHT} size={22}>
              <span className="grid size-5 place-items-center rounded-full border-2 border-white bg-emerald-700 text-white">
                <ArrowDown className="size-3.5" strokeWidth={3} aria-hidden="true" />
              </span>
            </Billboard>
          </div>
        </>
      )}

      {help.map((pin) => {
        const point = fireSpots(pin.level).find((spot) => spot.id === pin.area)?.point;
        return (
          point && (
            <Billboard key={pin.id} at={point} z={levelBase(pin.level) + FLOOR_HEIGHT} size={30}>
              <span className="flex items-center gap-0.5 rounded-full border-2 border-white bg-blue-700 px-1 text-[9px] leading-3 font-extrabold text-white">
                <HandHelping className="size-3" aria-hidden="true" /> HELP
              </span>
            </Billboard>
          )
        );
      })}

      {fire && firePoint && (
        <Billboard at={firePoint} z={levelBase(fire.level) + 2} size={38}>
          <span className="fire-flicker flex flex-col items-center">
            <Flame className="size-8 fill-orange-500 text-red-700" strokeWidth={2} aria-hidden="true" />
            <span className="rounded bg-red-700 px-1 text-[9px] leading-3 font-extrabold text-white">FIRE</span>
          </span>
        </Billboard>
      )}
    </>
  );
}

// large is for the projected admin page, where the whole room needs to see it.
type Model3DProps = { picked?: number | null; fire: FireOrigin | null; closed: ClosedStair[]; route?: Route | null; help?: HelpPin[]; large?: boolean };

export function Model3D({ picked = null, fire, closed, route = null, help = [], large = false }: Model3DProps) {
  const scale = large ? 1.7 : 1;
  const scene = useRef<HTMLDivElement>(null);
  const angle = useRef(-35);
  const dragX = useRef<number | null>(null);
  // With something to show inside the building, the walls turn see-through instead of floors lifting away.
  const seeThrough = fire !== null || closed.length > 0 || route !== null || help.length > 0;

  // Written straight to the element: re-rendering every face on each drag move would be slow on a phone.
  const turnTo = (next: number) => {
    angle.current = next;
    if (scene.current) {
      scene.current.style.transform = sceneTransform(next, scale);
      scene.current.style.setProperty("--turn", `${next}deg`);
    }
  };
  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragX.current === null) return;
    turnTo(angle.current + (event.clientX - dragX.current) * 0.6);
    dragX.current = event.clientX;
  };
  const onUp = () => {
    dragX.current = null;
  };

  return (
    <div className="relative">
      <div
        role="img"
        aria-label={[
          "3D model of the building, 7 levels around a courtyard",
          picked && `level ${picked} highlighted`,
          fire && `fire started on level ${fire.level}`,
          ...closed.map((c) => `${c.stair} stairs closed from level ${c.level} up`),
          route && `your route uses the ${route.stair} stairs`,
          help.length > 0 && `help requests marked: ${help.length}`,
        ]
          .filter(Boolean)
          .join(", ")}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={`relative cursor-grab touch-pan-y overflow-hidden rounded-xl bg-sky-100 select-none ${large ? "h-[30rem]" : "h-72"}`}
        style={{ perspective: 800 * scale }}
      >
        <div
          ref={scene}
          style={{ position: "absolute", left: "50%", top: "50%", width: WIDTH, height: DEPTH, marginLeft: -WIDTH / 2, marginTop: -DEPTH / 2, transformStyle: "preserve-3d", transform: sceneTransform(angle.current, scale), "--turn": `${angle.current}deg` } as CSSProperties}
        >
          <Plane x={-44} y={-44} w={WIDTH + 88} d={DEPTH + 96} z={0} color="#d9d4ca" />
          <Plane x={-16} y={0} w={WIDTH + 32} d={DEPTH + 18} z={0.2} color="#4f8275" />
          <Plane x={-4} y={-4} w={WIDTH + 8} d={DEPTH + 8} z={0.4} color="#ece8df" />
          <Plane x={WING} y={WING} w={WIDTH - 2 * WING} d={DEPTH - 2 * WING} z={0.6} color="#6f9a62" />
          <Plane x={WIDTH / 2 - 20} y={DEPTH} w={40} d={46} z={0.8} color="#f4f1ea" />
          <Compass letter="N" x={WIDTH / 2 - 8} y={-38} />
          <Compass letter="S" x={WIDTH / 2 - 8} y={DEPTH + 28} />
          <Compass letter="E" x={WIDTH + 24} y={DEPTH / 2 - 10} />
          <Compass letter="W" x={-40} y={DEPTH / 2 - 10} />

          <Box x={WIDTH / 2 - 26} y={DEPTH - 2} w={52} d={30} z={FLOOR_HEIGHT * 2} h={3} top="#ece4d2" south="#cfc6b3" east="#cfc6b3" />

          {FLOORS.map((floor) => {
            const onFire = fire?.level === floor;
            const look = onFire ? FIRE_LOOK : floor === picked ? (seeThrough ? YOUR_LEVEL : PICKED) : LOOKS[floor];
            const above = !seeThrough && picked !== null && floor > picked;
            const sideOpacity = seeThrough ? (onFire || floor === picked ? 0.4 : 0.1) : above ? 0.14 : 1;
            const topOpacity = seeThrough ? (onFire ? 0.55 : floor === picked ? 0.45 : 0.03) : sideOpacity;
            return (
              <div
                key={floor}
                className="motion-safe:transition-transform motion-safe:duration-300"
                style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateZ(${above ? LIFT : 0}px)` }}
              >
                {ring().map((wing, index) => (
                  <Box
                    key={index}
                    {...wing}
                    z={levelBase(floor)}
                    h={FLOOR_HEIGHT}
                    top={onFire ? "#ef4444" : floor === picked ? (seeThrough ? "#3b82f6" : "#c23a56") : look.wall}
                    south={facade(look, false)}
                    east={facade(look, true)}
                    opacity={sideOpacity}
                    topOpacity={topOpacity}
                    topClass={onFire ? "fire-floor" : undefined}
                  />
                ))}
              </div>
            );
          })}

          <div
            className="motion-safe:transition-transform motion-safe:duration-300"
            style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateZ(${!seeThrough && picked !== null ? LIFT : 0}px)` }}
          >
            {ring(4).map((wing, index) => (
              <Box key={index} {...wing} z={FLOORS.length * FLOOR_HEIGHT} h={5} top="#e3b75f" south="#c9973f" east="#c9973f" opacity={seeThrough ? 0.05 : picked !== null ? 0.14 : 1} />
            ))}
          </div>

          {seeThrough && <AlertMarks picked={picked} fire={fire} closed={closed} route={route} help={help} />}
        </div>
      </div>
      <button
        type="button"
        onClick={() => turnTo(angle.current + 45)}
        className="absolute top-2 right-2 flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-bold text-ink"
      >
        <RotateCw className="size-4" aria-hidden="true" /> Turn
      </button>
    </div>
  );
}

// Outside links, from the faculty site plan. Which level each one joins is not known.
const LINKS = ["M108 55V26", "M171 55V26", "M267 55V26", "M310 181H352", "M70 109H28"];

// Treads run across the direction of the wing.
function Stairs({ x, y, w, h, closed }: { x: number; y: number; w: number; h: number; closed: boolean }) {
  if (closed) {
    return (
      <g stroke="#7f1d1d" strokeWidth="2.5">
        <rect x={x} y={y} width={w} height={h} fill="#fecaca" />
        <path d={`M${x} ${y}L${x + w} ${y + h}M${x + w} ${y}L${x} ${y + h}`} fill="none" />
      </g>
    );
  }
  const treads = [1, 2, 3].map((step) => (w > h ? `M${x + (w * step) / 4} ${y}v${h}` : `M${x} ${y + (h * step) / 4}h${w}`));
  return (
    <g stroke="#1f2937" strokeWidth="1.5">
      <rect x={x} y={y} width={w} height={h} fill="#fde047" />
      <path d={treads.join("")} fill="none" />
    </g>
  );
}

type PlanProps = { floor: number; area?: string; route?: Point[]; shut: StairName[]; firePoint?: Point; onArea?: (id: string) => void };

function FloorPlan({ floor, area, route, shut, firePoint, onArea }: PlanProps) {
  const line = route?.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox="0 0 380 300" role="img" aria-label={`Demo plan of level ${floor}: room areas around a corridor and courtyard, with stairs in the north, west and east wings, men's and women's toilets beside the north stairs, and the main entrance on the south side${firePoint ? ". Fire started on this level" : ""}${shut.length ? `. Closed: ${shut.join(" and ")} stairs` : ""}${route ? ". Your route is in green" : ""}`} className="w-full rounded-xl border border-line bg-[#f4f1ea]">
      <defs>
        <marker id="route-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10Z" fill="#15803d" />
        </marker>
      </defs>
      <rect x="56" y="55" width="268" height="194" fill="#a9cbbf" />
      {LINKS.map((d) => (
        <path key={d} d={d} fill="none" stroke="#64748b" strokeWidth="5" strokeDasharray="7 5" />
      ))}
      <rect x="165" y="235" width="50" height="34" fill="#e7dfcd" stroke="#64748b" />
      <rect x="70" y="55" width="240" height="180" fill="#f7e3e7" stroke="#A31D3A" strokeWidth="2" />
      <rect x="118" y="103" width="144" height="84" fill="#b5cda9" stroke="#A31D3A" />
      {areasOnLevel(floor).map((a) => (
        <g key={a.id} onClick={onArea && (() => onArea(a.id))} className={onArea ? "cursor-pointer" : undefined}>
          <rect x={a.x} y={a.y} width={a.w} height={a.h} fill={a.id === area ? "#A31D3A" : a.toilet ? "#dbeafe" : "#fff"} stroke="#A31D3A" />
          {a.toilet && (
            <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 3.5} fontSize="9" fontWeight="700" textAnchor="middle" fill={a.id === area ? "#fff" : "#1f2937"}>
              {a.toilet}
            </text>
          )}
        </g>
      ))}
      {floor === 1 && (
        <g>
          <rect x={LOBBY.x} y={LOBBY.y} width={LOBBY.w} height={LOBBY.h} fill="#f7e3e7" stroke="#A31D3A" />
          <text x="186" y="221" fontSize="9" fontWeight="600" textAnchor="end" fill="#1f2937">Lobby</text>
        </g>
      )}
      {Object.entries(STAIRS).map(([name, { x, y, w, h }]) => (
        <Stairs key={name} x={x} y={y} w={w} h={h} closed={shut.includes(name as StairName)} />
      ))}
      {line && (
        <g fill="none" strokeLinejoin="round" strokeLinecap="round">
          <polyline points={line} stroke="#fff" strokeWidth="8" />
          <polyline className="route-flow" points={line} stroke="#15803d" strokeWidth="4.5" strokeDasharray="12 6" markerEnd="url(#route-arrow)" />
        </g>
      )}
      {firePoint && (
        <g className="pointer-events-none">
          <circle cx={firePoint.x} cy={firePoint.y} r="15" fill="#fff" stroke="#b91c1c" strokeWidth="2" />
          <Flame x={firePoint.x - 11} y={firePoint.y - 11} width={22} height={22} className="fill-orange-500 text-red-700" aria-hidden="true" />
        </g>
      )}
      <g fontSize="13" fontWeight="600" textAnchor="middle" fill="#1f2937">
        <text x="190" y="150">Courtyard</text>
        <text x="190" y="18">Links to lab buildings</text>
        <text x="190" y="290">Main entrance, facing pond</text>
        <text x="362" y="181" transform="rotate(90 362 181)">Car park</text>
        <text x="18" y="109" transform="rotate(-90 18 109)">Link</text>
      </g>
      <g fontSize="13" fontWeight="800" fill="#1f2937" textAnchor="middle">
        <path d="M340 44V18M340 18l-5 9M340 18l5 9" stroke="#1f2937" strokeWidth="2" fill="none" />
        <text x="340" y="60">N</text>
      </g>
    </svg>
  );
}

type KeyProps = { fire: FireOrigin | null; closed: ClosedStair[]; level?: number | null; hasRoute?: boolean; hasHelp?: boolean };

/** Explains the colours in the 3D view. Nothing to explain until the view shows alert marks. */
export function ModelKey({ fire, closed, level = null, hasRoute = false, hasHelp = false }: KeyProps) {
  if (!fire && closed.length === 0 && !hasRoute && !hasHelp) return null;
  const swatch = (label: string, color: string) => (
    <li className="flex items-center gap-1">
      <span className="size-3 rounded-sm" style={{ background: color }} /> {label}
    </li>
  );
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
      {fire && (
        <li className="flex items-center gap-1">
          <Flame className="size-4 fill-orange-500 text-red-700" aria-hidden="true" /> Fire start
        </li>
      )}
      {fire && swatch(`Fire level: ${fire.level}`, "#ef4444")}
      {level !== null && swatch(`Your level: ${level}`, "#3b82f6")}
      {closed.length > 0 && swatch("Closed stairs", SHAFT_CLOSED)}
      {swatch("Open stairs", SHAFT_OPEN)}
      {hasRoute && swatch("Your route", SHAFT_ROUTE)}
      {hasHelp && swatch("Needs help", "#1d4ed8")}
    </ul>
  );
}

export const ROUTE_SECTION_ID = "exit-route";

const STAIR_LABEL: Record<StairName, string> = { north: "North stairs", west: "West stairs", east: "East stairs" };

type ModelProps = { alertFloor?: number | null; alertStair?: StairName | null; assembly?: string | null; closed?: ClosedStair[]; fire?: FireOrigin | null; onPlaceChange?: (level: number | null, area: string) => void };

export function BuildingModel({ alertFloor = null, alertStair = null, assembly = null, closed = [], fire = null, onPlaceChange }: ModelProps) {
  const [picked, setPicked] = useState<number | null>(alertFloor ?? fire?.level ?? null);
  const [area, setArea] = useState("");
  const areas = picked ? areasOnLevel(picked) : [];
  const route = picked && area ? findRoute(picked, area, alertStair, closed, fire) : null;
  const firePlace = fire ? fireSpots(fire.level).find((spot) => spot.id === fire.spot) : undefined;
  const noWayOut = picked !== null && picked > 1 && area !== "" && route === null;
  const shut = picked ? stairsClosedFor(picked, closed) : [];
  const noStairs = shut.length === Object.keys(STAIRS).length;
  const pickLevel = (level: number | null) => {
    setPicked(level);
    setArea("");
    onPlaceChange?.(level, "");
  };
  const pickArea = (id: string) => {
    setArea(id);
    onPlaceChange?.(picked, id);
  };
  const chip = "h-11 rounded-lg border text-sm font-bold";

  return (
    <section className="rounded-2xl bg-white p-4 text-ink">
      <h3 className="flex items-center gap-2 font-bold">
        <BoxIcon className="size-5 shrink-0 text-brand" aria-hidden="true" /> Administration Building 3D
      </h3>
      <p className="text-sm text-muted">อาคารอำนวยการ, Faculty of Engineering</p>
      <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-sm font-semibold leading-snug">
        Demo layout, not an official evacuation plan. Room areas, toilets and routes are estimated. Always follow exit signs and staff.
      </p>
      {alertFloor !== null && <p className="mt-2 text-sm font-bold text-alert">Alert location: level {alertFloor}</p>}

      <div id={ROUTE_SECTION_ID} className="mt-3 grid scroll-mt-3 grid-cols-8 gap-1" role="group" aria-label="Choose a level">
        <button type="button" aria-pressed={picked === null} onClick={() => pickLevel(null)} className={`${chip} ${picked === null ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
          All
        </button>
        {FLOORS.map((floor) => (
          <button
            key={floor}
            type="button"
            aria-pressed={picked === floor}
            aria-label={`Level ${floor}${floor === alertFloor ? ", alert location" : ""}`}
            onClick={() => pickLevel(floor)}
            className={`${chip} ${picked === floor ? "border-brand bg-brand text-white" : floor === alertFloor ? "border-alert bg-red-50 text-alert" : "border-line bg-white"}`}
          >
            {floor}
          </button>
        ))}
      </div>

      {picked === null ? (
        <p className="mt-3 text-sm font-semibold">Choose your level to find your exit route.</p>
      ) : (
        <div className="mt-2">
          {picked === 1 ? (
            <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold leading-snug">
              You are on level 1. Leave by the nearest exit{fire?.level === 1 ? " away from the fire" : ""}.{assembly && ` Assemble at ${assembly}.`}
            </p>
          ) : noStairs ? (
            <p role="alert" className="rounded-xl border-2 border-alert bg-red-50 p-3 text-sm font-bold leading-snug text-alert">
              All stairs are closed from your level. Call Campus Security now and follow staff instructions.
            </p>
          ) : (
            <label className="block font-bold">
              <span className="flex items-center gap-2">
                <Footprints className="size-5 text-brand" aria-hidden="true" /> Find your exit route
              </span>
              <select value={area} onChange={(event) => pickArea(event.target.value)} className="mt-1.5 h-12 w-full rounded-lg border border-line bg-white px-3 text-base font-semibold">
                <option value="">Where are you on level {picked}?</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {route && (
            <ol role="status" className="mt-3 list-decimal space-y-1 rounded-xl border border-emerald-300 bg-emerald-50 p-3 pl-8 text-sm font-semibold leading-snug">
              <li>
                Follow the corridor to the {STAIR_LABEL[route.stair]}.
                {route.stair === alertStair && <span className="font-normal"> Named in this alert.</span>}
              </li>
              <li>
                Go down to level 1. Do not use elevators.
                {fire && fire.level > 1 && picked !== null && fire.level < picked && ` Do not leave the stairs on level ${fire.level}, where the fire started.`}
              </li>
              <li>Leave by the nearest exit on level 1.</li>
              {assembly && <li>Assemble at {assembly}.</li>}
            </ol>
          )}
          {noWayOut && !noStairs && (
            <p role="alert" className="mt-3 rounded-xl border-2 border-alert bg-red-50 p-3 text-sm font-bold leading-snug text-alert">
              No safe route from here on this map. Call Campus Security now and follow staff instructions.
            </p>
          )}
          {route && <p className="mt-2 text-sm font-semibold">If smoke or fire blocks this way, use other stairs and follow staff.</p>}
        </div>
      )}

      <div className="mt-3">
        <Model3D picked={picked} fire={fire} closed={closed} route={route} />
      </div>
      <p className="mt-1 text-xs text-muted">Drag or tap Turn to rotate.</p>
      <ModelKey fire={fire} closed={closed} level={picked} hasRoute={route !== null} />

      {picked !== null && (
        <div className="mt-3">
          <h4 className="mb-1.5 font-bold">Level {picked}</h4>
          <FloorPlan floor={picked} area={area} route={route?.points} shut={shut} firePoint={fire?.level === picked ? firePlace?.point : undefined} onArea={picked === 1 || noStairs ? undefined : pickArea} />
          <p className="mt-2 text-sm leading-snug">
            {picked === 1 ? "" : "White boxes are room areas, and you can tap yours. "}Yellow blocks are stairs, and blue boxes are toilets.{shut.length > 0 && " Red crossed blocks are closed stairs."} Dashed lines are outside links, on an unknown level.
          </p>
        </div>
      )}

      <p className="mt-3 border-t border-line pt-2 text-xs leading-snug text-muted">
        Outline from a satellite view, Thammasat School of Engineering renderings and the faculty site plan (2013). Stairs marked by our team. Room areas and toilet positions are guessed for this demo.
      </p>
    </section>
  );
}
