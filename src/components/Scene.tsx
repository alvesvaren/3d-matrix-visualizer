import { Grid, MultiMaterial, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCombinedMatrix, useCSSVariable, usePref, useViewOffset } from "../store/hooks";


// Component for drawing coordinate axes
const Axes = ({ transform }: { transform: THREE.Matrix4 }) => {
  // X-axis (red)
  const xAxisRef = useRef<THREE.ArrowHelper>(null);
  // Y-axis (green)
  const yAxisRef = useRef<THREE.ArrowHelper>(null);
  // Z-axis (blue)
  const zAxisRef = useRef<THREE.ArrowHelper>(null);

  // Refs for the text labels
  const xLabelRef = useRef<THREE.Group>(null);
  const yLabelRef = useRef<THREE.Group>(null);
  const zLabelRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (xAxisRef.current && yAxisRef.current && zAxisRef.current) {
      // Get transformed direction vectors
      const xDir = new THREE.Vector3(1, 0, 0).applyMatrix4(transform).normalize();
      const yDir = new THREE.Vector3(0, 1, 0).applyMatrix4(transform).normalize();
      const zDir = new THREE.Vector3(0, 0, 1).applyMatrix4(transform).normalize();

      // Apply the transformation matrix to arrows
      xAxisRef.current.setDirection(xDir);
      yAxisRef.current.setDirection(yDir);
      zAxisRef.current.setDirection(zDir);

      // Scale the length without stretching - use a fixed arrow size
      const xLength = new THREE.Vector3(1, 0, 0).applyMatrix4(transform).length();
      const yLength = new THREE.Vector3(0, 1, 0).applyMatrix4(transform).length();
      const zLength = new THREE.Vector3(0, 0, 1).applyMatrix4(transform).length();

      // Set length for main axis but with fixed head size
      xAxisRef.current.setLength(xLength, 0.1, 0.05);
      yAxisRef.current.setLength(yLength, 0.1, 0.05);
      zAxisRef.current.setLength(zLength, 0.1, 0.05);

      // Update label positions
      if (xLabelRef.current && yLabelRef.current && zLabelRef.current) {
        // Position labels at the end of each axis with fixed distance offset
        const fixedOffset = 0.15; // Fixed distance from axis end
        const xPos = xDir.clone().multiplyScalar(xLength + fixedOffset);
        const yPos = yDir.clone().multiplyScalar(yLength + fixedOffset);
        const zPos = zDir.clone().multiplyScalar(zLength + fixedOffset);

        xLabelRef.current.position.copy(xPos);
        yLabelRef.current.position.copy(yPos);
        zLabelRef.current.position.copy(zPos);

        // Make labels face the camera
        xLabelRef.current.lookAt(camera.position);
        yLabelRef.current.lookAt(camera.position);
        zLabelRef.current.lookAt(camera.position);
      }
    }
  });

  return (
    <>
      <arrowHelper ref={xAxisRef} args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xc43b58, 0.1, 0.05]} />
      <arrowHelper ref={yAxisRef} args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, 0x6e402b, 0.1, 0.05]} />
      <arrowHelper ref={zAxisRef} args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 1, 0xc3863c, 0.1, 0.05]} />

      {/* Transformed axis labels */}
      <group ref={xLabelRef}>
        <Text scale={[0.1, 0.1, 0.1]} color='#c43b58' anchorX='center' anchorY='middle'>
          x'
        </Text>
      </group>

      <group ref={yLabelRef}>
        <Text scale={[0.1, 0.1, 0.1]} color='#6e402b' anchorX='center' anchorY='middle'>
          y'
        </Text>
      </group>

      <group ref={zLabelRef}>
        <Text scale={[0.1, 0.1, 0.1]} color='#c3863c' anchorX='center' anchorY='middle'>
          z'
        </Text>
      </group>
    </>
  );
};

const useGridColors = () => {
  const gridMainColor = useCSSVariable("--color-bg-700");
  const gridSectionColor = useCSSVariable("--color-primary-700");
  return { gridMainColor, gridSectionColor };
};

// Component for drawing the transformed grid
const TransformedGrid = ({ transform }: { transform: THREE.Matrix4 }) => {
  const { gridMainColor, gridSectionColor } = useGridColors();
  return (
    <group matrixAutoUpdate={false} matrix={transform}>
      <Grid args={[10, 10]} position={[0, 0, 0]} cellColor={gridMainColor} sectionColor={gridSectionColor} fadeDistance={7} fadeFrom={0} infiniteGrid />
    </group>
  );
};

// Component for drawing the determinant cube
const TransformCube = ({ transform }: { transform: THREE.Matrix4 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useCSSVariable("--color-accent-700");
  // Use a unit cube (1×1×1) at the origin (0,0,0)
  // The transformation matrix will be applied to it directly
  // const matrixOffset = new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5);
  // const matrix = new THREE.Matrix4().multiplyMatrices(transform, matrixOffset);

  return (
    <mesh ref={meshRef} matrixAutoUpdate={false} matrix={transform}>
      <boxGeometry args={[1, 1, 1]} />
      <MultiMaterial>
        <meshStandardMaterial color={color} wireframe={false} opacity={0.2} transparent={true} />
        <meshStandardMaterial color={color} wireframe={true} transparent={false} />
      </MultiMaterial>
    </mesh>
  );
};

// Component types
interface SceneProps {
  isMobile?: boolean;
}

const Scene = ({ isMobile = false }: SceneProps) => {
  const combinedMatrix = useCombinedMatrix();
  const showOriginalAxis = usePref("originalAxis");
  const showTransformedAxis = usePref("transformedAxis");
  const showLabels = usePref("labels");
  const showDeterminant = usePref("determinant");
  const showOriginalGrid = usePref("originalGrid");
  const showTransformedGrid = usePref("transformedGrid");

  const threeMatrix = new THREE.Matrix4().fromArray(combinedMatrix.elements);

  // Create a reference to allow orbit controls
  const orbitControlsRef = useRef(null);

  // Refs for original axis labels
  const xOrigLabelRef = useRef<THREE.Group>(null);
  const yOrigLabelRef = useRef<THREE.Group>(null);
  const zOrigLabelRef = useRef<THREE.Group>(null);
  const { gridMainColor, gridSectionColor } = useGridColors();

  // We have a sidebar that takes up 1/3 of the screen width
  // We want to offset the camera position so that the sidebar is visible
  const viewOffset = useViewOffset(isMobile);
  const camera = useRef<THREE.PerspectiveCamera>(null);

  useFrame(({ camera: sceneCamera }) => {
    if (camera.current) {
      // Horizontal sidebar - adjust X offset
      camera.current.setViewOffset(window.innerWidth, window.innerHeight, viewOffset.offsetX, viewOffset.offsetY, window.innerWidth, window.outerHeight);
    }

    // Make original axis labels face the camera
    if (showLabels && xOrigLabelRef.current && yOrigLabelRef.current && zOrigLabelRef.current) {
      xOrigLabelRef.current.lookAt(sceneCamera.position);
      yOrigLabelRef.current.lookAt(sceneCamera.position);
      zOrigLabelRef.current.lookAt(sceneCamera.position);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault position={[3, 3, 3]} fov={50} />
      <OrbitControls ref={orbitControlsRef} />

      {/* Original grid and axes (before transformation) */}
      {showOriginalGrid && (
        <Grid args={[10, 10]} position={[0, 0, 0]} cellColor={gridMainColor} sectionColor={gridSectionColor} fadeDistance={7} infiniteGrid fadeFrom={0} />
      )}
      {showOriginalAxis && <axesHelper args={[1]} />}

      {/* Original axis labels */}
      {showLabels && (
        <>
          <group ref={xOrigLabelRef} position={[1.1, 0, 0]}>
            <Text scale={[0.1, 0.1, 0.1]} color='red' anchorX='center' anchorY='middle'>
              x
            </Text>
          </group>

          <group ref={yOrigLabelRef} position={[0, 1.1, 0]}>
            <Text scale={[0.1, 0.1, 0.1]} color='green' anchorX='center' anchorY='middle'>
              y
            </Text>
          </group>

          <group ref={zOrigLabelRef} position={[0, 0, 1.1]}>
            <Text scale={[0.1, 0.1, 0.1]} color='blue' anchorX='center' anchorY='middle'>
              z
            </Text>
          </group>
        </>
      )}

      <group matrix={threeMatrix}>
        {showTransformedGrid && <TransformedGrid transform={threeMatrix} />}
        {showTransformedAxis && <Axes transform={threeMatrix} />}
      </group>

      {/* Determinant cube */}
      {showDeterminant && <TransformCube transform={threeMatrix} />}

      {/* Environment lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
    </>
  );
};

export default Scene;
