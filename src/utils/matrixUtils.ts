import { ArrowLeftRight, LucideIcon, Move, RotateCcw, Scaling, SlidersHorizontal } from "lucide-react";
import { Matrix3D, MatrixType, MatrixTransform } from "../types";
import { Matrix4, Euler } from "three";

// Matrix type information for the UI
export const matrixTypes: { type: MatrixType; name: string; description: string; icon: LucideIcon }[] = [
  {
    type: "scale",
    name: "Scale",
    icon: Scaling,
    description: "Scales the object along the X, Y, and Z axes",
  },
  {
    type: "rotate",
    name: "Rotate",
    icon: RotateCcw,
    description: "Rotates the object around the X, Y, and Z axes",
  },
  {
    type: "shear",
    name: "Shear",
    icon: ArrowLeftRight,
    description: "Deforms the object by angling its faces",
  },
  {
    type: "translate",
    name: "Translate",
    icon: Move,
    description: "Moves the object along the X, Y, and Z axes",
  },
  {
    type: "custom",
    name: "Custom",
    description: "Define a custom 4x4 transformation matrix",
    icon: SlidersHorizontal,
  },
];

// Default values for different types of matrices
export const getDefaultValues = (type: MatrixType): number[] => {
  switch (type) {
    case "scale":
      return [0, 0, 0]; // x, y, z scale factors
    case "rotate":
      return [0, 0, 0]; // x, y, z rotation angles in degrees
    case "translate":
      return [0, 0, 0]; // x, y, z translation
    case "shear":
      return [0, 0, 0, 0, 0, 0]; // xy, xz, yx, yz, zx, zy
    case "custom":
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; // identity matrix (16 elements)
    default:
      return [];
  }
};

// Labels for matrix sliders
export const getValueLabels = (type: MatrixType): string[] => {
  switch (type) {
    case "scale":
      return ["Scale X", "Scale Y", "Scale Z"];
    case "rotate":
      return ["Rotate X", "Rotate Y", "Rotate Z"];
    case "translate":
      return ["X", "Y", "Z"];
    case "shear":
      return ["XY", "XZ", "YX", "YZ", "ZX", "ZY"];
    case "custom":
      return [];
    default:
      return [];
  }
};

// Get slider range and step based on matrix type
export const getSliderProps = (type: MatrixType) => {
  switch (type) {
    case "scale":
      return { min: -4, max: 4, step: 0.1 };
    case "rotate":
      return { min: -180, max: 180, step: 1 };
    case "translate":
      return { min: -5, max: 5, step: 0.1 };
    case "shear":
      return { min: -5, max: 5, step: 0.1 };
    case "custom":
      // For custom matrix, we'll want a larger range
      return { min: -5, max: 5, step: 0.1 };
    default:
      return { min: -10, max: 10, step: 0.1 };
  }
};

export const matrixValueOffsets = {
  scale: 1,
  rotate: 0,
  translate: 0,
  shear: 0,
  custom: 0,
};

// Helper function to create identity matrix
export const createIdentityMatrix = (): Matrix3D => ({
  elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
});

// Helper function to multiply matrices
export const multiplyMatrices = (a: Matrix3D, b: Matrix3D): Matrix3D => {
  const result = Array(16).fill(0);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a.elements[i * 4 + k] * b.elements[k * 4 + j];
      }
      result[i * 4 + j] = sum;
    }
  }

  return { elements: result };
};

// Calculate the determinant of a 4x4 matrix
export const calculateDeterminant = (matrix: Matrix3D): number => {
  const m = new Matrix4();
  m.fromArray(matrix.elements);

  return m.determinant() ?? 0;
};

const degToRad = (deg: number) => deg * (Math.PI / 180);

// Helper function to create a matrix from a transform
export const createMatrix = (transform: MatrixTransform): Matrix3D => {
  let matrix = new Matrix4();

  const factoredValues = transform.values.map(value => value * transform.factor + matrixValueOffsets[transform.type]);

  switch (transform.type) {
    case "scale": {
      const [x, y, z] = factoredValues;
      matrix.makeScale(x, y, z);
      break;
    }
    case "rotate": {
      const [angleX, angleY, angleZ] = factoredValues;
      const euler = new Euler(degToRad(angleX), degToRad(angleY), degToRad(angleZ));
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
      matrix = matrix.fromArray(transform.values).transpose();
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
