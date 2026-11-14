// The seven scenes, each a function of the snapped scene time (units: a beat is 15, a pose 2.5;
// the film plays them 1.25x faster, see SPEED in lib.ts). The beat sheet is ../SCRIPT.md.
// Draft 2 (Thomas: "less shaking, a little bit faster and a few more change ups from ... the
// coffee one"): a new opening and payoff built on an apartment building, a swipe to pay, a photo
// and a van for repairs, the building again for alerts, and scenes that slide in as paper panels
// instead of cutting.
import React from "react";
import { BEAT, C, H, STEP, UI, W, boilT, lerp, outBack, outCubic, prog } from "./lib";
import { Bubble, Building, Cut, Faucet, Key, OldPhone, PHONE, Phone, Pointer, RentIcon, Skel, Stamp, TapRing, Van, WIN_ORDER, Win, uiText } from "./parts";

export const S = { hook: 0, app: 75, rent: 135, fix: 195, alert: 255, back: 300, end: 375, black: 440, total: 457.5 };

const NAME = "Your Rentals";
const SLIDE = 3 * STEP;

/** A scene's ground and a slow stepped push of the camera. No roll, no kick on the beat. */
const Stage: React.FC<{ f: number; from: number; to: number; bg: string; children: React.ReactNode }> = ({ f, from, to, bg, children }) => (
  <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.02 * prog(f, from, to)})` }}>{children}</div>
  </div>
);

const hop = (f: number, at: number) => ((f - at) % BEAT < STEP - 1e-6 && f >= at ? -20 : 0);
/** Lands big, squashes, sits: the scale of something stamped at `at`. */
const land = (f: number, at: number, big = 1.4) => (f < at + STEP - 1e-6 ? big : f < at + 2 * STEP - 1e-6 ? 0.92 : 1);

/** The building sits with its top at BY, centred. */
const BW = 560, BY = 1080;
const windowsAt = (f: number, start: number, to: Win, from: Win) => {
  const state = new Map<number, Win>();
  WIN_ORDER.forEach((w, k) => state.set(w, f >= start + Math.floor(k / 2) * STEP ? to : from));
  return (i: number) => state.get(i) ?? from;
};

/* 1. The hook: a building of renters, every window lights up, and they all want something. */
const ASKS: { text: string; x: number; y: number; tail: -1 | 1; at: number }[] = [
  { text: "Rent?", x: 220, y: 1010, tail: 1, at: 45 },
  { text: "Leak!", x: 870, y: 1140, tail: -1, at: 50 },
  { text: "Keys?", x: 190, y: 1340, tail: 1, at: 55 },
  { text: "Noise!", x: 880, y: 1450, tail: -1, at: 60 },
  { text: "Parking?", x: 330, y: 1640, tail: 1, at: 65 },
];

const Hook: React.FC<{ f: number }> = ({ f }) => {
  const by = lerp(H + 40, BY, outBack(prog(f, 2.5, 15), 1.2));
  const sq = f >= 15 && f < 15 + STEP ? 0.94 : 1;
  return (
    <Stage f={f} from={S.hook} to={S.app} bg="#1d2b45">
      <Stamp id="prop" text="PROPERTY" f={f} start={0} y={300} size={230} color={C.paper} />
      <Stamp id="mgr" text="MANAGER?" f={f} start={10} y={530} size={230} color={C.gold} />
      <Stamp id="lots" text="LOTS OF RENTERS?" f={f} start={35} per={STEP / 2} y={735} size={110} color={C.paper} />
      <div style={{ position: "absolute", left: W / 2 - BW / 2, top: by, transform: `scale(1, ${sq})`, transformOrigin: "50% 100%", filter: "drop-shadow(12px 14px 0 rgba(0,0,0,0.3))" }}>
        <Building w={BW} win={windowsAt(f, 17.5, "on", "off")} />
      </div>
      {ASKS.map((a, i) =>
        f >= a.at ? (
          <div key={i} style={{ position: "absolute", left: a.x, top: a.y, transform: `translate(-50%, -50%) scale(${land(f, a.at, 1.3)}) rotate(${(i % 2 ? 4 : -4)}deg)`, filter: "drop-shadow(8px 10px 0 rgba(0,0,0,0.28))" }}>
            <Bubble text={a.text} tail={a.tail} />
          </div>
        ) : null,
      )}
    </Stage>
  );
};

/* 2. Get your own app: the phone rises, every ask flies into it, and the company's app opens. */
const AY = 800;
const Splash: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", inset: 0, background: f >= 105 ? C.green : "#15181d", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    {f >= 105 && (
      <>
        <div style={{ transform: `scale(${land(f, 105, 1.6)})` }}><RentIcon w={190} /></div>
        <div style={{ ...uiText(44, 800, C.white), marginTop: 30 }}>{NAME}</div>
        <Skel w={200} h={16} c="rgba(255,255,255,0.35)" style={{ marginTop: 18 }} />
      </>
    )}
  </div>
);

const App: React.FC<{ f: number }> = ({ f }) => {
  const py = lerp(H + 600, AY, outBack(prog(f, 75, 90), 1.1));
  const sq = f >= 90 && f < 90 + STEP ? 0.95 : 1;
  return (
    <Stage f={f} from={S.app} to={S.rent} bg={C.blue}>
      <Phone id="ph2" f={f} x={W / 2} y={py} sy={sq}><Splash f={f} /></Phone>
      {f >= S.app &&
        ASKS.map((a, i) => {
          const t = prog(f, 82.5 + i * STEP, 87.5 + i * STEP);
          if (t >= 1) return null;
          const e = outCubic(t);
          return (
            <div key={i} style={{ position: "absolute", left: lerp(a.x, W / 2, e), top: lerp(a.y, AY, e), transform: `translate(-50%, -50%) scale(${lerp(1, 0.15, e)}) rotate(${(i % 2 ? 4 : -4) + e * 40}deg)`, filter: "drop-shadow(8px 10px 0 rgba(0,0,0,0.28))" }}>
              <Bubble text={a.text} tail={a.tail} />
            </div>
          );
        })}
      <Stamp id="get" text="GET YOUR" f={f} start={90} y={1490} size={210} color={C.paper} />
      <Stamp id="own" text="OWN APP." f={f} start={100} y={1710} size={210} color={C.gold} />
    </Stage>
  );
};

/* 3. Pay rent in a swipe. */
const RY = 1290;
const RSY = RY - PHONE.h / 2 + PHONE.bezel;
const SX = W / 2 - PHONE.w / 2 + PHONE.bezel;
const SW = PHONE.w - 2 * PHONE.bezel;
const KNOB = 94;
const knobP = (f: number) => outCubic(prog(f, 150, 167.5));
const knobX = (f: number) => 8 + KNOB / 2 + (SW - 16 - KNOB) * knobP(f);

const Check: React.FC<{ s: number; c?: string }> = ({ s, c = C.white }) => (
  <svg width={s} height={s} viewBox="0 0 40 40"><path d="M8 21 L17 30 L33 11" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const RentScreen: React.FC<{ f: number }> = ({ f }) => {
  const done = f >= 167.5;
  const tk = prog(f, 180, 187.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.paper }}>
      <div style={{ height: 190, background: C.green, padding: "0 34px", display: "flex", alignItems: "flex-end", paddingBottom: 26, boxSizing: "border-box" }}>
        <div style={uiText(40, 800, C.white)}>{NAME}</div>
      </div>
      <div style={{ margin: "34px 26px 0", background: C.white, borderRadius: 34, padding: 30, boxShadow: "0 2px 0 rgba(0,0,0,0.06)" }}>
        <div style={uiText(36, 700, C.body)}>December rent</div>
        <div style={{ ...uiText(84, 900), marginTop: 10, letterSpacing: -2 }}>$1,450.00</div>
        <div style={{ ...uiText(30, 600, done ? C.green : C.muted), marginTop: 10 }}>{done ? "Paid today" : "Due December 1"}</div>
        <div style={{ height: 2, background: C.grey, margin: "26px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}><Skel w={150} /><Skel w={90} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}><Skel w={190} /><Skel w={70} /></div>
      </div>
      <div style={{ position: "absolute", left: 26, right: 26, top: 800, height: 110, borderRadius: 55, background: done ? C.green : C.ink }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, ...uiText(36, 800, done ? C.white : "rgba(255,255,255,0.55)") }}>
          {done ? <><Check s={40} /> Paid</> : "Slide to pay"}
        </div>
        {!done && (
          <div style={{ position: "absolute", left: knobX(f) - KNOB / 2, top: 8, width: KNOB, height: KNOB, borderRadius: KNOB / 2, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={40} height={40} viewBox="0 0 40 40"><path d="M14 8 L28 20 L14 32" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        )}
      </div>
      {tk > 0 && (
        <div
          style={{
            position: "absolute", left: 22, right: 22, top: lerp(-180, 630, outBack(tk, 1.4)), height: 150, borderRadius: 30, background: C.ink,
            display: "flex", alignItems: "center", gap: 22, padding: "0 28px", boxSizing: "border-box", boxShadow: "0 10px 0 rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ width: 74, height: 74, borderRadius: 37, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><Check s={40} /></div>
          <div>
            <div style={uiText(34, 800, C.white)}>Payment received</div>
            <Skel w={170} h={14} c="rgba(255,255,255,0.25)" style={{ marginTop: 10 }} />
          </div>
        </div>
      )}
    </div>
  );
};

const Rent: React.FC<{ f: number }> = ({ f }) => {
  // the knob's centre on the frame: the track starts 26 px in and 800 px down the screen
  const knob = { x: SX + 26 + knobX(f), y: RSY + 855 };
  const drag = f >= 150;
  return (
    <Stage f={f} from={S.rent} to={S.fix} bg={C.cream}>
      <Stamp id="pay" text="PAY RENT" f={f} start={137.5} y={300} size={250} color={C.ink} />
      <Stamp id="swipe" text="IN A SWIPE." f={f} start={147.5} y={540} size={210} color={C.green} />
      <Phone id="ph3" f={f} x={W / 2} y={RY}><RentScreen f={f} /></Phone>
      <Cut id="key3" f={f} x={150} y={1660 + hop(f, 180)} w={260} rot={-70}><Key w={240} /></Cut>
      <Pointer
        f={f}
        show={[140, 175]}
        press={drag ? [150, 155, 160, 165] : []}
        keys={drag ? [{ f, x: knob.x, y: knob.y }] : [{ f: 140, x: 1030, y: 1950 }, { f: 147.5, x: knob.x, y: knob.y }]}
      />
    </Stage>
  );
};

/* 4. Fix-it requests: snap the leak, send it, and the plumber's van drives over, stop by stop. */
const FY = 760;
const FSY = FY - PHONE.h / 2 + PHONE.bezel;
const SHUTTER = { x: SW / 2, y: 880 };
const STATUS: { at: number; text: string }[] = [
  { at: 217.5, text: "Sent" },
  { at: 225, text: "Plumber booked" },
  { at: 232.5, text: "On the way" },
];

const FixScreen: React.FC<{ f: number }> = ({ f }) => {
  if (f < 210)
    return (
      <div style={{ position: "absolute", inset: 0, background: "#20262e" }}>
        <div style={{ ...uiText(28, 600, C.white), position: "absolute", top: 110, width: "100%", textAlign: "center" }}>Snap the problem</div>
        <div style={{ position: "absolute", left: 40, right: 40, top: 200, height: 560, borderRadius: 20, background: "#dce8f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Faucet f={f} w={340} />
        </div>
        {[[40, 200], [SW - 40, 200], [40, 760], [SW - 40, 760]].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x - (i % 2 ? 50 : 0), top: y - (i > 1 ? 50 : 0), width: 50, height: 50, borderStyle: "solid", borderColor: C.gold, borderWidth: `${i < 2 ? 8 : 0}px ${i % 2 ? 8 : 0}px ${i > 1 ? 8 : 0}px ${i % 2 ? 0 : 8}px` }} />
        ))}
        <div style={{ position: "absolute", left: SHUTTER.x - 50, top: SHUTTER.y - 50, width: 100, height: 100, borderRadius: 50, border: "8px solid #fff", boxSizing: "border-box", padding: 8 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: C.white, transform: `scale(${f >= 207.5 ? 0.8 : 1})` }} />
        </div>
      </div>
    );
  const cur = [...STATUS].reverse().find((s) => f >= s.at);
  const step = STATUS.filter((s) => f >= s.at).length + (f >= 240 ? 1 : 0);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.cream }}>
      <div style={{ ...uiText(30, 700, C.body), position: "absolute", left: 34, top: 110 }}>{NAME}</div>
      <div style={{ ...uiText(54, 900), position: "absolute", left: 34, top: 150 }}>Repair request</div>
      <div style={{ position: "absolute", left: 22, right: 22, top: 250, height: 210, borderRadius: 34, background: C.white, display: "flex", alignItems: "center", gap: 22, padding: "0 20px", boxSizing: "border-box", boxShadow: "0 3px 0 rgba(0,0,0,0.06)" }}>
        <div style={{ width: 170, height: 170, borderRadius: 22, background: "#dce8f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: `scale(${land(f, 210, 1.5)})` }}>
          <Faucet f={f} w={150} />
        </div>
        <div>
          <div style={uiText(34, 800)}>Kitchen sink</div>
          <div style={{ ...uiText(26, 500, C.body), marginTop: 8 }}>Leaking under the tap</div>
        </div>
      </div>
      <div style={{ ...uiText(26, 700, C.muted), position: "absolute", left: 34, top: 510 }}>STATUS</div>
      {f < 240 && cur && <div style={{ ...uiText(58, 900), position: "absolute", left: 34, top: 556, transform: `scale(${land(f, cur.at, 1.15)})`, transformOrigin: "0 50%" }}>{cur.text}</div>}
      {f >= 240 && <Stamp id="fixed" text="FIXED!" f={f} start={240} per={0} y={600} size={130} color={C.green} width={SW} />}
      <div style={{ position: "absolute", left: 34, right: 34, top: 720, display: "flex", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ flex: 1, height: 18, borderRadius: 9, background: i < step ? C.green : C.grey }} />)}
      </div>
    </div>
  );
};

const VAN = [
  { at: 217.5, x: -260 },
  { at: 225, x: 250 },
  { at: 232.5, x: 540 },
  { at: 240, x: 830 },
];
const vanX = (f: number) => {
  let x = VAN[0].x;
  for (let i = 1; i < VAN.length; i++) if (f > VAN[i].at - 5) x = lerp(VAN[i - 1].x, VAN[i].x, outCubic(prog(f, VAN[i].at - 5, VAN[i].at)));
  return x;
};

const Fix: React.FC<{ f: number }> = ({ f }) => {
  const shutter = { x: SX + SHUTTER.x, y: FSY + SHUTTER.y };
  const stopped = VAN.slice(1).some((v) => f >= v.at && f < v.at + STEP);
  return (
    <Stage f={f} from={S.fix} to={S.alert} bg={C.green}>
      <Phone id="ph4" f={f} x={W / 2} y={FY}><FixScreen f={f} /></Phone>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1408, height: 10, backgroundImage: `repeating-linear-gradient(90deg, ${C.paper} 0 60px, transparent 60px 110px)`, opacity: 0.7 }} />
      {f >= 215 && (
        <div style={{ position: "absolute", left: vanX(f) - 140, top: 1250, transform: `translateY(${stopped ? 4 : 0}px) scale(1, ${stopped ? 0.95 : 1})`, transformOrigin: "50% 100%", filter: "drop-shadow(8px 10px 0 rgba(0,0,0,0.25))" }}>
          <Van w={280} />
        </div>
      )}
      <Stamp id="fixit" text="FIX-IT" f={f} start={197.5} y={1580} size={230} color={C.paper} />
      <Stamp id="req" text="REQUESTS." f={f} start={207.5} per={STEP / 2} y={1790} size={200} color={C.ink} />
      <TapRing f={f} at={207.5} x={shutter.x} y={shutter.y} />
      <Pointer f={f} show={[197.5, 215]} press={[207.5]} keys={[{ f: 197.5, x: 1030, y: 1950 }, { f: 205, x: shutter.x, y: shutter.y }]} />
    </Stage>
  );
};

/* 5. Building alerts: one notice, and it reaches every window. */
const Alert: React.FC<{ f: number }> = ({ f }) => {
  const t = prog(f, 262.5, 270);
  return (
    <Stage f={f} from={S.alert} to={S.back} bg={C.ink}>
      <Stamp id="bldg" text="BUILDING" f={f} start={257.5} per={STEP / 2} y={290} size={215} color={C.paper} />
      <Stamp id="alerts" text="ALERTS." f={f} start={265} y={510} size={250} color={C.gold} />
      <div style={{ position: "absolute", left: W / 2 - BW / 2, top: BY, filter: "drop-shadow(12px 14px 0 rgba(0,0,0,0.3))" }}>
        <Building w={BW} win={windowsAt(f, 272.5, "bell", "on")} />
      </div>
      {t > 0 && (
        <div
          style={{
            position: "absolute", left: 90, right: 90, top: lerp(-300, 700, outBack(t, 1.5)), borderRadius: 40, background: C.white,
            padding: "28px 30px", display: "flex", gap: 24, alignItems: "flex-start", boxShadow: "12px 14px 0 rgba(0,0,0,0.3)", transform: boilT("note", f, 0.5),
          }}
        >
          <RentIcon w={92} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={uiText(32, 800)}>{NAME}</div>
              <div style={uiText(28, 500, C.muted)}>now</div>
            </div>
            <div style={{ ...uiText(38, 500, C.ink), marginTop: 8 }}>Water is off Tuesday, 9 to 11 AM, for pipe repairs.</div>
          </div>
        </div>
      )}
    </Stage>
  );
};

/* 6. The payoff: the office phone stops ringing for good, and the building comes back smiling. */
const Back: React.FC<{ f: number }> = ({ f }) => {
  const b = S.back;
  const gone = f >= b + 17.5;
  const pop = f >= b + 15 && f < b + 17.5;
  const by = lerp(H + 40, BY, outBack(prog(f, b + 17.5, b + 30), 1.2));
  const sq = f >= b + 30 && f < b + 30 + STEP ? 0.94 : 1;
  return (
    <Stage f={f} from={S.back} to={S.end} bg={C.blue}>
      <Stamp id="kick6" text="ONLINE RENT + FAST REPAIRS" f={f} start={b} per={0} y={250} size={62} color={C.gold} />
      <Stamp id="fewer" text="FEWER CALLS." f={f} start={b + 2.5} per={STEP / 2} y={430} size={170} color={C.paper} />
      <Stamp id="happier" text="HAPPIER" f={f} start={b + 30} per={STEP / 2} y={650} size={230} color={C.paper} />
      <Stamp id="renters" text="RENTERS." f={f} start={b + 45} y={870} size={230} color={C.gold} />
      {!gone && (
        <Cut id="ring" f={f} x={W / 2} y={1350} w={400} scale={pop ? 1.15 : 1} sy={pop ? 0.35 : 1}>
          <OldPhone id="ringm" f={f} w={340} ringing={f < b + 15} />
        </Cut>
      )}
      {f >= b + 17.5 && (
        <div style={{ position: "absolute", left: W / 2 - BW / 2, top: by, transform: `scale(1, ${sq})`, transformOrigin: "50% 100%", filter: "drop-shadow(12px 14px 0 rgba(0,0,0,0.3))" }}>
          <Building w={BW} win={windowsAt(f, b + 32.5, "smile", "on")} />
        </div>
      )}
    </Stage>
  );
};

/* 7. The offer and the address: the music's hit bursts into paper, the name stamps in, a click. */
const BITS = Array.from({ length: 18 }, (_, i) => ({
  a: (i / 18) * Math.PI * 2 + ((i * 37) % 10) * 0.03,
  v: 26 + ((i * 53) % 22),
  c: [C.green, C.blue, C.gold, C.ink, C.cream][i % 5],
  s: 34 + ((i * 29) % 40),
  round: i % 3 === 0,
}));

const End: React.FC<{ f: number }> = ({ f }) => {
  const pill = { x: 540, y: 1330 };
  const e = S.end;
  const press = e + 60;
  const pressed = f >= press && f < press + 5;
  const age = f - e;
  return (
    <Stage f={f} from={S.end} to={S.total} bg={C.paper}>
      {age < 25 &&
        BITS.map((b, i) => {
          const x = 540 + Math.cos(b.a) * b.v * age;
          const y = 960 + Math.sin(b.a) * b.v * age + 0.9 * age * age;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: b.s, height: b.s * (b.round ? 1 : 0.6), borderRadius: b.round ? b.s : 4, background: b.c, transform: `rotate(${age * 18 + i * 40}deg)` }} />;
        })}
      <Stamp id="kick" text="APPS FOR PROPERTY MANAGERS" f={f} start={e} per={0} y={560} size={80} color={C.blue} />
      <Stamp id="kingdom" text="KINGDOM" f={f} start={e + 2.5} per={STEP / 2} y={790} size={270} color={C.ink} />
      <Stamp id="sites" text="SITES" f={f} start={e + 7.5} per={STEP / 2} y={1045} size={270} color={C.green} />
      {f >= e + 12.5 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: pill.y - 56, display: "flex", justifyContent: "center", transform: `scale(${f < e + 15 ? 1.3 : pressed ? 0.94 : 1})` }}>
          <div style={{ background: C.ink, color: C.paper, borderRadius: 56, height: 112, padding: "0 58px", display: "flex", alignItems: "center", fontFamily: UI, fontSize: 58, fontWeight: 700, letterSpacing: -0.5, boxShadow: "8px 10px 0 rgba(0,0,0,0.2)" }}>
            kingdom-sites.com
          </div>
        </div>
      )}
      <TapRing f={f} at={press} x={pill.x + 215} y={pill.y + 10} color={C.blue} />
      <Pointer f={f} show={[e + 42.5, S.total]} press={[press]} keys={[{ f: e + 42.5, x: 1020, y: 1950 }, { f: e + 55, x: pill.x + 215, y: pill.y + 10 }]} />
    </Stage>
  );
};

/** Each scene slides in over the last as a paper panel, in three poses, from a new side each time;
    the end card cuts in on the music's hit. Scenes are written on the draft-2 clock (S above) and
    `shift` places them on the film's: draft 5 holds the hook, rent, repair and alert scenes 30
    units longer once their action is done (Thomas: "the rent, the leak, all those little
    messages, those need to stay longer"). */
type Dir = "up" | "left" | "right" | "down" | null;
const HOLD = 30;
const SCENES: { from: number; shift: number; El: React.FC<{ f: number }>; dir: Dir }[] = [
  { from: S.hook, shift: 0, El: Hook, dir: null },
  { from: S.app + HOLD, shift: HOLD, El: App, dir: "up" },
  { from: S.rent + HOLD, shift: HOLD, El: Rent, dir: "left" },
  { from: S.fix + 2 * HOLD, shift: 2 * HOLD, El: Fix, dir: "right" },
  { from: S.alert + 3 * HOLD, shift: 3 * HOLD, El: Alert, dir: "down" },
  { from: S.back + 4 * HOLD, shift: 4 * HOLD, El: Back, dir: "left" },
  { from: S.end + 4 * HOLD, shift: 4 * HOLD, El: End, dir: null },
];
/** The whole film in units: 577.5. */
export const TOTAL = S.total + 4 * HOLD;

const panel = (dir: Dir, t: number): React.CSSProperties => {
  const k = 1 - t;
  switch (dir) {
    case "up": return { transform: `translateY(${k * H}px)`, boxShadow: "0 -18px 0 rgba(0,0,0,0.25)" };
    case "down": return { transform: `translateY(${-k * H}px)`, boxShadow: "0 18px 0 rgba(0,0,0,0.25)" };
    case "left": return { transform: `translateX(${k * W}px)`, boxShadow: "-18px 0 0 rgba(0,0,0,0.25)" };
    case "right": return { transform: `translateX(${-k * W}px)`, boxShadow: "18px 0 0 rgba(0,0,0,0.25)" };
    default: return {};
  }
};

export const Picture: React.FC<{ f: number }> = ({ f }) => {
  const black = prog(f, S.black + 4 * HOLD, TOTAL - 5);
  let cur = 0;
  SCENES.forEach((s, i) => { if (f >= s.from) cur = i; });
  const next = SCENES[cur + 1];
  const t = next && next.dir && f >= next.from - SLIDE ? prog(f, next.from - SLIDE, next.from) : -1;
  const Cur = SCENES[cur].El;
  return (
    <>
      <Cur f={f - SCENES[cur].shift} />
      {t >= 0 && next && (
        <div style={{ position: "absolute", inset: 0, ...panel(next.dir, t) }}>
          <next.El f={f - next.shift} />
        </div>
      )}
      {black > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: black }} />}
    </>
  );
};
