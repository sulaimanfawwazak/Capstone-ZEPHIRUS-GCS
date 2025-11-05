"use client";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Suspense } from "react";

function UAV({ heading, pitch, roll }) {  
  const gltf = useLoader(GLTFLoader, "/ZEPHIRUS.glb");

  // apply rotation only after it’s loaded
  useFrame(() => {
    const rad = Math.PI / 180;

    // Offset 45 degrees on Y-axis
    const headingOffset = 0;

    gltf.scene.rotation.set(
      pitch * rad,                              // X-axis: pitch
      (-heading * rad) + (headingOffset * rad), // Y-axis: Yaw
      roll * rad                                // Z-axis: roll
    );
  });

  return <primitive object={gltf.scene} scale={1.4} />;
}

export default function UAVModel({ heading = 0, pitch = 0, roll = 0 }) {
  return (
    // <div className="w-full h-64 mx-auto mb-4 border bg-gradient-to-t from-gray-800 to-gray-800 via-gray-700 border-gray-600/50">
    <div className="w-full h-64">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        {/* Camera position explanation:
            [0, 0.5, 3] means:
            x: 0 (centered left-right)
            y: 0.5 (slightly above the model)
            z: 3 (3 units in front of the model - viewing from the nose)
        */}
        <ambientLight intensity={4} />
        {/* <directionalLight intensity={1} position={[3, 3, 3]} /> */}
        <directionalLight intensity={1} position={[-3, 3, 3]} />
        <directionalLight intensity={1} position={[3, -3, 3]} />
        <directionalLight intensity={1} position={[3, 3, -3]} />

        {/* ✅ Suspense prevents undefined load errors */}
        <Suspense fallback={null}>
          <UAV heading={heading} pitch={pitch} roll={roll} />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}