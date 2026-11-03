/**
 * Scene -> Overlay channel, written inside useChapterFrame. Story values are pure functions of p (timeline.ts),
 * so the HUD reads those directly; the Scene only adds the ambient jitter on top. Initial values are what static
 * mode and the server render show.
 */
export const signals = {
  /** Active cell: 0 SLA, 1 SLS, 2 LPBF. */
  cell: 0,
  /** SLA layer count. */
  layer: 360,
  /** LPBF part temperature, °C. */
  partTemp: 940,
  /** 1 once the QA scan has passed. */
  qa: 0,
  /** Jitter offsets (°C) added to the SLS bed and the melt pool readouts; 0 in static and capture mode. */
  bedJitter: 0,
  poolJitter: 0,
};
