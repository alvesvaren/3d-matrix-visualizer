import React, { useState } from "react";
import { useDeterminant, useMatrixContext } from "../store/hooks";
import { MatrixTransform, MatrixType } from "../types";
import { getDefaultValues, getValueLabels, matrixTypes } from "../utils/matrixUtils";
import MatrixControl from "./MatrixControl";

const Sidebar = () => {
  const { matrices, globalScale, addMatrix, removeMatrix, updateMatrix, setGlobalScale } = useMatrixContext();
  const [selectedType, setSelectedType] = useState<MatrixType>("rotate");
  const determinant = useDeterminant();

  const handleAddMatrix = () => {
    const newMatrix: MatrixTransform = {
      id: crypto.randomUUID(),
      name: matrixTypes.find((m: { type: MatrixType }) => m.type === selectedType)?.name || "",
      type: selectedType,
      factor: 1,
      values: getDefaultValues(selectedType),
    };

    addMatrix(newMatrix);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalScale(parseFloat(e.target.value));
  };

  return (
    <div className='w-80 h-screen bg-bg-200 p-4 overflow-y-auto flex flex-col'>
      <div className='flex-grow'>
        <h1 className='text-2xl font-bold text-primary-600 mb-4'>Matrix Transformations</h1>
        <div className='mt-2 text-sm text-bg-700'>
          <span className='font-bold'>Determinant:</span> {determinant.toFixed(2)}
        </div>

        {/* Add new transformation */}
        <div className='bg-bg-100 rounded-lg p-3 mb-4 shadow-sm'>
          <div className='flex flex-col gap-2 mb-2'>
            <label className='text-sm font-medium text-secondary-700'>Transform Type</label>
            <select
              className='w-full p-2 border border-bg-300 rounded bg-bg-50 text-secondary-800'
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as MatrixType)}
            >
              {matrixTypes.map(matrixType => (
                <option key={matrixType.type} value={matrixType.type}>
                  {matrixType.name}
                </option>
              ))}
            </select>
          </div>
          <button className='w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded transition-colors' onClick={handleAddMatrix}>
            Add Transformation
          </button>
        </div>

        {/* Global scale control */}
        <div className='bg-bg-100 rounded-lg p-3 mb-4 shadow-sm'>
          <label className='block text-sm font-medium text-secondary-700 mb-1'>Global Scale</label>
          <div className='flex items-center gap-3'>
            <input type='range' min='0' max='1' step='0.01' value={globalScale} onChange={handleScaleChange} className='flex-1 accent-primary-600' />
            <span className='text-sm w-12 text-secondary-800'>{globalScale.toFixed(1)}x</span>
          </div>
        </div>

        {/* List of transformations */}
        <div className='space-y-3'>
          {matrices.map((matrix, index) => (
            <MatrixControl
              key={matrix.id}
              matrix={matrix}
              index={index}
              labels={getValueLabels(matrix.type)}
              onUpdate={(values, scalar) => updateMatrix(matrix.id, values, scalar)}
              onRemove={() => removeMatrix(matrix.id)}
            />
          ))}
        </div>
      </div>

      {matrices.length > 0 && (
        <div className='mt-4 pt-4 border-t border-bg-300'>
          <button
            className='w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors'
            onClick={() => {
              if (confirm("Are you sure you want to clear all transformations?")) {
                // Remove all matrices
                matrices.forEach(m => removeMatrix(m.id));
              }
            }}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
