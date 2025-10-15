import * as THREE from 'three';

// The vertex shader can be shared, it's the same for all planets.
export const planetVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const planetFragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture; 
  uniform bool hasNightTexture;   
  uniform vec3 sunDirection;      

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 finalColor;

    vec3 normal = normalize(vWorldNormal);
    float lightIntensity = max(0.0, dot(normal, sunDirection));

    if (hasNightTexture) {
      vec3 nightColor = texture2D(nightTexture, vUv).rgb;
      float dayNightMix = smoothstep(0.0, 0.15, lightIntensity);
      finalColor = mix(nightColor, dayColor, dayNightMix);
      finalColor += nightColor * (1.0 - dayNightMix) * 1.5; // Add back emissive glow
    } else {
      // We apply the lighting directly to the day texture and add a hint of ambient light.
      finalColor = dayColor * (lightIntensity * 0.9 + 0.1);
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;