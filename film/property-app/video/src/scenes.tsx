// The seven scenes, each a function of the snapped frame. Frame numbers are the beat sheet in
// ../SCRIPT.md (a beat is 15 frames; a pose is 2.5). Same timing as the café ad, so the music and
// every sound cue line up unchanged.
import React from "react";
import { random } from "remotion";
import { BEAT, C, STEP, UI, boilT, lerp, outBack, outCubic, prog } from "./lib";
import { Cut, Faucet, House, Key, OldPhone, PHONE, Phone, Pointer, RentIcon, Skel, Stamp, TapRing, uiText } from "./parts";

export const S = { hook: 0, app: 75, order: 135, stamps: 180, alert: 240, back: 292.5, end: 382.5, black: 447.5, total: 465 };

const NAME = "Your Rentals";

/** Where the phone sits in scenes 2 to 5, and its screen's top-left corner on the frame. */
const PX = 540, PY = 1230;
const SX = PX - PHONE.w / 2 + PHONE.bezel, SY = PY - PHONE.h / 2 + PHONE.bezel;
const SW = PHONE.w - 2 * PHONE.bezel;

/** A scene's ground and camera: a slow stepped push, a small roll, and a one-pose kick on every beat. */
const Stage: React.FC<{ f: number; from: number; to: number; bg: string; roll: number; children: React.ReactNode }> = ({ f, from, to, bg, roll, children }) => {
  const t = prog(f, from, to);
  const kick = (f - from) % BEAT < STEP - 1e-6 && f > from + 1 ? 0.006 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.03 * t + kick}) rotate(${roll * 0.6 * t}deg)` }}>{children}</div>
    </div>
  );
};

const hop = (f: number, at: number) => ((f - at) % BEAT < STEP - 1e-6 && f >= at ? -34 : 0);

/* 1. The hook: who it is for, from the first frame. */
const Hook: React.FC<{ f: number }> = ({ f }) => {
  const hY = lerp(2350, 1470, outBack(prog(f, 2.5, 15), 1.4));
  const hSq = f >= 15 && f < 15 + STEP ? 0.88 : 1;
  const kt = prog(f, 30, 45);
  const kX = lerp(1450, 790, outCubic(kt));
  const kY = 1540 - Math.sin(Math.PI * kt) * 320;
  const kSq = f >= 45 && f < 45 + STEP ? 0.86 : 1;
  return (
    <Stage f={f} from={S.hook} to={S.app} bg={C.green} roll={-0.8}>
      <Stamp id="prop" text="PROPERTY" f={f} start={0} y={360} size={240} color={C.paper} />
      <Stamp id="mgr" text="MANAGER?" f={f} start={15} y={610} size={240} color={C.paper} />
      <Stamp id="lots" text="LOTS OF RENTERS?" f={f} start={30} per={STEP / 2} y={840} size={118} color={C.ink} />
      <Cut id="house1" f={f} x={330} y={hY + hop(f, 30)} w={440} sy={hSq}><House w={420} /></Cut>
      {f >= 30 && <Cut id="key1" f={f} x={kX} y={kY + hop(f, 60)} w={420} rot={-14} sy={kSq}><Key w={400} /></Cut>}
    </Stage>
  );
};

/* 2. Get your own app: the phone drops in, the company's icon lands on the home screen, one tap opens it. */
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
          <RentIcon w={ICON.w} />
          <div style={{ ...uiText(17, 600, C.white), textAlign: "center", marginTop: 8, whiteSpace: "nowrap", marginLeft: -30, marginRight: -30 }}>{NAME}</div>
        </div>
      )}
      {grow > 0 && (
        <div
          style={{
            position: "absolute", background: C.green,
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

/* 3. Pay rent in a tap. */
const Check: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 40 40"><path d="M8 21 L17 30 L33 11" fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const RentScreen: React.FC<{ f: number }> = ({ f }) => {
  const pressed = f >= 150 && f < 155;
  const done = f >= 150;
  const tk = prog(f, 165, 172.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.paper }}>
      <div style={{ height: 190, background: C.green, padding: "0 34px", display: "flex", alignItems: "flex-end", paddingBottom: 26, boxSizing: "border-box" }}>
        <div style={uiText(40, 800, C.white)}>{NAME}</div>
      </div>
      <div style={{ margin: "30px 26px 0", background: C.white, borderRadius: 34, padding: 26, boxShadow: "0 2px 0 rgba(0,0,0,0.06)" }}>
        <div style={{ height: 230, borderRadius: 24, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: boilT("ohouse", f, 0.6) }}><House w={170} /></div>
        </div>
        <div style={{ ...uiText(36, 700, C.body), marginTop: 22 }}>December rent</div>
        <div style={{ ...uiText(76, 900), marginTop: 6, letterSpacing: -2 }}>$1,450.00</div>
        <div style={{ ...uiText(28, 600, done ? C.green : C.muted), marginTop: 8 }}>{done ? "Paid today" : "Due December 1"}</div>
      </div>
      <div
        style={{
          position: "absolute", left: 26, right: 26, top: 800, height: 100, borderRadius: 50, background: done ? C.ink : C.blue,
          display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pressed ? 0.94 : 1})`,
          ...uiText(38, 800, C.white),
        }}
      >
        {done ? "Paid" : "Pay rent"}
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
            <Check s={40} />
          </div>
          <div>
            <div style={uiText(34, 800, C.white)}>Payment received</div>
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
      <Stamp id="pay" text="PAY RENT" f={f} start={135} y={320} size={250} color={C.ink} />
      <Stamp id="tap" text="IN A TAP." f={f} start={145} y={570} size={250} color={C.green} />
      <Phone id="ph3" f={f} x={PX} y={PY}><RentScreen f={f} /></Phone>
      <Cut id="key3" f={f} x={150} y={1600 + hop(f, 135)} w={260} rot={-70}><Key w={240} /></Cut>
      <TapRing f={f} at={150} x={btn.x} y={btn.y} />
      <Pointer f={f} show={[135, 165]} press={[150]} keys={[{ f: 135, x: 1030, y: 1950 }, { f: 145, x: btn.x + 40, y: btn.y }]} />
    </Stage>
  );
};

/* 4. Fix-it requests: a renter sends a photo of the leak; a rubber stamp checks off each step
   until it thumps FIXED! */
const STAMPS = [187.5, 195, 202.5, 210, 217.5, 225];
const STEPS = ["Photo sent", "Request received", "Plumber booked", "On the way", "Fixed"];
const DOT = (i: number) => (i < 5 ? { x: 70, y: 548 + i * 70 } : { x: SW / 2, y: 912 });

const RepairScreen: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", inset: 0, background: C.cream }}>
    <div style={{ ...uiText(30, 700, C.body), position: "absolute", left: 34, top: 110 }}>{NAME}</div>
    <div style={{ ...uiText(54, 900), position: "absolute", left: 34, top: 150 }}>Repair request</div>
    <div style={{ position: "absolute", left: 22, right: 22, top: 250, height: 230, borderRadius: 34, background: C.white, boxShadow: "0 3px 0 rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 22, padding: "0 20px", boxSizing: "border-box" }}>
      <div style={{ width: 190, height: 190, borderRadius: 24, background: "#dce8f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Faucet f={f} w={170} />
      </div>
      <div>
        <div style={uiText(34, 800)}>Kitchen sink</div>
        <div style={{ ...uiText(26, 500, C.body), marginTop: 8 }}>Leaking under the tap</div>
      </div>
    </div>
    {STEPS.map((label, i) => {
      const at = STAMPS[i];
      const d = DOT(i);
      const on = f >= at;
      const age = f - at;
      const s = !on ? 1 : age < STEP ? 1.35 : age < 2 * STEP ? 0.9 : 1;
      return (
        <React.Fragment key={i}>
          <div
            style={{
              position: "absolute", left: d.x - 27, top: d.y - 27, width: 54, height: 54, borderRadius: 27, boxSizing: "border-box",
              border: on ? "none" : `4px dashed ${C.muted}`, background: on ? C.green : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${s}) rotate(${on ? (random(`sr${i}`) - 0.5) * 24 : 0}deg)`,
            }}
          >
            {on && <Check s={34} />}
          </div>
          <div style={{ ...uiText(32, on ? 800 : 600, on ? C.ink : C.muted), position: "absolute", left: 124, top: d.y - 20 }}>{label}</div>
        </React.Fragment>
      );
    })}
    {f >= 225 && <Stamp id="fixed" text="FIXED!" f={f} start={225} per={0} y={912} size={110} color={C.green} width={SW} />}
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
  const y = SY + lerp(prev.y, d.y, outCubic(t)) - (down ? 0 : 70);
  const exit = prog(f, 227.5, 232.5);
  return (
    <div style={{ position: "absolute", left: x - 80 + exit * 500, top: y - 210 - exit * 300, filter: "drop-shadow(8px 10px 0 rgba(0,0,0,0.25))", transform: `rotate(${(down ? 0 : -8) + exit * 30}deg) scale(1, ${down ? 0.9 : 1})`, transformOrigin: "50% 100%" }}>
      <svg width={160} height={210} viewBox="0 0 160 210">
        <circle cx="80" cy="44" r="38" fill={C.coffee} />
        <rect x="64" y="70" width="32" height="64" rx="8" fill={C.coffee} />
        <rect x="18" y="128" width="124" height="54" rx="10" fill={C.ink} />
        <rect x="24" y="180" width="112" height="20" rx="5" fill={C.green} />
      </svg>
    </div>
  );
};

const Stamps: React.FC<{ f: number }> = ({ f }) => (
  <Stage f={f} from={S.stamps} to={S.alert} bg={C.green} roll={0.8}>
    <Stamp id="fixit" text="FIX-IT" f={f} start={180} y={320} size={260} color={C.paper} />
    <Stamp id="req" text="REQUESTS." f={f} start={190} per={STEP / 2} y={570} size={215} color={C.ink} />
    <Phone id="ph4" f={f} x={PX} y={PY}><RepairScreen f={f} /></Phone>
    <RubberStamp f={f} />
  </Stage>
);

/* 5. Building alerts: the lock screen, a notice drops in, every home gets it. */
const AlertScreen: React.FC<{ f: number }> = ({ f }) => {
  const t = prog(f, 255, 262.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #1f3b5c 0%, #15181d 80%)" }}>
      <div style={{ ...uiText(132, 300, C.white), textAlign: "center", marginTop: 130, letterSpacing: -3 }}>7:42</div>
      <Skel w={200} h={18} c="rgba(255,255,255,0.3)" style={{ margin: "18px auto 0" }} />
      {t > 0 && (
        <div
          style={{
            position: "absolute", left: 18, right: 18, top: lerp(-220, 380, outBack(t, 1.7)), borderRadius: 36, background: "rgba(255,255,255,0.96)",
            padding: "24px 24px", display: "flex", gap: 20, alignItems: "flex-start", boxShadow: "0 10px 0 rgba(0,0,0,0.25)", transform: boilT("note", f, 0.6),
          }}
        >
          <RentIcon w={76} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={uiText(28, 800)}>{NAME}</div>
              <div style={uiText(24, 500, C.muted)}>now</div>
            </div>
            <div style={{ ...uiText(30, 500, C.ink), marginTop: 6 }}>Water is off Tuesday, 9 to 11 AM, for pipe repairs.</div>
          </div>
        </div>
      )}
    </div>
  );
};

const HOMES = [
  { at: 262.5, x: 150, y: 1580, rot: -10, from: -1 },
  { at: 270, x: 935, y: 1500, rot: 8, from: 1 },
  { at: 277.5, x: 160, y: 1250, rot: 5, from: -1 },
];

const Alert: React.FC<{ f: number }> = ({ f }) => (
  <Stage f={f} from={S.alert} to={S.back} bg={C.ink} roll={-0.8}>
    <Stamp id="bldg" text="BUILDING" f={f} start={240} per={STEP / 2} y={325} size={215} color={C.paper} />
    <Stamp id="alerts" text="ALERTS." f={f} start={250} y={560} size={250} color={C.gold} />
    <Phone id="ph5" f={f} x={PX} y={PY}><AlertScreen f={f} /></Phone>
    {HOMES.map((c, i) => {
      if (f < c.at - 7.5) return null;
      const t = prog(f, c.at - 7.5, c.at);
      const x = lerp(c.x + c.from * 500, c.x, outCubic(t));
      const y = c.y - Math.sin(Math.PI * t) * 260;
      const sq = f >= c.at && f < c.at + STEP ? 0.84 : 1;
      return <Cut key={i} id={`home5${i}`} f={f} x={x} y={y} w={250} rot={c.rot} sy={sq}><House w={230} /></Cut>;
    })}
  </Stage>
);

/* 6. The payoff: the ringing office phone walks off for good, and a happy house walks in. */
const Walker: React.FC<{ id: string; f: number; x: number; y: number; flip: number; children: React.ReactNode }> = ({ id, f, x, y, flip, children }) => {
  const k = Math.floor(f / STEP + 1e-6);
  return (
    <div style={{ position: "absolute", left: x, top: y - (k % 2 ? 26 : 0), transform: `rotate(${(k % 2 ? 7 : -7) * flip}deg)`, transformOrigin: "50% 100%" }}>
      <Cut id={id} f={f} x={0} y={0} w={400}>{children}</Cut>
    </div>
  );
};

const Back: React.FC<{ f: number }> = ({ f }) => {
  const b = S.back;
  const out = prog(f, b + 10, b + 37.5);
  const inn = prog(f, b + 50, b + 67.5);
  const home = f >= b + 67.5;
  const sq = f >= b + 67.5 && f < b + 70 ? 0.86 : 1;
  const hopY = home ? hop(f, b + 82.5) : 0;
  return (
    <Stage f={f} from={S.back} to={S.end} bg={C.blue} roll={0.8}>
      <Stamp id="kick6" text="ONLINE RENT + FAST REPAIRS" f={f} start={b} per={0} y={300} size={66} color={C.gold} />
      <Stamp id="fewer" text="FEWER CALLS." f={f} start={b + 7.5} per={STEP / 2} y={520} size={180} color={C.paper} />
      <Stamp id="happier" text="HAPPIER" f={f} start={b + 40} per={STEP / 2} y={760} size={260} color={C.paper} />
      <Stamp id="renters" text="RENTERS." f={f} start={b + 60} y={1020} size={250} color={C.gold} />
      {f < b + 40 && <Walker id="wphone" f={f} x={lerp(540, -400, out)} y={1500} flip={1}><OldPhone id="ring" f={f} w={300} ringing={f < b + 10} /></Walker>}
      {f >= b + 50 &&
        (home ? (
          <Cut id="whouse" f={f} x={540} y={1520 + hopY} w={400} sy={sq}><House w={360} smile /></Cut>
        ) : (
          <Walker id="whouse" f={f} x={lerp(1440, 540, outCubic(inn))} y={1520} flip={-1}><House w={360} smile /></Walker>
        ))}
    </Stage>
  );
};

/* 7. The offer and the address: the last hit bursts into paper, the name stamps in, a click. */
const BITS = Array.from({ length: 18 }, (_, i) => ({
  a: (i / 18) * Math.PI * 2 + random(`ba${i}`) * 0.3,
  v: 26 + random(`bv${i}`) * 22,
  c: [C.green, C.blue, C.gold, C.ink, C.cream][i % 5],
  s: 34 + random(`bs${i}`) * 40,
  round: i % 3 === 0,
}));

const End: React.FC<{ f: number }> = ({ f }) => {
  const pill = { x: 540, y: 1330 };
  const e = S.end - 292.5;
  const hold = 30;
  const pressed = f >= 322.5 + e + hold && f < 327.5 + e + hold;
  const pillOn = f >= 305 + e;
  const age = f - S.end;
  return (
    <Stage f={f} from={S.end} to={S.total} bg={C.paper} roll={0}>
      {age < 25 &&
        BITS.map((b, i) => {
          const x = 540 + Math.cos(b.a) * b.v * age;
          const y = 960 + Math.sin(b.a) * b.v * age + 0.9 * age * age;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: b.s, height: b.s * (b.round ? 1 : 0.6), borderRadius: b.round ? b.s : 4, background: b.c, transform: `rotate(${age * 18 + i * 40}deg)` }} />;
        })}
      <Stamp id="kick" text="APPS FOR PROPERTY MANAGERS" f={f} start={S.end} per={0} y={560} size={80} color={C.blue} />
      <Stamp id="kingdom" text="KINGDOM" f={f} start={295 + e} per={STEP / 2} y={790} size={270} color={C.ink} />
      <Stamp id="sites" text="SITES" f={f} start={300 + e} per={STEP / 2} y={1045} size={270} color={C.green} />
      {pillOn && (
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: pill.y - 56, display: "flex", justifyContent: "center",
            transform: `scale(${f < 307.5 + e ? 1.3 : pressed ? 0.94 : 1})`,
          }}
        >
          <div style={{ background: C.ink, color: C.paper, borderRadius: 56, height: 112, padding: "0 58px", display: "flex", alignItems: "center", fontFamily: UI, fontSize: 58, fontWeight: 700, letterSpacing: -0.5, boxShadow: "8px 10px 0 rgba(0,0,0,0.2)" }}>
            kingdom-sites.com
          </div>
        </div>
      )}
      <TapRing f={f} at={322.5 + e + hold} x={pill.x + 215} y={pill.y + 10} color={C.blue} />
      <Pointer f={f} show={[305 + e + hold, S.total]} press={[322.5 + e + hold]} keys={[{ f: 305 + e + hold, x: 1020, y: 1950 }, { f: 317.5 + e + hold, x: pill.x + 215, y: pill.y + 10 }]} />
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
      {f >= S.alert && f < S.back && <Alert f={f} />}
      {f >= S.back && f < S.end && <Back f={f} />}
      {f >= S.end && <End f={f} />}
      {black > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: black }} />}
    </>
  );
};
