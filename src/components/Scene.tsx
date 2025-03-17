import { Grid, MultiMaterial, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCombinedMatrix, useCSSVariable, usePref, useViewOffset } from "../store/hooks";
import { Matrix3D, MatrixTransform, createIdentityMatrix, matrixValueOffsets } from "../types";

const degToRad = (deg: number) => deg * (Math.PI / 180);

// Helper function to create a matrix from a transform
export const createMatrix = (transform: MatrixTransform): Matrix3D => {
  let matrix = new THREE.Matrix4();

  const factoredValues = transform.values.map(value => value * transform.factor + matrixValueOffsets[transform.type]);

  switch (transform.type) {
    case "scale": {
      const [x, y, z] = factoredValues;
      matrix.makeScale(x, y, z);
      break;
    }
    case "rotate": {
      const [angleX, angleY, angleZ] = factoredValues;
      const euler = new THREE.Euler(degToRad(angleX), degToRad(angleY), degToRad(angleZ));
      matrix.makeRotationFromEuler(euler);
      break;
    }
    case "translate": {
      const [x, y, z] = factoredValues;
      matrix.makeTranslation(x, y, z);
      break;
    }
    case "shear": {
      const [xy, xz, yx, yz, zx, zy] = factoredValues;
      matrix.makeShear(xy, xz, yx, yz, zx, zy);
      break;
    }
    case "custom": {
      matrix.fromArray(transform.values);
      matrix.fromArray(applyTransformationFactor(matrix, transform.factor).elements);
      break;
    }
  }
  return matrix;
};

// Apply transformation factor (interpolate between identity and full transformation)
export const applyTransformationFactor = (matrix: Matrix3D, factor: number): Matrix3D => {
  if (factor === 1) return matrix; // No change needed at 100%
  if (factor === 0) return createIdentityMatrix(); // Return identity at 0%

  // Create interpolated matrix by linear interpolation between identity and full transform
  const identity = createIdentityMatrix();
  const result = Array(16).fill(0);

  for (let i = 0; i < 16; i++) {
    result[i] = identity.elements[i] * (1 - factor) + matrix.elements[i] * factor;
  }

  return { elements: result };
};

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

  useFrame(() => {
    if (xAxisRef.current && yAxisRef.current && zAxisRef.current) {
      // Get transformed direction vectors
      const xDir = new THREE.Vector3(1, 0, 0).applyMatrix4(transform).normalize();
      const yDir = new THREE.Vector3(0, 1, 0).applyMatrix4(transform).normalize();
      const zDir = new THREE.Vector3(0, 0, 1).applyMatrix4(transform).normalize();

      // Apply the transformation matrix to arrows
      xAxisRef.current.setDirection(xDir);
      yAxisRef.current.setDirection(yDir);
      zAxisRef.current.setDirection(zDir);

      // Scale the length
      const xLength = new THREE.Vector3(1, 0, 0).applyMatrix4(transform).length();
      const yLength = new THREE.Vector3(0, 1, 0).applyMatrix4(transform).length();
      const zLength = new THREE.Vector3(0, 0, 1).applyMatrix4(transform).length();

      xAxisRef.current.setLength(xLength);
      yAxisRef.current.setLength(yLength);
      zAxisRef.current.setLength(zLength);

      // Update label positions
      if (xLabelRef.current && yLabelRef.current && zLabelRef.current) {
        // Position labels at the end of each axis
        const xPos = xDir.clone().multiplyScalar(xLength * 1.1);
        const yPos = yDir.clone().multiplyScalar(yLength * 1.1);
        const zPos = zDir.clone().multiplyScalar(zLength * 1.1);

        xLabelRef.current.position.copy(xPos);
        yLabelRef.current.position.copy(yPos);
        zLabelRef.current.position.copy(zPos);
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

// Component for drawing the transformed grid
const TransformedGrid = ({ transform }: { transform: THREE.Matrix4 }) => {
  const gridMainColor = useCSSVariable("--color-primary");
  const gridSectionColor = useCSSVariable("--color-primary-700");
  return (
    <group matrixAutoUpdate={false} matrix={transform}>
      <Grid args={[10, 10]} position={[0, 0, 0]} cellColor={gridMainColor} sectionColor={gridSectionColor} fadeDistance={10} fadeStrength={1} />
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

const Scene = () => {
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
  const gridMainColor = useCSSVariable("--color-bg-500");
  const gridSectionColor = useCSSVariable("--color-bg-700");

  // We have a sidebar that takes up 1/3 of the screen width
  // We want to offset the camera position so that the sidebar is visible
  const viewOffset = useViewOffset();
  const camera = useRef<THREE.PerspectiveCamera>(null);

  useFrame(() => {
    if (camera.current) {
      camera.current.setViewOffset(window.innerWidth, window.innerHeight, viewOffset.offsetX, viewOffset.offsetY, window.innerWidth, window.innerHeight);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault position={[3, 3, 3]} fov={50} />
      <OrbitControls ref={orbitControlsRef} />

      {/* Original grid and axes (before transformation) */}
      {showOriginalGrid && (
        <Grid args={[10, 10]} position={[0, 0, 0]} cellColor={gridMainColor} sectionColor={gridSectionColor} fadeDistance={10} fadeStrength={1}>
          <meshBasicMaterial transparent opacity={0.2} />
        </Grid>
      )}
      {showOriginalAxis && <axesHelper args={[1]} />}

      {/* Original axis labels */}
      {showLabels && (
        <>
          <Text position={[1.1, 0, 0]} scale={[0.1, 0.1, 0.1]} color='red' anchorX='center' anchorY='middle'>
            x
          </Text>
          <Text position={[0, 1.1, 0]} scale={[0.1, 0.1, 0.1]} color='green' anchorX='center' anchorY='middle'>
            y
          </Text>
          <Text position={[0, 0, 1.1]} scale={[0.1, 0.1, 0.1]} color='blue' anchorX='center' anchorY='middle'>
            z
          </Text>
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
