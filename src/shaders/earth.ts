
import * as THREE from 'three';

export const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal; // Send the world-space normal to the fragment shader
  varying vec3 vWorldPosition; // Send the world-space position to the fragment shader

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal); // Calculate world normal
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const earthFragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
    float specularMask = texture2D(specularMap, vUv).r;
    vec3 normal = normalize(vWorldNormal);
    float lightIntensity = max(0.0, dot(normal, sunDirection)); 
    float dayNightMix = smoothstep(0.0, 0.15, lightIntensity); // Adjust feathering
    vec3 finalColor = mix(nightColor, dayColor, dayNightMix);
    finalColor += nightColor * (1.0 - dayNightMix) * 1.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;