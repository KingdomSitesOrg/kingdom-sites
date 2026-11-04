/**
 * Shared GLSL helpers with include guards. three's own <common> chunk already defines PI, saturate()
 * and luminance(), so these use different names (luma, linearstep) to stay collision-free.
 */

export const remapGLSL = /* glsl */ `
#ifndef STRATA_REMAP
#define STRATA_REMAP
float remap(float v, float a, float b, float c, float d) { return c + (v - a) * (d - c) / (b - a); }
vec2 remap(vec2 v, vec2 a, vec2 b, vec2 c, vec2 d) { return c + (v - a) * (d - c) / (b - a); }
vec3 remap(vec3 v, vec3 a, vec3 b, vec3 c, vec3 d) { return c + (v - a) * (d - c) / (b - a); }
float remapClamped(float v, float a, float b, float c, float d) { return mix(c, d, clamp((v - a) / (b - a), 0.0, 1.0)); }
float linearstep(float a, float b, float x) { return clamp((x - a) / (b - a), 0.0, 1.0); }
#endif
`;

export const easingsGLSL = /* glsl */ `
#ifndef STRATA_EASINGS
#define STRATA_EASINGS
float easeInQuad(float t) { return t * t; }
float easeOutQuad(float t) { return t * (2.0 - t); }
float easeInOutQuad(float t) { return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t; }
float easeInCubic(float t) { return t * t * t; }
float easeOutCubic(float t) { float f = t - 1.0; return f * f * f + 1.0; }
float easeInOutCubic(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5; }
float easeInExpo(float t) { return t <= 0.0 ? 0.0 : pow(2.0, 10.0 * t - 10.0); }
float easeOutExpo(float t) { return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }
float easeInOutSine(float t) { return -(cos(3.141592653589793 * t) - 1.0) * 0.5; }
float easeOutBack(float t) { const float c1 = 1.70158; const float c3 = c1 + 1.0; float f = t - 1.0; return 1.0 + c3 * f * f * f + c1 * f * f; }
#endif
`;

export const rotationGLSL = /* glsl */ `
#ifndef STRATA_ROTATION
#define STRATA_ROTATION
mat2 rotate2D(float a) { float s = sin(a); float c = cos(a); return mat2(c, s, -s, c); }
mat3 rotateX(float a) { float s = sin(a); float c = cos(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotateY(float a) { float s = sin(a); float c = cos(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotateZ(float a) { float s = sin(a); float c = cos(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
mat3 rotateAxis(vec3 axis, float a) {
  axis = normalize(axis);
  float s = sin(a);
  float c = cos(a);
  float oc = 1.0 - c;
  return mat3(
    oc * axis.x * axis.x + c, oc * axis.x * axis.y + axis.z * s, oc * axis.z * axis.x - axis.y * s,
    oc * axis.x * axis.y - axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z + axis.x * s,
    oc * axis.z * axis.x + axis.y * s, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.z + c);
}
#endif
`;

export const lumaGLSL = /* glsl */ `
#ifndef STRATA_LUMA
#define STRATA_LUMA
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
#endif
`;

/** remap, linearstep, easings, rotations, luma. */
export const commonGLSL = remapGLSL + easingsGLSL + rotationGLSL + lumaGLSL;
