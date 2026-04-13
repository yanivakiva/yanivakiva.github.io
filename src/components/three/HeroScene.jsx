import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ParticleField from './ParticleField';

export default function HeroScene({ scrollProgress = 0 }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <ParticleField scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}
