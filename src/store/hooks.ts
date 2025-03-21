import { useEffect, useState } from "react";
import { MatrixState, useMatrixCalculations, useMatrixStore } from "./matrixStore";

// Convenience hooks for accessing matrix store
export const useMatrices = () => useMatrixStore(state => state.matrices);
export const useGlobalScale = () => useMatrixStore(state => state.globalScale);

// Convenience hook for all matrix actions
export const useMatrixActions = () => {
  const addMatrix = useMatrixStore(state => state.addMatrix);
  const removeMatrix = useMatrixStore(state => state.removeMatrix);
  const updateMatrix = useMatrixStore(state => state.updateMatrix);
  const setGlobalScale = useMatrixStore(state => state.setGlobalScale);
  const reorderMatrices = useMatrixStore(state => state.reorderMatrices);
  const reset = useMatrixStore(state => state.reset);

  return {
    addMatrix,
    removeMatrix,
    updateMatrix,
    setGlobalScale,
    reorderMatrices,
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

export const usePref = (pref: keyof MatrixState["prefs"]) => useMatrixStore(state => state.prefs[pref]);

export function useCSSVariable(variable: string) {
  const [value, setValue] = useState(getComputedStyle(document.documentElement).getPropertyValue(variable));

  useEffect(() => {
    const handleChange = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(variable));
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleChange);
    return () => window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", handleChange);
  }, []);

  return value;
}

export const useViewOffset = (isMobile: boolean) => {
  const [viewOffset, setViewOffset] = useState({ offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const handleResize = () => {
      const sidebarElement = document.querySelector("#sidebar-container");
      if (sidebarElement) {
        const sidebarWidth = sidebarElement.clientWidth || 0;
        const sidebarHeight = sidebarElement.clientHeight || 0;

        if (!isMobile) {
          setViewOffset({ offsetX: -sidebarWidth / 2, offsetY: 0 });
        } else {
          setViewOffset({ offsetX: 0, offsetY: sidebarHeight / 2 });
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  return viewOffset;
};
