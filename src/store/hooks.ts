import { useMatrixCalculations, useMatrixStore } from "./matrixStore";

// Convenience hooks for accessing matrix store
export const useMatrices = () => useMatrixStore(state => state.matrices);
export const useGlobalScale = () => useMatrixStore(state => state.globalScale);

// Convenience hook for all matrix actions
export const useMatrixActions = () => {
  const addMatrix = useMatrixStore(state => state.addMatrix);
  const removeMatrix = useMatrixStore(state => state.removeMatrix);
  const updateMatrix = useMatrixStore(state => state.updateMatrix);
  const setGlobalScale = useMatrixStore(state => state.setGlobalScale);
  const reset = useMatrixStore(state => state.reset);

  return {
    addMatrix,
    removeMatrix,
    updateMatrix,
    setGlobalScale,
    reset,
  };
};

export const useDeterminant = () => useMatrixCalculations(state => state.determinant);
export const useCombinedMatrix = () => useMatrixCalculations(state => state.combinedMatrix);

// Hook that returns everything at once
export const useMatrixContext = () => {
  const matrices = useMatrices();
  const globalScale = useGlobalScale();
  const actions = useMatrixActions();

  return {
    matrices,
    globalScale,
    ...actions,
  };
};
