import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import HandsScene from './HandsScene';

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.15, 2.2], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: 3 }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
      }}
    >
      <Suspense fallback={null}>
        <HandsScene />
      </Suspense>
    </Canvas>
  );
}
