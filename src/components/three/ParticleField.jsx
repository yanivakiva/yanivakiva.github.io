import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 800;
const CONNECTION_DISTANCE = 1.8;
const MOUSE_INFLUENCE = 2.0;

export default function ParticleField({ scrollProgress = 0 }) {
  const meshRef = useRef();
  const linesRef = useRef();
  const { pointer } = useThree();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleData = useMemo(() => {
    const positions = [];
    const velocities = [];
    const colors = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const side = i < PARTICLE_COUNT / 2 ? -1 : 1;
      const spread = 4;
      const gapOffset = side * 1.2;

      positions.push({
        x: gapOffset + (Math.random() - 0.5) * spread,
        y: (Math.random() - 0.5) * spread * 1.5,
        z: (Math.random() - 0.5) * spread,
        baseX: gapOffset + (Math.random() - 0.5) * spread,
        baseY: (Math.random() - 0.5) * spread * 1.5,
        baseZ: (Math.random() - 0.5) * spread,
      });

      velocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.001,
        phase: Math.random() * Math.PI * 2,
      });

      // Left cluster: warm white/light, Right cluster: cyan/electric
      if (side === -1) {
        const t = Math.random();
        colors.push(new THREE.Color().lerpColors(
          new THREE.Color('#e6f1ff'),
          new THREE.Color('#a8b2d1'),
          t
        ));
      } else {
        const t = Math.random();
        colors.push(new THREE.Color().lerpColors(
          new THREE.Color('#00ced1'),
          new THREE.Color('#7f5af0'),
          t
        ));
      }
    }
    return { positions, velocities, colors };
  }, []);

  // Pre-allocate line geometry
  const linePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 6 * 3), []);
  const lineColors = useMemo(() => new Float32Array(PARTICLE_COUNT * 6 * 3), []);

  const currentPositions = useMemo(() =>
    particleData.positions.map(p => ({ x: p.x, y: p.y, z: p.z })),
  [particleData]);

  let frameCount = 0;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    frameCount++;

    // Mouse position in 3D space (approximate)
    const mouseX = pointer.x * 5;
    const mouseY = pointer.y * 3;

    // Scroll-based spread: particles drift apart as scroll increases
    const spreadFactor = 1 + scrollProgress * 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData.positions[i];
      const v = particleData.velocities[i];

      // Floating motion
      const floatX = Math.sin(time * 0.3 + v.phase) * 0.15;
      const floatY = Math.cos(time * 0.2 + v.phase * 1.3) * 0.15;
      const floatZ = Math.sin(time * 0.15 + v.phase * 0.7) * 0.08;

      // Target position with scroll spread
      let targetX = p.baseX * spreadFactor + floatX;
      let targetY = p.baseY + floatY;
      let targetZ = p.baseZ + floatZ;

      // Mouse attraction
      const dx = mouseX - targetX;
      const dy = mouseY - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_INFLUENCE) {
        const force = (1 - dist / MOUSE_INFLUENCE) * 0.3;
        targetX += dx * force;
        targetY += dy * force;
      }

      // Smooth lerp to target
      currentPositions[i].x += (targetX - currentPositions[i].x) * 0.05;
      currentPositions[i].y += (targetY - currentPositions[i].y) * 0.05;
      currentPositions[i].z += (targetZ - currentPositions[i].z) * 0.05;

      dummy.position.set(currentPositions[i].x, currentPositions[i].y, currentPositions[i].z);

      // Subtle scale variation
      const scale = 0.015 + Math.sin(time + v.phase) * 0.005;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, particleData.colors[i]);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;

    // Update connection lines every 2nd frame for performance
    if (linesRef.current && frameCount % 2 === 0) {
      let lineIdx = 0;
      const maxLines = PARTICLE_COUNT * 3; // max line segments

      for (let i = 0; i < PARTICLE_COUNT && lineIdx < maxLines; i += 2) {
        for (let j = i + 1; j < Math.min(i + 20, PARTICLE_COUNT) && lineIdx < maxLines; j += 2) {
          const pi = currentPositions[i];
          const pj = currentPositions[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dz = pi.z - pj.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < CONNECTION_DISTANCE) {
            const alpha = 1 - dist / CONNECTION_DISTANCE;
            const baseIdx = lineIdx * 6;

            linePositions[baseIdx] = pi.x;
            linePositions[baseIdx + 1] = pi.y;
            linePositions[baseIdx + 2] = pi.z;
            linePositions[baseIdx + 3] = pj.x;
            linePositions[baseIdx + 4] = pj.y;
            linePositions[baseIdx + 5] = pj.z;

            // Blend colors between connected particles
            const ci = particleData.colors[i];
            const cj = particleData.colors[j];
            lineColors[baseIdx] = ci.r * alpha * 0.4;
            lineColors[baseIdx + 1] = ci.g * alpha * 0.4;
            lineColors[baseIdx + 2] = ci.b * alpha * 0.4;
            lineColors[baseIdx + 3] = cj.r * alpha * 0.4;
            lineColors[baseIdx + 4] = cj.g * alpha * 0.4;
            lineColors[baseIdx + 5] = cj.b * alpha * 0.4;

            lineIdx++;
          }
        }
      }

      // Zero out remaining lines
      for (let i = lineIdx * 6; i < linePositions.length; i++) {
        linePositions[i] = 0;
        lineColors[i] = 0;
      }

      linesRef.current.geometry.attributes.position.needsUpdate = true;
      linesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial transparent opacity={0.9} />
      </instancedMesh>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={lineColors.length / 3}
            array={lineColors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
