import React, { useState } from "react";
import { MatrixTransform, MatrixType, SidebarProps } from "../types";
import { matrixTypes, getDefaultValues, getValueLabels } from "../utils/matrixUtils";
import MatrixControl from "./MatrixControl";

const Sidebar = ({ matrices, addMatrix, removeMatrix, updateMatrix, globalScale, setGlobalScale }: SidebarProps) => {
  const [selectedType, setSelectedType] = useState<MatrixType>("rotate");

  const handleAddMatrix = () => {
    const newMatrix: MatrixTransform = {
      id: crypto.randomUUID(),
      name: matrixTypes.find((m: { type: MatrixType }) => m.type === selectedType)?.name || "",
      type: selectedType,
      factor: 1,
      values: getDefaultValues(selectedType)
    };
    
    addMatrix(newMatrix);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalScale(parseFloat(e.target.value));
  };

  return (
    <div className="w-80 h-screen bg-bg-200 p-4 overflow-y-auto flex flex-col">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold text-primary-600 mb-4">Matrix Transformations</h1>
        
        {/* Add new transformation */}
        <div className="mb-6 bg-bg-100 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-primary-500 mb-2">Add Transformation</h2>
          
          <div className="mb-3">
            <label className="block text-primary-700 text-sm mb-1">
              Transformation Type
            </label>
            <select 
              className="w-full bg-bg-50 border border-bg-300 rounded p-2"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as MatrixType)}
            >
              {matrixTypes.map((matrix: { type: MatrixType; name: string }) => (
                <option key={matrix.type} value={matrix.type}>
                  {matrix.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-bg-600 mt-1">
              {matrixTypes.find((m: { type: MatrixType }) => m.type === selectedType)?.description}
            </p>
          </div>
          
          <button 
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded transition-colors"
            onClick={handleAddMatrix}
          >
            Add Matrix
          </button>
        </div>
        
        {/* Active transformations */}
        <div>
          <h2 className="text-lg font-semibold text-primary-500 mb-3">Active Transformations</h2>
          
          {matrices.length === 0 ? (
            <p className="text-bg-600 italic">No transformations added yet</p>
          ) : (
            <div className="space-y-4">
              {matrices.map((matrix: MatrixTransform, index: number) => (
                <MatrixControl 
                  key={matrix.id}
                  matrix={matrix}
                  index={index + 1}
                  labels={getValueLabels(matrix.type)}
                  onUpdate={(values: number[], scalar?: number) => updateMatrix(matrix.id, values, scalar)}
                  onRemove={() => removeMatrix(matrix.id)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Information */}
        <div className="mt-6 bg-bg-100 p-4 rounded-lg text-sm text-bg-700">
          <h3 className="font-medium text-primary-500 mb-1">About Transformations</h3>
          <p className="mb-2">
            Transformations are applied in order from top to bottom. 
            The order is important as matrix multiplication is not commutative.
          </p>
          <p>
            Try adding different transformations and adjusting their parameters 
            to see how they affect the 3D grid and axes.
          </p>
        </div>
      </div>
      
      {/* Global transformation intensity control */}
      <div className="mt-6 bg-bg-100 p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-1">
          <label className="font-medium text-primary-600">
            Transformation Intensity: {(globalScale * 100).toFixed(0)}%
          </label>
          <button 
            onClick={() => setGlobalScale(1)}
            className="text-xs bg-primary-500 hover:bg-primary-600 text-white py-1 px-2 rounded transition-colors"
          >
            Reset to 100%
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-bg-600">0%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={globalScale}
            onChange={handleScaleChange}
            className="flex-1 h-2 bg-bg-300 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-bg-600">100%</span>
        </div>
        <p className="text-xs text-bg-600 mt-1">
          Controls how much the transformations are applied (0% = no transform, 100% = full transform)
        </p>
      </div>
    </div>
  );
};

export default Sidebar;