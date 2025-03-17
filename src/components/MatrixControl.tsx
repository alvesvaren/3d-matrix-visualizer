import { useState } from "react";
import { Matrix3D, MatrixTransform, matrixValueOffsets } from "../types";
import { getSliderProps } from "../utils/matrixUtils";
import { createMatrix } from "./Scene";
import { Slider } from "./ui/Slider";
import { Button } from "./ui/Button";

interface MatrixControlProps {
  matrix: MatrixTransform;
  labels: string[];
  onUpdate: (values: number[], scalar: number) => void;
  onRemove: () => void;
}

const MatrixControl = ({ matrix, labels, onUpdate, onRemove }: MatrixControlProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [values, setValues] = useState<number[]>(matrix.values);
  const [scalar, setScalar] = useState<number>(matrix.factor || 1);

  const handleValueChange = (index: number, newValue: number) => {
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);
    onUpdate(newValues, scalar);
  };

  const handleScalarChange = (newValue: number[]) => {
    setScalar(newValue[0]);
    // Pass both values and scalar to the update function
    onUpdate(values, newValue[0]);
  };

  // Format value for display
  const formatValue = (value: number) => {
    return value.toFixed(1).replace(/\.0$/, "");
  };

  return (
    <div className='bg-bg-100 rounded-lg overflow-hidden'>
      {/* Header */}
      <div className='bg-primary-600 text-accent-50 p-3 flex justify-between items-center cursor-pointer' onClick={() => setIsExpanded(!isExpanded)}>
        <div className='flex items-center'>
          <span className='font-bold mr-2'>{matrix.id}</span>
          <span className="text-primary-200">{matrix.name}</span>
        </div>
        <div className='flex items-center'>
          <Button
            variant='ghost'
            className='p-1 hover:bg-primary-500 rounded'
            onClick={e => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </Button>
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
          {/* Drag handle icon */}
          <span className='ml-2 cursor-grab' title="Drag to reorder" onClick={e => e.stopPropagation()}>
            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 8h16M4 16h16' />
            </svg>
          </span>
        </div>
      </div>

      {/* Controls */}
      {isExpanded && (
        <div className='p-3 space-y-4'>
          <div className='space-y-1 mt-2 mb-4'>
            <Slider label='Contribution' showValue value={[scalar]} onValueChange={handleScalarChange} min={0} max={1} />
          </div>

          {/* Render controls in a grid for custom matrix */}
          {matrix.type === "custom" ? (
            <div className='grid grid-cols-4 gap-2'>
              {values.map((value, idx) => {
                const { min, max, step } = getSliderProps(matrix.type);
                return (
                  <div key={idx} className='space-y-1'>
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
                  <div className='flex items-center gap-2'>
                    <Slider
                      label={labels[idx]}
                      showValue
                      valueFormat={value => formatValue(value + offset)}
                      value={[value]}
                      onValueChange={e => handleValueChange(idx, e[0])}
                      min={min}
                      max={max}
                      step={step}
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
              <MatrixGrid matrix={createMatrix(matrix)} />
            </div>
          )}

          {/* For custom matrices, no need to render since the inputs already show the matrix */}
        </div>
      )}
    </div>
  );
};

export const MatrixGrid = ({ matrix }: { matrix: Matrix3D }) => {
  const cells = Array.from(matrix.elements).map((value, idx) => <MatrixCell key={idx} value={value} />);
  return <div className='grid grid-cols-4 gap-1 font-mono text-sm'>{cells}</div>;
};

// Component to display a single matrix cell value
const MatrixCell = ({ value }: { value: number }) => {
  const [int, frac] = value.toFixed(2).split(".");
  return (
    <div className='bg-bg-200 text-bg-500 text-center py-1 rounded'>
      <span className='text-bg-700 font-bold'>{int}</span>
      {frac !== "00" && `.${frac}`}
    </div>
  );
};

export default MatrixControl;
