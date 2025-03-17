import { create } from "zustand";
import { applyTransformationFactor, createMatrix } from "../components/Scene";
import { Matrix3D, MatrixTransform, calculateDeterminant, createIdentityMatrix, multiplyMatrices } from "../types";

interface MatrixState {
  matrices: MatrixTransform[];
  globalScale: number;

  // Actions
  addMatrix: (matrix: MatrixTransform) => void;
  removeMatrix: (id: string) => void;
  updateMatrix: (id: string, values: number[], factor: number) => void;
  setGlobalScale: (scale: number) => void;
  reset: () => void;
}

export const useMatrixStore = create<MatrixState>(set => ({
  matrices: [],
  globalScale: 1,

  addMatrix: matrix =>
    set(state => ({
      matrices: [...state.matrices, matrix],
    })),

  removeMatrix: id =>
    set(state => ({
      matrices: state.matrices.filter(m => m.id !== id),
    })),

  updateMatrix: (id, values, factor) =>
    set(state => ({
      matrices: state.matrices.map(m => {
        if (m.id === id) {
          return {
            ...m,
            factor,
            values,
          };
        }
        return m;
      }),
    })),

  setGlobalScale: scale => set({ globalScale: scale }),

  reset: () => set({ matrices: [], globalScale: 1 }),
}));

interface MatrixCalculationsState {
  determinant: number;
  combinedMatrix: Matrix3D;
}

export const useMatrixCalculations = create<MatrixCalculationsState>(set => {
  // Calculate the values based on the current matrix store
  const calculateValues = () => {
    const matrices = useMatrixStore.getState().matrices;
    const globalScale = useMatrixStore.getState().globalScale;
    let combinedMatrix = createIdentityMatrix();

    matrices.forEach(matrix => {
      const matrix3D = createMatrix(matrix);
      combinedMatrix = multiplyMatrices(combinedMatrix, matrix3D);
    });

    combinedMatrix = applyTransformationFactor(combinedMatrix, globalScale);

    const det = calculateDeterminant(combinedMatrix);

    return { combinedMatrix, determinant: det };
  };

  // Initial values
  const initialValues = calculateValues();

  // Set up subscription to matrix store
  useMatrixStore.subscribe(() => {
    // Recalculate and update values when matrices change
    const newValues = calculateValues();
    set(newValues);
  });

  return {
    ...initialValues,
  };
});
