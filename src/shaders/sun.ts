import * as THREE from "three";

export const sunVertexShader = `
uniform float time;
uniform float noiseScale;
uniform float noiseStrength;
uniform float displacementBias; // small base offset

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

// --- Hash / Noise / FBM (cheap) ---
float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7, 74.7))) * 43758.5453123); }

float noise3(vec3 p){
  // classic value noise (trilinear-ish with smoothing)
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y*57.0 + 113.0*i.z;
  float res = mix(
    mix(
      mix(hash(n + 0.0), hash(n + 1.0), f.x),
      mix(hash(n + 57.0), hash(n + 58.0), f.x),
      f.y
    ),
    mix(
      mix(hash(n + 113.0), hash(n + 114.0), f.x),
      mix(hash(n + 170.0), hash(n + 171.0), f.x),
      f.y
    ),
    f.z
  );
  return res;
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100);
  for (int i = 0; i < 5; i++) {
    v += a * noise3(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

// ---------------------------
void main() {
  vUv = uv;
  // Normal in view space
  vNormal = normalize(normalMatrix * normal);
  // World-space normal for surface effects if needed
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  // original vertex position in model space
  vec3 posModel = position;

  // compute displacement using fbm noise (model-space for stable motion)
  vec3 noisePos = posModel * noiseScale + vec3(0.0, time * 0.12, 0.0);
  float displacement = (fbm(noisePos) - 0.5) * 2.0; // [-1,1]
  displacement = displacement * noiseStrength + displacementBias;

  // offset along vertex normal for volumetric look
  vec3 displaced = posModel + normal * displacement;

  // view-space position
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vPosition = mvPosition.xyz;
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
`;
export const sunFragmentShader = `
uniform sampler2D sunTexture;
uniform float time;
uniform vec3 glowColor;
uniform float pulseSpeed;
uniform float pulseAmplitude;
uniform float rimPower;
uniform float rimIntensity;
uniform float uvDistortionStrength;
uniform vec3 baseTint; // overall color tint to multiply texture

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

// small helpers
float ease(float x) { return x*x*(3.0 - 2.0*x); }

void main() {
  // --- animated UV distortion for flowing surface ---
  vec2 uv = vUv;
  // flow based on time and local UV coordinate to get directional currents
  vec2 flow = vec2(
    sin(time * 0.8 + uv.y * 30.0) * 0.002,
    cos(time * 0.6 + uv.x * 25.0) * 0.0025
  );
  uv += uvDistortionStrength * flow;

  // sample the texture
  vec4 tex = texture2D(sunTexture, uv);
  // apply a subtle tint & increase contrast
  vec3 color = tex.rgb * baseTint;
  color = pow(color, vec3(0.95)); // slight contrast boost

  // --- pulsing / simmering ---
  float pulse = 1.0 + pulseAmplitude * (0.5 + 0.5 * sin(time * pulseSpeed + uv.x * 10.0 + uv.y * 6.0));
  color *= pulse;

  // --- rim/fresnel glow (view-dependent) ---
  vec3 viewDir = normalize(vViewPosition);
  // Using view-space normal vNormal
  float fresnel = 1.0 - max(dot(viewDir, normalize(vNormal)), 0.0);
  // sharper rim controlled by rimPower
  float rim = pow(fresnel, rimPower) * rimIntensity;
  vec3 rimTint = glowColor * rim;
  // tint the surface slightly towards a hotter color at rim
  color = mix(color, vec3(1.0, 0.95, 0.7), rim * 0.45);

  // --- small self-illumination variation based on normal to fake hotspots ---
  float normalVariation = smoothstep(0.0, 1.0, (0.5 + 0.5 * dot(normalize(vWorldNormal), vec3(0.0, 0.3, 0.9))));
  color += 0.08 * normalVariation * pulse;

  // final combine
  vec3 finalColor = color + rimTint;

  // gamma-corrected output
  finalColor = pow(finalColor, vec3(1.0 / 2.2));

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
export const sunCoronaVertexShader = `
uniform float coronaScale;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  // optionally push corona vertices outward a bit (so back-facing shows)
  vec3 displaced = position * coronaScale;
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vPosition = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

export const sunCoronaFragmentShader = `
uniform vec3 coronaColor;
uniform float time;
uniform float coronaIntensity;
uniform float coronaFalloff; // how quickly intensity fades with angle
uniform float coronaWaveAmount;
uniform float coronaFlicker; // multiplicative flicker value

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 viewDir = normalize(-vPosition);

  // base angular intensity: edges glow stronger (perpendicular to view)
  float ang = 1.0 - abs(dot(viewDir, normalize(vNormal))); // [0..1] strong at edges
  float base = pow(ang, coronaFalloff);

  // temporal flicker and traveling wave to add complexity
  float flicker = 0.85 + 0.15 * sin(time * 6.0 + vUv.x * 30.0);
  float wave = 1.0 + coronaWaveAmount * sin( time * 1.6 + vUv.y * 12.0 + vUv.x * 8.0 );

  float intensity = base * coronaIntensity * flicker * wave;

  // add soft radial falloff by distance from center in UV space
  vec2 centered = vUv - 0.5;
  float dist = length(centered);
  float radial = smoothstep(0.8, 0.0, dist); // 1.0 at center -> 0 at edges
  intensity *= radial;

  // final color
  vec3 col = coronaColor * intensity;

  // premultiplied-like additive alpha for nice layering
  float alpha = clamp(intensity * coronaFlicker, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`;
export const sunUniforms = {
  // common
  time: { value: 0.0 },

  // surface
  sunTexture: { value: null as THREE.Texture | null },
  glowColor: { value: new THREE.Color(1.0, 0.8, 0.5) },
  baseTint: { value: new THREE.Color(1.0, 0.9, 0.7) },

  // displacement & noise
  noiseScale: { value: 1.6 },
  noiseStrength: { value: 0.14 },
  displacementBias: { value: 0.02 },

  // surface animation
  pulseSpeed: { value: 1.1 },
  pulseAmplitude: { value: 0.12 },
  uvDistortionStrength: { value: 1.0 }, // multiplier to small UV offsets

  // rim/fresnel
  rimPower: { value: 3.6 },
  rimIntensity: { value: 1.2 },

  // corona
  coronaColor: { value: new THREE.Color(1.0, 0.9, 0.6) },
  coronaIntensity: { value: 1.1 },
  coronaFalloff: { value: 3.5 },
  coronaWaveAmount: { value: 0.08 },
  coronaFlicker: { value: 0.95 },
  coronaScale: { value: 1.01 }, // vertex multiplier for corona mesh
};
export function createSunMaterials(texture: THREE.Texture | null) {
  const uniforms = THREE.UniformsUtils.clone(sunUniforms);
  uniforms.sunTexture.value = texture;

  const sunMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader,
    side: THREE.FrontSide,
    transparent: false,
    depthWrite: true,
  });
  const coronaUniforms = THREE.UniformsUtils.clone(uniforms);
  const coronaMat = new THREE.ShaderMaterial({
    uniforms: coronaUniforms,
    vertexShader: sunCoronaVertexShader,
    fragmentShader: sunCoronaFragmentShader,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    side: THREE.BackSide,
    toneMapped: false,
  });

  return { sunMat, coronaMat, uniforms };
}

export default {
  sunVertexShader,
  sunFragmentShader,
  sunCoronaVertexShader,
  sunCoronaFragmentShader,
  sunUniforms,
  createSunMaterials,
};
