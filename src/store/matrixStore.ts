import { create } from "zustand";
import { applyTransformationFactor, createMatrix } from "../components/Scene";
import { Matrix3D, MatrixTransform, calculateDeterminant, createIdentityMatrix, multiplyMatrices } from "../types";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MatrixState {
  matrices: MatrixTransform[];
  globalScale: number;

  prefs: {
    originalAxis: boolean;
    transformedAxis: boolean;
    labels: boolean;
    determinant: boolean;
    originalGrid: boolean;
    transformedGrid: boolean;
  };

  // Actions
  addMatrix: (matrix: MatrixTransform) => void;
  removeMatrix: (id: string) => void;
  updateMatrix: (id: string, values: number[], factor: number) => void;
  setGlobalScale: (scale: number) => void;
  reorderMatrices: (newMatrices: MatrixTransform[]) => void;
  setPref: (pref: keyof MatrixState["prefs"], value: boolean) => void;
  reset: () => void;
}

export const useMatrixStore = create<MatrixState>()(
  persist(
    set => ({
      matrices: [],
      globalScale: 1,
      prefs: {
        originalAxis: true,
        transformedAxis: true,
        labels: false,
        determinant: true,
        originalGrid: true,
        transformedGrid: true,
      },

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

      reorderMatrices: newMatrices => set({ matrices: newMatrices }),

      setGlobalScale: scale => set({ globalScale: scale }),

      reset: () => set({ matrices: [], globalScale: 1 }),

      setPref: (pref, value) => set(state => ({ prefs: { ...state.prefs, [pref]: value } })),
    }),
    {
      name: "matrix-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

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
