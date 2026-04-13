import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// Interstellar-style Gargantua black hole shader
// Uses Schwarzschild geodesic integration for accurate gravitational lensing
// The accretion disk appears above and below the black hole due to light bending
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;

  varying vec2 vUv;

  #define PI 3.14159265359
  #define NSTEPS 80
  #define STEP 0.12

  // Hash for procedural stars
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Procedural star field
  float starField(vec2 uv) {
    float stars = 0.0;
    for (float i = 0.0; i < 4.0; i++) {
      vec2 gridUv = uv * (200.0 + i * 150.0);
      vec2 id = floor(gridUv);
      vec2 f = fract(gridUv);

      float h = hash(id + i * 100.0);
      if (h > 0.97) {
        float brightness = (h - 0.97) / 0.03;
        vec2 center = vec2(hash(id + 0.1), hash(id + 0.2));
        float d = length(f - center);
        float size = 0.01 + brightness * 0.02;
        stars += smoothstep(size, 0.0, d) * brightness;
      }
    }
    return stars;
  }

  // Map 3D ray direction to 2D equirectangular coordinates
  vec2 toSpherical(vec3 dir) {
    return vec2(
      atan(dir.z, dir.x) / (2.0 * PI) + 0.5,
      asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5
    );
  }

  // Temperature to color (approximation of black-body radiation)
  vec3 tempToColor(float temp) {
    temp = clamp(temp / 100.0, 10.0, 400.0);
    vec3 col;
    col.r = temp <= 66.0 ? 1.0 : clamp(1.29293 * pow(temp - 60.0, -0.1332), 0.0, 1.0);
    col.g = temp <= 66.0 ? clamp(0.39008 * log(temp) - 0.63184, 0.0, 1.0) :
                           clamp(1.12989 * pow(temp - 60.0, -0.0755), 0.0, 1.0);
    col.b = temp >= 66.0 ? 1.0 :
            temp <= 19.0 ? 0.0 : clamp(0.54320 * log(temp - 10.0) - 1.19625, 0.0, 1.0);
    return col;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // Subtle mouse parallax for camera direction
    vec2 mouseOff = (uMouse - 0.5) * 0.15;

    // Camera setup - observer at distance, looking at origin
    float camDist = 15.0;
    float inclination = 1.35 + mouseOff.y * 0.3; // ~77 degrees, slightly above disk plane
    float azimuth = uTime * 0.03 + mouseOff.x * 0.5;

    vec3 camPos = vec3(
      cos(azimuth) * sin(inclination) * camDist,
      cos(inclination) * camDist,
      sin(azimuth) * sin(inclination) * camDist
    );

    vec3 forward = normalize(-camPos);
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(forward, worldUp));
    vec3 up = cross(right, forward);

    float fov = 0.8;
    vec3 rayDir = normalize(forward * fov + right * p.x + up * p.y);

    // --- Schwarzschild geodesic integration ---
    // Leapfrog integration of light paths in curved spacetime
    vec3 pos = camPos;
    vec3 vel = rayDir;

    // Conserved quantity: angular momentum squared
    vec3 h = cross(pos, vel);
    float h2 = dot(h, h);

    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 oldPos;

    float DISK_INNER = 3.0;  // innermost stable orbit
    float DISK_OUTER = 12.0;

    for (int i = 0; i < NSTEPS; i++) {
      oldPos = pos;

      // Leapfrog step
      pos += vel * STEP;
      float r2 = dot(pos, pos);
      vec3 accel = -1.5 * h2 * pos / (r2 * r2 * sqrt(r2));
      vel += accel * STEP;

      float dist = length(pos);
      float oldDist = length(oldPos);

      // Event horizon check (Schwarzschild radius = 1.0)
      if (dist < 1.0) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
        break;
      }

      // Accretion disk intersection (z = 0 plane crossing)
      if (oldPos.y * pos.y < 0.0) {
        // Find intersection point with y=0 plane
        float t = -oldPos.y / (pos.y - oldPos.y);
        vec3 isec = oldPos + t * (pos - oldPos);
        float r = length(isec);

        if (r > DISK_INNER && r < DISK_OUTER) {
          // Disk texture coordinate
          float phi = atan(isec.z, isec.x) - uTime * 0.2;

          // Temperature decreases with radius (T ~ r^(-3/4))
          float temp = 5500.0 * pow(r / DISK_INNER, -0.75);

          // Swirl pattern
          float swirl = sin(phi * 6.0 + r * 1.5) * 0.3 + 0.7;
          float swirl2 = sin(phi * 3.0 - r * 2.0 + uTime * 0.1) * 0.2 + 0.8;
          float pattern = swirl * swirl2;

          // Disk opacity fades at edges
          float rNorm = (r - DISK_INNER) / (DISK_OUTER - DISK_INNER);
          float diskAlpha = smoothstep(0.0, 0.1, rNorm) * smoothstep(1.0, 0.6, rNorm);
          diskAlpha *= pattern;

          // Black body color for the temperature
          vec3 diskColor = tempToColor(temp);

          // Brightness boost near inner edge
          float innerBoost = 1.0 + 2.0 * exp(-(r - DISK_INNER) * 1.5);
          diskColor *= innerBoost * 0.6;

          color.rgb += diskColor * diskAlpha * 0.55;
        }
      }
    }

    // Background stars (only if we didn't hit the event horizon)
    float dist = length(pos);
    if (dist > 1.0) {
      vec3 finalDir = normalize(pos - oldPos);
      vec2 starUv = toSpherical(finalDir);

      // Procedural stars
      float stars = starField(starUv);
      color.rgb += vec3(0.9, 0.92, 1.0) * stars * 0.5;

      // Subtle milky way band
      float milky = exp(-pow(finalDir.y * 3.0, 2.0)) * 0.015;
      color.rgb += vec3(0.7, 0.75, 0.85) * milky;
    }

    // Photon ring glow (at r ≈ 1.5, the photon sphere)
    // Computed in screen space for efficiency
    vec2 bhScreen = vec2(0.0); // black hole is at center
    float screenDist = length(p - bhScreen);
    float photonRing = exp(-pow((screenDist - 0.045) * 60.0, 2.0)) * 0.15;
    color.rgb += vec3(1.0, 0.85, 0.6) * photonRing;

    // Subtle warm glow around the black hole
    float glow = exp(-screenDist * 8.0) * 0.03;
    color.rgb += vec3(1.0, 0.7, 0.4) * glow;

    // Vignette
    float vignette = 1.0 - smoothstep(0.3, 0.85, length(uv - 0.5));
    color.rgb *= mix(0.15, 1.0, vignette);

    // Tone mapping
    color.rgb = color.rgb / (1.0 + color.rgb); // Reinhard
    color.rgb = pow(color.rgb, vec3(0.9)); // Slight gamma

    gl_FragColor = color;
  }
`;

const GargantuaMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(1, 1),
    uMouse: new THREE.Vector2(0.5, 0.5),
  },
  vertexShader,
  fragmentShader
);

extend({ GargantuaMaterial });

export default function BlackholeScene() {
  const materialRef = useRef();
  const { size, pointer } = useThree();

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uTime = state.clock.elapsedTime;
    materialRef.current.uResolution.set(size.width, size.height);
    materialRef.current.uMouse.x = THREE.MathUtils.lerp(
      materialRef.current.uMouse.x,
      (pointer.x + 1) / 2,
      0.015
    );
    materialRef.current.uMouse.y = THREE.MathUtils.lerp(
      materialRef.current.uMouse.y,
      (pointer.y + 1) / 2,
      0.015
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <gargantuaMaterial ref={materialRef} />
    </mesh>
  );
}
