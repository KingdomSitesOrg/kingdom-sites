/** The hall's cool top light while every machine runs (Ch7 at p 0; Ch6's cabinet at A7). */
export const HALL_TOP_LIGHT = 0.6;

/**
 * The hall's light on a cabinet body (black anodised panels, brushed trims; albedo from the vertex colour):
 * a dim cool top light, the floor pool on the lower front, the window's own glow on the bezel, a glossy
 * reflection of the hall and edge highlights. World normal, local position (mm from the cabinet origin).
 * Ch6 shades the hero cabinet with it at the end of its pull-back so the 6 -> 7 crossfade is one cabinet.
 */
export const fleetBodyGLSL = /* glsl */ `
#ifndef STRATA_FLEET_BODY
#define STRATA_FLEET_BODY
// What a glossy surface sees: the dark hall above, the warm glow of a lit floor at and below the horizon.
vec3 fleetSky(vec3 r, float topLight, float hall) {
  vec3 cool = vec3(0.007, 0.009, 0.016) * (0.1 + 0.9 * topLight / 0.6);
  vec3 warm = vec3(0.034, 0.020, 0.011) * hall;
  float horizon = exp(-abs(r.y + 0.04) * 9.0);
  return mix(warm * 0.5, cool, smoothstep(-0.15, 0.5, r.y)) + warm * horizon;
}
float fleetRect(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float fleetMetal(vec3 albedo) {
  return step(0.2, max(albedo.r, max(albedo.g, albedo.b)));
}
vec3 fleetBase(vec3 albedo) {
  return mix(albedo, albedo * 0.12, fleetMetal(albedo));
}
vec3 fleetBody(vec3 albedo, vec3 n, vec3 v, vec3 lp, vec3 winAvg, float topLight, float hall) {
  float metal = fleetMetal(albedo);
  vec3 base = fleetBase(albedo);
  vec3 f0 = mix(vec3(0.045), albedo, metal);
  float rough = mix(0.42, 0.3, metal);
  float front = smoothstep(0.5, 0.9, n.z);
  vec3 col = base * topLight * vec3(0.5, 0.6, 0.85) * (0.15 + 0.85 * max(n.y, 0.0));
  col *= 0.55 + 0.9 * smoothstep(-1100.0, 600.0, lp.y);
  col += base * winAvg * front * (1.0 - smoothstep(-1100.0, -350.0, lp.y)) * 0.7;
  float dw = fleetRect(lp.xy - vec2(0.0, 60.0), vec2(260.0, 180.0));
  col += winAvg * 0.05 * exp(-max(dw, 0.0) / 30.0) * (0.4 + 0.6 * metal) * step(0.0, n.z + 0.5);
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  col += fleetSky(reflect(-v, n), topLight, hall) * F * (1.0 - rough * 0.5) * (1.0 + metal * 2.0);
  float edge = max(smoothstep(443.0, 450.0, abs(lp.x)) * step(0.3, n.z), smoothstep(594.0, 600.0, lp.y) * step(0.3, abs(n.z) + abs(n.x)));
  col += (vec3(0.016, 0.02, 0.032) * topLight + winAvg * 0.01) * edge;
  return col;
}
#endif
`;
