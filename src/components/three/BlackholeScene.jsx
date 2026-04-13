import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// Simplified interstellar-style blackhole shader
// Inspired by gravitational lensing visuals but optimized for background use
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

  // Simplex noise for star field
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  float stars(vec2 uv, float t) {
    float result = 0.0;
    for (float i = 0.0; i < 3.0; i++) {
      vec2 p = uv * (150.0 + i * 80.0);
      vec2 f = fract(p);
      vec2 id = floor(p);

      vec3 rnd = hash33(vec3(id, i));
      float size = rnd.z * 0.0015 + 0.0003;
      vec2 center = rnd.xy;

      float d = length(f - center);
      float star = smoothstep(size + 0.001, size, d);

      // Twinkle
      float twinkle = sin(t * (1.0 + rnd.x * 3.0) + rnd.y * 6.28) * 0.3 + 0.7;
      result += star * twinkle * (0.5 + rnd.z * 0.5);
    }
    return result;
  }

  // Accretion disk glow
  float diskGlow(vec2 uv, float time) {
    float r = length(uv);
    float angle = atan(uv.y, uv.x) + time * 0.15;

    // Disk shape - ring with falloff
    float innerRadius = 0.12;
    float outerRadius = 0.45;
    float diskMask = smoothstep(innerRadius, innerRadius + 0.08, r) *
                     smoothstep(outerRadius, outerRadius - 0.15, r);

    // Swirl pattern
    float swirl = sin(angle * 3.0 + r * 12.0 - time * 0.5) * 0.5 + 0.5;
    float swirl2 = sin(angle * 5.0 - r * 8.0 + time * 0.3) * 0.5 + 0.5;
    float pattern = mix(swirl, swirl2, 0.5);

    // Brightness variation
    float brightness = diskMask * (0.6 + pattern * 0.4);

    // Vertical thinning (disk is flat, viewed at angle)
    float tilt = 0.35;
    float verticalMask = exp(-abs(uv.y - uv.x * tilt) * 8.0 / max(r, 0.01));

    return brightness * verticalMask;
  }

  // Gravitational lensing distortion
  vec2 lensDistort(vec2 uv, vec2 center) {
    vec2 d = uv - center;
    float r = length(d);
    float schwarzschild = 0.08;

    if (r < schwarzschild) return vec2(-1.0); // Inside event horizon

    // Deflection angle (simplified)
    float deflection = schwarzschild / (r * r) * 0.5;
    float angle = atan(d.y, d.x);

    return uv + d / r * deflection;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 centered = (uv - 0.5) * vec2(aspect, 1.0);

    // Subtle mouse offset for parallax
    vec2 mouseOffset = (uMouse - 0.5) * 0.03;
    vec2 bhCenter = vec2(0.0) + mouseOffset;

    // Apply gravitational lensing to star field
    vec2 lensed = lensDistort(centered, bhCenter);

    vec3 color = vec3(0.0);

    // Event horizon (pure black circle)
    float dist = length(centered - bhCenter);
    float horizon = smoothstep(0.07, 0.09, dist);

    // Star field (only outside event horizon)
    if (lensed.x > -0.5) {
      float starField = stars(lensed + 0.5, uTime);
      color += vec3(0.85, 0.9, 1.0) * starField * horizon;
    }

    // Accretion disk
    vec2 diskUv = centered - bhCenter;
    float disk = diskGlow(diskUv, uTime);

    // Disk color: warm white -> cyan -> purple gradient based on radius
    float r = length(diskUv);
    vec3 innerColor = vec3(1.0, 0.95, 0.85);       // Hot white
    vec3 midColor = vec3(0.0, 0.81, 0.82);          // Cyan #00ced1
    vec3 outerColor = vec3(0.5, 0.35, 0.94);        // Purple #7f5af0

    float t1 = smoothstep(0.12, 0.25, r);
    float t2 = smoothstep(0.25, 0.45, r);
    vec3 diskColor = mix(innerColor, midColor, t1);
    diskColor = mix(diskColor, outerColor, t2);

    color += diskColor * disk * 0.7;

    // Photon ring (bright ring just outside event horizon)
    float photonRing = exp(-pow((dist - 0.1) * 25.0, 2.0)) * 0.4;
    color += vec3(1.0, 0.95, 0.9) * photonRing;

    // Soft outer glow
    float outerGlow = exp(-dist * 3.0) * 0.06;
    color += vec3(0.0, 0.81, 0.82) * outerGlow;

    // Vignette
    float vignette = 1.0 - smoothstep(0.4, 1.0, length(uv - 0.5) * 1.2);
    color *= mix(0.3, 1.0, vignette);

    // Overall dimming for readability of text
    color *= 0.65;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const BlackholeMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(1, 1),
    uMouse: new THREE.Vector2(0.5, 0.5),
  },
  vertexShader,
  fragmentShader
);

extend({ BlackholeMaterial });

export default function BlackholeScene() {
  const materialRef = useRef();
  const { size, pointer } = useThree();

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uTime = state.clock.elapsedTime;
    materialRef.current.uResolution.set(size.width, size.height);
    // Smooth mouse follow
    materialRef.current.uMouse.x = THREE.MathUtils.lerp(
      materialRef.current.uMouse.x,
      (pointer.x + 1) / 2,
      0.02
    );
    materialRef.current.uMouse.y = THREE.MathUtils.lerp(
      materialRef.current.uMouse.y,
      (pointer.y + 1) / 2,
      0.02
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <blackholeMaterial ref={materialRef} />
    </mesh>
  );
}
