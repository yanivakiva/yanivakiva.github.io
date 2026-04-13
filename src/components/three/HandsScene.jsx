import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Joint positions for a reaching hand (approximate "Creation of Adam" pose)
// Each finger: [metacarpal, proximal, intermediate, distal, tip]
function generateHandJoints(isRight) {
  const mirror = isRight ? 1 : -1;
  const joints = [];

  // Wrist
  joints.push({ pos: [0, 0, 0], radius: 0.12 });

  // Palm base points
  joints.push({ pos: [0.08 * mirror, 0.02, 0], radius: 0.08 });
  joints.push({ pos: [0.16 * mirror, 0.05, 0], radius: 0.06 });

  // Index finger - reaching forward
  joints.push({ pos: [0.06 * mirror, 0.12, 0], radius: 0.045 });
  joints.push({ pos: [0.05 * mirror, 0.22, 0.01], radius: 0.04 });
  joints.push({ pos: [0.04 * mirror, 0.32, 0.02], radius: 0.035 });
  joints.push({ pos: [0.035 * mirror, 0.40, 0.02], radius: 0.03 });

  // Middle finger
  joints.push({ pos: [0.02 * mirror, 0.13, 0], radius: 0.045 });
  joints.push({ pos: [0.01 * mirror, 0.24, 0.01], radius: 0.04 });
  joints.push({ pos: [0.005 * mirror, 0.34, 0.015], radius: 0.035 });
  joints.push({ pos: [0.0 * mirror, 0.41, 0.015], radius: 0.03 });

  // Ring finger - slightly curled
  joints.push({ pos: [-0.03 * mirror, 0.12, 0], radius: 0.042 });
  joints.push({ pos: [-0.04 * mirror, 0.21, 0.01], radius: 0.037 });
  joints.push({ pos: [-0.045 * mirror, 0.29, 0.02], radius: 0.032 });
  joints.push({ pos: [-0.05 * mirror, 0.35, 0.03], radius: 0.028 });

  // Pinky - more curled
  joints.push({ pos: [-0.07 * mirror, 0.10, 0.01], radius: 0.038 });
  joints.push({ pos: [-0.08 * mirror, 0.17, 0.02], radius: 0.033 });
  joints.push({ pos: [-0.085 * mirror, 0.23, 0.035], radius: 0.028 });
  joints.push({ pos: [-0.09 * mirror, 0.27, 0.04], radius: 0.024 });

  // Thumb - extended
  joints.push({ pos: [0.12 * mirror, 0.02, 0.02], radius: 0.05 });
  joints.push({ pos: [0.15 * mirror, 0.08, 0.03], radius: 0.045 });
  joints.push({ pos: [0.16 * mirror, 0.15, 0.03], radius: 0.04 });
  joints.push({ pos: [0.15 * mirror, 0.20, 0.02], radius: 0.035 });

  return joints;
}

function ProceduralHand({ position, rotation, isRobot, isRight }) {
  const groupRef = useRef();
  const joints = useMemo(() => generateHandJoints(isRight), [isRight]);

  const material = useMemo(() => {
    if (isRobot) {
      return new THREE.MeshStandardMaterial({
        color: '#8892b0',
        metalness: 0.85,
        roughness: 0.15,
        emissive: '#00ced1',
        emissiveIntensity: 0.05,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: '#d4a574',
      metalness: 0.0,
      roughness: 0.7,
      emissive: '#e6c9a8',
      emissiveIntensity: 0.02,
    });
  }, [isRobot]);

  // Robot hand gets angular geometry, human hand gets spheres
  const jointGeo = useMemo(() => {
    return isRobot
      ? new THREE.BoxGeometry(1, 1, 1)
      : new THREE.SphereGeometry(1, 12, 12);
  }, [isRobot]);

  // Connection cylinders between adjacent joints
  const connections = useMemo(() => {
    const conns = [];
    // Finger chains: indices into joints array
    const fingers = [
      [3, 4, 5, 6],     // index
      [7, 8, 9, 10],    // middle
      [11, 12, 13, 14], // ring
      [15, 16, 17, 18], // pinky
      [19, 20, 21, 22], // thumb
    ];

    // Palm to finger bases
    conns.push([0, 3], [0, 7], [0, 11], [0, 15], [0, 19]);
    conns.push([1, 3], [1, 7], [2, 11], [2, 15]);

    for (const finger of fingers) {
      for (let i = 0; i < finger.length - 1; i++) {
        conns.push([finger[i], finger[i + 1]]);
      }
    }

    return conns;
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Joint spheres/boxes */}
      {joints.map((joint, i) => (
        <mesh
          key={`joint-${i}`}
          position={joint.pos}
          geometry={jointGeo}
          material={material}
          scale={joint.radius}
          castShadow
        />
      ))}

      {/* Connections between joints */}
      {connections.map(([a, b], i) => {
        const ja = joints[a];
        const jb = joints[b];
        const start = new THREE.Vector3(...ja.pos);
        const end = new THREE.Vector3(...jb.pos);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const length = start.distanceTo(end);
        const direction = end.clone().sub(start).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, direction);
        const avgRadius = (ja.radius + jb.radius) * 0.4;

        return (
          <mesh
            key={`conn-${i}`}
            position={[mid.x, mid.y, mid.z]}
            quaternion={quat}
            castShadow
          >
            {isRobot ? (
              <boxGeometry args={[avgRadius * 1.5, length, avgRadius * 1.5]} />
            ) : (
              <cylinderGeometry args={[avgRadius, avgRadius, length, 8]} />
            )}
            <meshStandardMaterial
              color={isRobot ? '#6a7490' : '#c99b6d'}
              metalness={isRobot ? 0.9 : 0.0}
              roughness={isRobot ? 0.1 : 0.65}
            />
          </mesh>
        );
      })}

      {/* Robot hand accents - glowing lines on finger segments */}
      {isRobot && joints.slice(3).map((joint, i) => (
        <mesh key={`glow-${i}`} position={joint.pos} scale={joint.radius * 0.5}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#00ced1" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function CenterGlow() {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.15);
    ref.current.material.opacity = 0.12 + Math.sin(t * 2) * 0.04;
  });

  return (
    <mesh ref={ref} position={[0, 0.38, 0]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#00ced1" transparent opacity={0.12} />
    </mesh>
  );
}

// Sparse background particles
function BackgroundParticles() {
  const count = 60;
  const ref = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6 - 3;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.2 + i) * 0.0008;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#00ced1" transparent opacity={0.25} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function HandsScene() {
  const groupRef = useRef();
  const { pointer } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    // Subtle rotation tracking mouse
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      pointer.x * 0.08,
      0.03
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      pointer.y * 0.05,
      0.03
    );
  });

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} color="#e6f1ff" />
      <directionalLight position={[-3, 3, 2]} intensity={0.4} color="#00ced1" />
      <pointLight position={[0, 0.4, 1]} intensity={0.6} color="#00ced1" distance={3} />

      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
        <group>
          {/* Human hand - reaching from the left */}
          <ProceduralHand
            position={[-0.55, -0.15, 0]}
            rotation={[0.3, 0.15, -0.6]}
            isRobot={false}
            isRight={false}
          />

          {/* Robot hand - reaching from the right */}
          <ProceduralHand
            position={[0.55, -0.15, 0]}
            rotation={[0.3, -0.15, 0.6]}
            isRobot={true}
            isRight={true}
          />

          {/* Glow at the meeting point */}
          <CenterGlow />
        </group>
      </Float>

      <BackgroundParticles />
    </group>
  );
}
