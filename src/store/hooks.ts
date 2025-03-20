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
export const useSetPref = (pref: keyof MatrixState["prefs"]) => {
  const func = useMatrixStore(state => state.setPref);
  return (state: boolean) => func(pref, state);
};

export function useCSSVariable(variable: string) {
  const [value, setValue] = useState(getComputedStyle(document.documentElement).getPropertyValue(variable));

  useEffect(() => {
    const handleChange = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(variable));
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleChange);
    return () => window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", handleChange);
  }, []);

  return value;
}

export const useViewOffset = () => {
  const [viewOffset, setViewOffset] = useState({ offsetX: 0, offsetY: 0 });
  const { width, height } = useScreenDimensions();

  useEffect(() => {
    const handleResize = () => {
      const sidebarSize = document.querySelector("#sidebar")?.clientWidth || 0;
      const isVertical = width > height;
      const offsetX = isVertical ? -sidebarSize / 2 : 0;
      const offsetY = isVertical ? 0 : -sidebarSize / 2;
      setViewOffset({ offsetX, offsetY });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width, height]);

  return viewOffset;
};

export const useScreenDimensions = () => {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return dimensions;
};
