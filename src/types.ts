export type MatrixType = 
  | "scale" 
  | "rotate"
  | "translate" 
  | "shear"
  | "custom";

export interface MatrixTransform {
  id: string;
  name: string;
  type: MatrixType;
  values: number[];
  factor: number;
}

export interface Matrix3D {
  elements: number[];
}

export const matrixValueOffsets = {
  scale: 1,
  rotate: 0,
  translate: 0,
  shear: 0,
  custom: 0
}

// Helper function to create identity matrix
export const createIdentityMatrix = (): Matrix3D => ({
  elements: [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
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
  const m = matrix.elements;
  
  // Using cofactor expansion along the first row
  return (
    m[0] * (
      m[5] * (m[10] * m[15] - m[11] * m[14]) -
      m[9] * (m[6] * m[15] - m[7] * m[14]) +
      m[13] * (m[6] * m[11] - m[7] * m[10])
    ) -
    m[4] * (
      m[1] * (m[10] * m[15] - m[11] * m[14]) -
      m[9] * (m[2] * m[15] - m[3] * m[14]) +
      m[13] * (m[2] * m[11] - m[3] * m[10])
    ) +
    m[8] * (
      m[1] * (m[6] * m[15] - m[7] * m[14]) -
      m[5] * (m[2] * m[15] - m[3] * m[14]) +
      m[13] * (m[2] * m[7] - m[3] * m[6])
    ) -
    m[12] * (
      m[1] * (m[6] * m[11] - m[7] * m[10]) -
      m[5] * (m[2] * m[11] - m[3] * m[10]) +
      m[9] * (m[2] * m[7] - m[3] * m[6])
    )
  );
}; 