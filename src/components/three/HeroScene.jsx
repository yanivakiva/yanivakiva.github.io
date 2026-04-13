import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import BlackholeScene from './BlackholeScene';

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
      }}
      camera={{ position: [0, 0, 1] }}
    >
      <Suspense fallback={null}>
        <BlackholeScene />
      </Suspense>
    </Canvas>
  );
}
