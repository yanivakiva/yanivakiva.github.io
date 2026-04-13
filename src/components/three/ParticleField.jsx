import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 120;

export default function ParticleField() {
  const pointsRef = useRef();
  const { pointer } = useThree();

  const { positions, sizes, opacities, phases } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const opacities = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread particles across a wide field
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;

      sizes[i] = Math.random() * 3 + 0.5;
      opacities[i] = Math.random() * 0.4 + 0.1;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, sizes, opacities, phases };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const geo = pointsRef.current.geometry;
    const posArr = geo.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Gentle drift
      posArr[i3] += Math.sin(time * 0.1 + phase) * 0.001;
      posArr[i3 + 1] += Math.cos(time * 0.08 + phase * 1.3) * 0.001;

      // Very subtle mouse influence
      const dx = pointer.x * 4 - posArr[i3];
      const dy = pointer.y * 3 - posArr[i3 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        posArr[i3] += dx * 0.0003;
        posArr[i3 + 1] += dy * 0.0003;
      }
    }

    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={PARTICLE_COUNT} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#00ced1"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
