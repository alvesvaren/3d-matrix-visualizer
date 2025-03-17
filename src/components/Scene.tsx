import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { 
  Grid, 
  OrbitControls, 
  PerspectiveCamera,
  Html
} from "@react-three/drei";
import * as THREE from "three";
import { Matrix3D, MatrixTransform, createIdentityMatrix, multiplyMatrices, calculateDeterminant } from "../types";

interface SceneProps {
  matrices: MatrixTransform[];
  globalScale: number;
}

// Helper function to create a matrix from a transform
export const createMatrix = (transform: MatrixTransform): Matrix3D => {
  const matrix = new THREE.Matrix4();
  
  switch (transform.type) {
    case "scale": {
      const [x, y, z] = transform.values;
      matrix.makeScale(x, y, z);
      break;
    }
    case "rotate": {
      const [angleX, angleY, angleZ] = transform.values;
      // Create rotation matrices for each axis
      const mX = new THREE.Matrix4().makeRotationX(angleX * Math.PI / 180);
      const mY = new THREE.Matrix4().makeRotationY(angleY * Math.PI / 180);
      const mZ = new THREE.Matrix4().makeRotationZ(angleZ * Math.PI / 180);
      
      // Combine rotations (order: X, then Y, then Z)
      matrix.identity().multiply(mZ).multiply(mY).multiply(mX);
      break;
    }
    case "translate": {
      const [x, y, z] = transform.values;
      matrix.makeTranslation(x, y, z);
      break;
    }
    case "shear": {
      const [xy, xz, yx, yz, zx, zy] = transform.values;
      matrix.set(
        1, yx, zx, 0,
        xy, 1, zy, 0,
        xz, yz, 1, 0,
        0, 0, 0, 1
      );
      break;
    }
    case "custom": {
      matrix.fromArray(transform.values);
      break;
    }
  }
  
  // Apply the scalar factor if not 1
  if (transform.factor !== 1) {
    const scalingMatrix = new THREE.Matrix4().makeScale(
      transform.factor, 
      transform.factor, 
      transform.factor
    );
    matrix.multiply(scalingMatrix);
  }
  
  return { elements: Array.from(matrix.elements) };
};


// Apply transformation factor (interpolate between identity and full transformation)
const applyTransformationFactor = (matrix: Matrix3D, factor: number): Matrix3D => {
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
  
  useFrame(() => {
    if (xAxisRef.current && yAxisRef.current && zAxisRef.current) {
      // Apply the transformation matrix
      xAxisRef.current.setDirection(new THREE.Vector3(1, 0, 0).applyMatrix4(transform).normalize());
      yAxisRef.current.setDirection(new THREE.Vector3(0, 1, 0).applyMatrix4(transform).normalize());
      zAxisRef.current.setDirection(new THREE.Vector3(0, 0, 1).applyMatrix4(transform).normalize());
      
      // Scale the length
      const xLength = new THREE.Vector3(1, 0, 0).applyMatrix4(transform).length();
      const yLength = new THREE.Vector3(0, 1, 0).applyMatrix4(transform).length();
      const zLength = new THREE.Vector3(0, 0, 1).applyMatrix4(transform).length();
      
      xAxisRef.current.setLength(xLength);
      yAxisRef.current.setLength(yLength);
      zAxisRef.current.setLength(zLength);
    }
  });
  
  return (
    <>
      <arrowHelper 
        ref={xAxisRef}
        args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xc43b58, 0.1, 0.05]} 
      />
      <arrowHelper 
        ref={yAxisRef}
        args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, 0x6e402b, 0.1, 0.05]} 
      />
      <arrowHelper 
        ref={zAxisRef}
        args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 1, 0xc3863c, 0.1, 0.05]} 
      />
    </>
  );
};

// Component for drawing the transformed grid
const TransformedGrid = ({ transform }: { transform: THREE.Matrix4 }) => {
  return (
    <group matrixAutoUpdate={false} matrix={transform}>
      <Grid 
        args={[10, 10]} 
        position={[0, 0, 0]} 
        cellColor="#8c7378"
        sectionColor="#c33c5e"
        fadeDistance={10}
        fadeStrength={1}
      />
    </group>
  );
};

// Component for drawing the determinant cube
const TransformCube = ({ transform }: { transform: THREE.Matrix4 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Use a unit cube (1×1×1) at the origin (0,0,0)
  // The transformation matrix will be applied to it directly
  return (
    <mesh
      ref={meshRef}
      matrixAutoUpdate={false}
      matrix={transform}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color="#c33c5e" 
        wireframe={true}
        opacity={0.8}
        transparent={true}
      />
    </mesh>
  );
};

const Scene = ({ matrices, globalScale }: SceneProps) => {
  // Compute the combined transformation matrix
  const { combinedMatrix, determinant } = useMemo(() => {
    let result = createIdentityMatrix();
    
    // Apply each matrix transformation in sequence
    matrices.forEach(transform => {
      let matrix = createMatrix(transform);
      result = multiplyMatrices(result, applyTransformationFactor(matrix, transform.factor));
    });
    
    // Apply global scale - changed to use the correct applyGlobalScale function
    if (globalScale !== 1) {
      result = applyTransformationFactor(result, globalScale);
    }
    
    // Calculate the determinant
    const det = calculateDeterminant(result);
    
    return { 
      combinedMatrix: new THREE.Matrix4().fromArray(result.elements),
      determinant: det
    };
  }, [matrices, globalScale]);
  
  // Create a reference to allow orbit controls
  const orbitControlsRef = useRef(null);
  
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[3, 3, 3]}
        fov={50}
      />
      <OrbitControls ref={orbitControlsRef} />
      
      {/* Original grid and axes (before transformation) */}
      <Grid 
        args={[10, 10]} 
        position={[0, 0, 0]} 
        cellColor="#8c7378"
        sectionColor="#9c304b"
        fadeDistance={10}
        fadeStrength={1}
      >
        <meshBasicMaterial transparent opacity={0.2} />
      </Grid>
      <axesHelper args={[1]} />
      
      {/* Transformed grid and axes */}
      <TransformedGrid transform={combinedMatrix} />
      <Axes transform={combinedMatrix} />
      
      {/* Determinant cube */}
      <TransformCube transform={combinedMatrix} />
      
      {/* Environment lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      {/* Determinant display as HTML overlay */}
      <Html position={[2, 2, 2]}>
        <div className="bg-bg-800 text-white px-3 py-2 rounded shadow-lg text-sm">
          Det = {determinant.toFixed(2)}
        </div>
      </Html>
    </>
  );
};

export default Scene; 