// The six scenes, each a function of the snapped frame. Frame numbers are the beat sheet in
// ../SCRIPT.md (a beat is 15 frames; a pose is 2.5).
import React from "react";
import { random } from "remotion";
import { BEAT, C, STEP, UI, boilT, lerp, outBack, outCubic, prog } from "./lib";
import { AppIcon, Croissant, Cup, Cut, PHONE, Phone, Pointer, Skel, Stamp, Steam, TapRing, uiText } from "./parts";

export const S = { hook: 0, app: 75, order: 135, stamps: 180, alert: 240, end: 292.5, black: 327.5, total: 345 };

/** Where the phone sits in scenes 2 to 5, and its screen's top-left corner on the frame. */
const PX = 540, PY = 1230;
const SX = PX - PHONE.w / 2 + PHONE.bezel, SY = PY - PHONE.h / 2 + PHONE.bezel;
const SW = PHONE.w - 2 * PHONE.bezel;

/** A scene's ground and camera: a slow stepped push, a small roll, and a one-pose kick on every beat. */
const Stage: React.FC<{ f: number; from: number; to: number; bg: string; roll: number; children: React.ReactNode }> = ({ f, from, to, bg, roll, children }) => {
  const t = prog(f, from, to);
  const kick = (f - from) % BEAT < STEP - 1e-6 && f > from + 1 ? 0.018 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.045 * t + kick}) rotate(${roll * t}deg)` }}>{children}</div>
    </div>
  );
};

const hop = (f: number, at: number) => ((f - at) % BEAT < STEP - 1e-6 && f >= at ? -34 : 0);

/* 1. The hook: who it is for, from the first frame. */
const Hook: React.FC<{ f: number }> = ({ f }) => {
  const cupY = lerp(2350, 1450, outBack(prog(f, 2.5, 15), 1.4));
  const cupSq = f >= 15 && f < 15 + STEP ? 0.88 : 1;
  const ct = prog(f, 30, 45);
  const crX = lerp(1450, 770, outCubic(ct));
  const crY = 1470 - Math.sin(Math.PI * ct) * 300;
  const crSq = f >= 45 && f < 45 + STEP ? 0.86 : 1;
  return (
    <Stage f={f} from={S.hook} to={S.app} bg={C.warm} roll={-0.8}>
      <Stamp id="coffee" text="COFFEE" f={f} start={0} y={380} size={300} color={C.paper} />
      <Stamp id="shop" text="SHOP?" f={f} start={15} y={650} size={300} color={C.paper} />
      <Stamp id="bakery" text="BAKERY?" f={f} start={30} y={905} size={240} color={C.ink} />
      {f >= 15 && <Cut id="steam1" f={f} x={330} y={cupY - 300} w={260}><Steam id="st1" f={f} w={240} /></Cut>}
      <Cut id="cup1" f={f} x={330} y={cupY + hop(f, 30)} w={380} sy={cupSq}><Cup w={360} /></Cut>
      {f >= 30 && <Cut id="cro1" f={f} x={crX} y={crY + hop(f, 60)} w={440} rot={-8} sy={crSq}><Croissant w={420} /></Cut>}
    </Stage>
  );
};

/* 2. Get your own app: the phone drops in, the café's icon lands on the home screen, one tap opens it. */
const ICON = { x: 138, y: 380, w: 84 };
const Home: React.FC<{ f: number }> = ({ f }) => {
  const grow = prog(f, 122.5, 132.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg, #2b5d9c 0%, #173a66 55%, #15181d 100%)" }}>
      {Array.from({ length: 20 }, (_, i) => {
        const c = i % 4, r = Math.floor(i / 4);
        if (c === 1 && r === 2) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 30 + c * 108, top: 120 + r * 130 }}>
            <div style={{ width: ICON.w, height: ICON.w, borderRadius: 20, background: `rgba(255,255,255,${0.14 + 0.1 * random(`ic${i}`)})` }} />
            <Skel w={56} h={10} c="rgba(255,255,255,0.22)" style={{ margin: "10px auto 0" }} />
          </div>
        );
      })}
      {f >= 105 && (
        <div style={{ position: "absolute", left: ICON.x, top: ICON.y, width: ICON.w, transform: `${boilT("icon", f, 0.4)} scale(${f < 107.5 ? 1.8 : f < 110 ? 0.88 : 1}) rotate(${f < 107.5 ? -12 : 0}deg)` }}>
          <AppIcon w={ICON.w} />
          <div style={{ ...uiText(17, 600, C.white), textAlign: "center", marginTop: 8, whiteSpace: "nowrap", marginLeft: -20, marginRight: -20 }}>Your Café</div>
        </div>
      )}
      {grow > 0 && (
        <div
          style={{
            position: "absolute", background: C.warm,
            left: lerp(ICON.x, 0, outCubic(grow)), top: lerp(ICON.y, 0, outCubic(grow)),
            width: lerp(ICON.w, SW, outCubic(grow)), height: lerp(ICON.w, PHONE.h - 2 * PHONE.bezel, outCubic(grow)),
            borderRadius: lerp(20, 58, grow),
          }}
        />
      )}
    </div>
  );
};

const App: React.FC<{ f: number }> = ({ f }) => {
  const dropY = lerp(-800, PY, outBack(prog(f, 75, 90), 1.2));
  const sq = f >= 90 && f < 90 + STEP ? 0.93 : 1;
  const tip = { x: SX + ICON.x + ICON.w / 2, y: SY + ICON.y + ICON.w / 2 };
  return (
    <Stage f={f} from={S.app} to={S.order} bg={C.blue} roll={0.9}>
      <Stamp id="get" text="GET YOUR" f={f} start={75} y={320} size={235} color={C.paper} />
      <Stamp id="own" text="OWN APP." f={f} start={85} y={560} size={235} color={C.gold} />
      <Phone id="ph2" f={f} x={PX} y={dropY} sy={sq}><Home f={f} /></Phone>
      <TapRing f={f} at={120} x={tip.x} y={tip.y} />
      <Pointer f={f} show={[107.5, 125]} press={[120]} keys={[{ f: 107.5, x: 1020, y: 1950 }, { f: 117.5, x: tip.x, y: tip.y }]} />
    </Stage>
  );
};

/* 3. Order ahead. */
const OrderScreen: React.FC<{ f: number }> = ({ f }) => {
  const pressed = f >= 150 && f < 155;
  const done = f >= 150;
  const tk = prog(f, 165, 172.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.paper }}>
      <div style={{ height: 190, background: C.warm, padding: "0 34px", display: "flex", alignItems: "flex-end", paddingBottom: 26, boxSizing: "border-box" }}>
        <div style={uiText(40, 800, C.white)}>Your Café</div>
      </div>
      <div style={{ margin: "30px 26px 0", background: C.white, borderRadius: 34, padding: 26, boxShadow: "0 2px 0 rgba(0,0,0,0.06)" }}>
        <div style={{ height: 280, borderRadius: 24, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: boilT("ocup", f, 0.6), marginTop: 40 }}><Cup w={150} /></div>
        </div>
        <div style={{ ...uiText(44, 800), marginTop: 22 }}>Oat latte</div>
        <Skel w={300} style={{ marginTop: 14 }} />
        <Skel w={210} style={{ marginTop: 10 }} />
        <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
          {["S", "M", "L"].map((s) => (
            <div key={s} style={{ width: 66, height: 52, borderRadius: 26, background: s === "M" ? C.ink : C.grey, color: s === "M" ? C.white : C.body, ...uiText(24, 700, s === "M" ? C.white : C.body), display: "flex", alignItems: "center", justifyContent: "center" }}>{s}</div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute", left: 26, right: 26, top: 800, height: 100, borderRadius: 50, background: done ? C.ink : C.blue,
          display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pressed ? 0.94 : 1})`,
          ...uiText(38, 800, C.white),
        }}
      >
        {done ? "Ordered" : "Order ahead"}
      </div>
      {tk > 0 && (
        <div
          style={{
            position: "absolute", left: 22, right: 22, top: lerp(-180, 210, outBack(tk, 1.6)), height: 150, borderRadius: 30, background: C.ink,
            display: "flex", alignItems: "center", gap: 22, padding: "0 28px", boxSizing: "border-box", boxShadow: "0 10px 0 rgba(0,0,0,0.18)",
            transform: boilT("ticket", f, 0.6),
          }}
        >
          <div style={{ width: 74, height: 74, borderRadius: 37, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={40} height={40} viewBox="0 0 40 40"><path d="M8 21 L17 30 L33 11" fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <div style={uiText(34, 800, C.white)}>Ready for pickup</div>
            <Skel w={170} h={14} c="rgba(255,255,255,0.25)" style={{ marginTop: 10 }} />
          </div>
        </div>
      )}
    </div>
  );
};

const Order: React.FC<{ f: number }> = ({ f }) => {
  const btn = { x: PX, y: SY + 850 };
  return (
    <Stage f={f} from={S.order} to={S.stamps} bg={C.cream} roll={-0.9}>
      <Stamp id="order" text="ORDER" f={f} start={135} y={320} size={260} color={C.ink} />
      <Stamp id="ahead" text="AHEAD." f={f} start={145} y={570} size={260} color={C.warm} />
      <Phone id="ph3" f={f} x={PX} y={PY}><OrderScreen f={f} /></Phone>
      <Cut id="cup3" f={f} x={150} y={1560 + hop(f, 135)} w={230} rot={-6}><Cup w={210} /></Cut>
      <TapRing f={f} at={150} x={btn.x} y={btn.y} />
      <Pointer f={f} show={[135, 165]} press={[150]} keys={[{ f: 135, x: 1030, y: 1950 }, { f: 145, x: btn.x + 40, y: btn.y }]} />
    </Stage>
  );
};

/* 4. Stamp cards: a rubber stamp thumps five cups onto the card; the sixth is free. */
const STAMPS = [187.5, 195, 202.5, 210, 217.5, 225];
const DOT = (i: number) => ({ x: [94, 234, 374][i % 3], y: [345, 485][Math.floor(i / 3)] });

const StampScreen: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", inset: 0, background: C.cream }}>
    <div style={{ ...uiText(30, 700, C.body), position: "absolute", left: 34, top: 110 }}>Your Café</div>
    <div style={{ ...uiText(54, 900), position: "absolute", left: 34, top: 150 }}>Stamp card</div>
    <div style={{ position: "absolute", left: 22, right: 22, top: 250, height: 330, borderRadius: 34, background: C.white, boxShadow: "0 3px 0 rgba(0,0,0,0.06)" }} />
    {STAMPS.map((at, i) => {
      const d = DOT(i);
      const on = f >= at;
      const age = f - at;
      const s = !on ? 1 : age < STEP ? 1.35 : age < 2 * STEP ? 0.9 : 1;
      const free = i === STAMPS.length - 1;
      return (
        <div
          key={i}
          style={{
            position: "absolute", left: d.x - 58, top: d.y - 58, width: 116, height: 116, borderRadius: 58, boxSizing: "border-box",
            border: on ? "none" : `5px dashed ${C.muted}`, background: on ? (free ? C.gold : C.warm) : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `scale(${s}) rotate(${on ? (random(`sr${i}`) - 0.5) * 24 : 0}deg)`,
          }}
        >
          {on && !free && <AppIcon w={84} />}
          {on && free && <div style={{ ...uiText(30, 900, C.white), letterSpacing: 1 }}>FREE</div>}
        </div>
      );
    })}
    {f >= 225 && <Stamp id="freec" text="FREE COFFEE!" f={f} start={225} per={0} y={700} size={92} color={C.warm} width={SW} />}
  </div>
);

const RubberStamp: React.FC<{ f: number }> = ({ f }) => {
  if (f < 180 || f >= 232.5) return null;
  let i = STAMPS.findIndex((at) => f < at + STEP);
  if (i < 0) i = STAMPS.length - 1;
  const at = STAMPS[i];
  const d = DOT(i);
  const prev = i > 0 ? DOT(i - 1) : { x: 520, y: 1200 };
  const down = f >= at && f < at + STEP;
  const t = prog(f, at - 5, at - STEP);
  const x = SX + lerp(prev.x, d.x, outCubic(t));
  const y = SY + d.y - (down ? 0 : 70);
  const exit = prog(f, 227.5, 232.5);
  return (
    <div style={{ position: "absolute", left: x - 80 + exit * 500, top: y - 210 - exit * 300, filter: "drop-shadow(8px 10px 0 rgba(0,0,0,0.25))", transform: `rotate(${(down ? 0 : -8) + exit * 30}deg) scale(1, ${down ? 0.9 : 1})`, transformOrigin: "50% 100%" }}>
      <svg width={160} height={210} viewBox="0 0 160 210">
        <circle cx="80" cy="44" r="38" fill={C.coffee} />
        <rect x="64" y="70" width="32" height="64" rx="8" fill={C.coffee} />
        <rect x="18" y="128" width="124" height="54" rx="10" fill={C.ink} />
        <rect x="24" y="180" width="112" height="20" rx="5" fill={C.warm} />
      </svg>
    </div>
  );
};

const Stamps: React.FC<{ f: number }> = ({ f }) => (
  <Stage f={f} from={S.stamps} to={S.alert} bg={C.warm} roll={0.8}>
    <Stamp id="stamp" text="STAMP" f={f} start={180} y={320} size={260} color={C.paper} />
    <Stamp id="cards" text="CARDS." f={f} start={190} y={570} size={260} color={C.ink} />
    <Phone id="ph4" f={f} x={PX} y={PY}><StampScreen f={f} /></Phone>
    <RubberStamp f={f} />
  </Stage>
);

/* 5. Fresh-baked alerts: the lock screen, a notification drops in, croissants hop on. */
const AlertScreen: React.FC<{ f: number }> = ({ f }) => {
  const t = prog(f, 255, 262.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #3a2a22 0%, #15181d 80%)" }}>
      <div style={{ ...uiText(132, 300, C.white), textAlign: "center", marginTop: 130, letterSpacing: -3 }}>7:42</div>
      <Skel w={200} h={18} c="rgba(255,255,255,0.3)" style={{ margin: "18px auto 0" }} />
      {t > 0 && (
        <div
          style={{
            position: "absolute", left: 18, right: 18, top: lerp(-220, 380, outBack(t, 1.7)), borderRadius: 36, background: "rgba(255,255,255,0.96)",
            padding: "24px 24px", display: "flex", gap: 20, alignItems: "flex-start", boxShadow: "0 10px 0 rgba(0,0,0,0.25)", transform: boilT("note", f, 0.6),
          }}
        >
          <AppIcon w={76} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={uiText(28, 800)}>Your Café</div>
              <div style={uiText(24, 500, C.muted)}>now</div>
            </div>
            <div style={{ ...uiText(30, 500, C.ink), marginTop: 6 }}>Warm croissants just came out of the oven.</div>
          </div>
        </div>
      )}
    </div>
  );
};

const CROS = [
  { at: 262.5, x: 150, y: 1580, rot: -12, from: -1 },
  { at: 270, x: 935, y: 1500, rot: 10, from: 1 },
  { at: 277.5, x: 160, y: 1250, rot: 6, from: -1 },
];

const Alert: React.FC<{ f: number }> = ({ f }) => (
  <Stage f={f} from={S.alert} to={S.end} bg={C.ink} roll={-0.8}>
    <Stamp id="fresh" text="FRESH-BAKED" f={f} start={240} per={STEP / 2} y={325} size={185} color={C.paper} />
    <Stamp id="alerts" text="ALERTS." f={f} start={250} y={540} size={250} color={C.gold} />
    <Phone id="ph5" f={f} x={PX} y={PY}><AlertScreen f={f} /></Phone>
    {CROS.map((c, i) => {
      if (f < c.at - 7.5) return null;
      const t = prog(f, c.at - 7.5, c.at);
      const x = lerp(c.x + c.from * 500, c.x, outCubic(t));
      const y = c.y - Math.sin(Math.PI * t) * 260;
      const sq = f >= c.at && f < c.at + STEP ? 0.84 : 1;
      return <Cut key={i} id={`cro5${i}`} f={f} x={x} y={y} w={260} rot={c.rot} sy={sq}><Croissant w={250} /></Cut>;
    })}
  </Stage>
);

/* 6. The offer and the address: the last hit bursts into paper, the name stamps in, a click. */
const BITS = Array.from({ length: 18 }, (_, i) => ({
  a: (i / 18) * Math.PI * 2 + random(`ba${i}`) * 0.3,
  v: 26 + random(`bv${i}`) * 22,
  c: [C.warm, C.blue, C.gold, C.ink, C.cream][i % 5],
  s: 34 + random(`bs${i}`) * 40,
  round: i % 3 === 0,
}));

const End: React.FC<{ f: number }> = ({ f }) => {
  const pill = { x: 540, y: 1330 };
  const pressed = f >= 322.5 && f < 327.5;
  const pillOn = f >= 305;
  const age = f - S.end;
  return (
    <Stage f={f} from={S.end} to={S.total} bg={C.paper} roll={0}>
      {age < 25 &&
        BITS.map((b, i) => {
          const x = 540 + Math.cos(b.a) * b.v * age;
          const y = 960 + Math.sin(b.a) * b.v * age + 0.9 * age * age;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: b.s, height: b.s * (b.round ? 1 : 0.6), borderRadius: b.round ? b.s : 4, background: b.c, transform: `rotate(${age * 18 + i * 40}deg)` }} />;
        })}
      <Stamp id="kick" text="APPS FOR CAFÉS & BAKERIES" f={f} start={292.5} per={0} y={560} size={92} color={C.blue} />
      <Stamp id="kingdom" text="KINGDOM" f={f} start={295} per={STEP / 2} y={790} size={270} color={C.ink} />
      <Stamp id="sites" text="SITES" f={f} start={300} per={STEP / 2} y={1045} size={270} color={C.warm} />
      {pillOn && (
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: pill.y - 56, display: "flex", justifyContent: "center",
            transform: `scale(${f < 307.5 ? 1.3 : pressed ? 0.94 : 1})`,
          }}
        >
          <div style={{ background: C.ink, color: C.paper, borderRadius: 56, height: 112, padding: "0 58px", display: "flex", alignItems: "center", fontFamily: UI, fontSize: 58, fontWeight: 700, letterSpacing: -0.5, boxShadow: "8px 10px 0 rgba(0,0,0,0.2)" }}>
            kingdom-sites.com
          </div>
        </div>
      )}
      <TapRing f={f} at={322.5} x={pill.x + 215} y={pill.y + 10} color={C.blue} />
      <Pointer f={f} show={[305, S.total]} press={[322.5]} keys={[{ f: 305, x: 1020, y: 1950 }, { f: 317.5, x: pill.x + 215, y: pill.y + 10 }]} />
    </Stage>
  );
};

export const Picture: React.FC<{ f: number }> = ({ f }) => {
  const black = prog(f, S.black, S.total - 5);
  return (
    <>
      {f < S.app && <Hook f={f} />}
      {f >= S.app && f < S.order && <App f={f} />}
      {f >= S.order && f < S.stamps && <Order f={f} />}
      {f >= S.stamps && f < S.alert && <Stamps f={f} />}
      {f >= S.alert && f < S.end && <Alert f={f} />}
      {f >= S.end && <End f={f} />}
      {black > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: black }} />}
    </>
  );
};
