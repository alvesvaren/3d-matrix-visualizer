import { useState } from "react";
import { MatrixTransform, matrixValueOffsets } from "../types";
import { getSliderProps } from "../utils/matrixUtils";
import { createMatrix } from "./Scene";

interface MatrixControlProps {
  matrix: MatrixTransform;
  index: number;
  labels: string[];
  onUpdate: (values: number[], scalar: number) => void;
  onRemove: () => void;
}

const MatrixControl = ({ matrix, index, labels, onUpdate, onRemove }: MatrixControlProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [values, setValues] = useState<number[]>(matrix.values);
  const [scalar, setScalar] = useState<number>(matrix.factor || 1);

  const handleValueChange = (index: number, newValue: number) => {
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);
    onUpdate(newValues, scalar);
  };

  const handleScalarChange = (newValue: number) => {
    setScalar(newValue);
    // Pass both values and scalar to the update function
    onUpdate(values, newValue);
  };

  // Format value for display
  const formatValue = (value: number) => {
    return value.toFixed(1).replace(/\.0$/, "");
  };

  return (
    <div className='bg-bg-100 rounded-lg shadow overflow-hidden'>
      {/* Header */}
      <div className='bg-primary-600 text-white p-3 flex justify-between items-center cursor-pointer' onClick={() => setIsExpanded(!isExpanded)}>
        <div className='flex items-center'>
          <span className='font-medium mr-2'>{index}.</span>
          <span>{matrix.name}</span>
        </div>
        <div className='flex items-center'>
          <button
            className='p-1 hover:bg-primary-500 rounded'
            onClick={e => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
          <span className='ml-2'>
            {isExpanded ? (
              <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
              </svg>
            ) : (
              <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            )}
          </span>
        </div>
      </div>

      {/* Controls */}
      {isExpanded && (
        <div className='p-3 space-y-4'>
          {/* Matrix scalar factor */}
          <div className='space-y-1 mt-2 mb-4'>
            <div className='flex justify-between items-center text-sm text-bg-700'>
              <label>Matrix Scalar: {scalar.toFixed(2)}x</label>
              <button
                onClick={() => handleScalarChange(1)}
                className='text-xs bg-primary-500 hover:bg-primary-600 text-white py-1 px-2 rounded transition-colors'
              >
                Reset
              </button>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='range'
                min={0}
                max={1}
                step={0.01}
                value={scalar}
                onChange={e => handleScalarChange(parseFloat(e.target.value))}
                className='w-full h-2 bg-bg-300 rounded-lg appearance-none cursor-pointer'
              />
            </div>
          </div>

          {/* Render controls in a grid for custom matrix */}
          {matrix.type === "custom" ? (
            <div className='grid grid-cols-4 gap-2'>
              {values.map((value, idx) => {
                const { min, max, step } = getSliderProps(matrix.type);
                return (
                  <div key={idx} className='space-y-1'>
                    <div className='flex justify-between items-center text-sm text-bg-700'>
                      <label className='text-xs'>{labels[idx]}</label>
                    </div>
                    <input
                      type='number'
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={e => handleValueChange(idx, parseFloat(e.target.value))}
                      className='w-full py-1 px-2 text-sm bg-bg-50 border border-bg-300 rounded'
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // Standard controls for other matrix types
            values.map((value, idx) => {
              const { min, max, step } = getSliderProps(matrix.type);
              const offset = matrixValueOffsets[matrix.type];
              return (
                <div key={idx} className='space-y-1'>
                  <div className='flex justify-between items-center text-sm text-bg-700'>
                    <label>{labels[idx]}</label>
                    <span className='font-mono'>{formatValue(value + offset)}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input
                      type='range'
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={e => handleValueChange(idx, parseFloat(e.target.value))}
                      className='w-full h-2 bg-bg-300 rounded-lg appearance-none cursor-pointer'
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Matrix visualization */}
          {matrix.type !== "custom" && (
            <div className='mt-3 pt-3 border-t border-bg-300'>
              <div className='text-sm text-bg-700 mb-2'>Matrix:</div>
              <div className='grid grid-cols-4 gap-1 font-mono text-sm'>
                <MatrixGrid matrixTransform={matrix} />
              </div>
            </div>
          )}

          {/* For custom matrices, no need to render since the inputs already show the matrix */}
        </div>
      )}
    </div>
  );
};

const MatrixGrid = ({ matrixTransform }: { matrixTransform: MatrixTransform }) => {
  const matrix = createMatrix(matrixTransform);
  return Array.from(matrix.elements).map((value, idx) => <MatrixCell key={idx} value={value} />);
};

// Component to display a single matrix cell value
const MatrixCell = ({ value }: { value: number }) => {
  return <div className='bg-bg-200 text-center py-1 rounded'>{value.toFixed(1).replace(/\.0$/, "")}</div>;
};

export default MatrixControl;
