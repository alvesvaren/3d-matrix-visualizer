import { useCombinedMatrix, useDeterminant, useMatrixContext } from "../store/hooks";
import { MatrixTransform, MatrixType } from "../types";
import { getDefaultValues, getValueLabels, matrixTypes } from "../utils/matrixUtils";
import MatrixControl, { MatrixGrid } from "./MatrixControl";
import { Button } from "./ui/Button";
import { Slider } from "./ui/Slider";

const ids = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const Sidebar = () => {
  const { matrices, globalScale, addMatrix, removeMatrix, updateMatrix, setGlobalScale } = useMatrixContext();
  const usedIds = matrices.map(m => m.id);
  const determinant = useDeterminant();
  const combinedMatrix = useCombinedMatrix();
  const handleAddMatrix = (type: MatrixType) => {
    const newMatrix: MatrixTransform = {
      id: ids.find(id => !usedIds.includes(id)) || ids[0],
      name: matrixTypes.find((m: { type: MatrixType }) => m.type === type)?.name || "",
      type,
      factor: 1,
      values: getDefaultValues(type),
    };

    addMatrix(newMatrix);
  };

  const handleScaleChange = (values: number[]) => {
    setGlobalScale(values[0]);
  };

  return (
    <div className='h-screen bg-bg-200 p-4 overflow-y-auto max-w-96 min-w-96 flex flex-col'>
      <div className='flex-grow'>
        <h1 className='text-2xl font-bold text-primary-600 mb-4'>3D matrix transform visualizer!</h1>

        {/* Add new transformation */}
        <div className='bg-bg-100 rounded-lg p-3 mb-4 flex flex-wrap gap-2 shadow-sm'>
          {matrixTypes.map(matrixType => (
            <Button key={matrixType.type} className='flex-1' variant='primary' onClick={() => handleAddMatrix(matrixType.type)}>
              {matrixType.name}
            </Button>
          ))}
        </div>

        {/* Global scale control */}
        <div className='bg-bg-100 rounded-lg p-3 mb-4 shadow-sm'>
          <Slider
            label='Global Scale'
            value={[globalScale]}
            onValueChange={handleScaleChange}
            min={0}
            max={1}
            step={0.01}
            showValue
            valueFormat={v => `${v.toFixed(1)}x`}
          />
        </div>

        {/* List of transformations */}
        <div className='space-y-3'>
          {matrices.map(matrix => (
            <MatrixControl
              key={matrix.id}
              matrix={matrix}
              labels={getValueLabels(matrix.type)}
              onUpdate={(values, scalar) => updateMatrix(matrix.id, values, scalar)}
              onRemove={() => removeMatrix(matrix.id)}
            />
          ))}
        </div>
      </div>

      {matrices.length > 0 && (
        <Button
          variant='accent'
          fullWidth
          onClick={() => {
            matrices.forEach(m => removeMatrix(m.id));
          }}
        >
          Clear All
        </Button>
      )}
      <div className='mt-4 pt-4 border-t border-bg-300'>
        <div className='text-center mb-2 text-sm text-bg-700 flex flex-col justify-center items-center'>
          <div>
            <span className='font-semibold'>Determinant:</span> {determinant.toFixed(2)}
          </div>
          {matrices.length > 0 && (
            <div>
              <span className='font-semibold'>Formula:</span> M = <span>{matrices.map(m => m.id).join("")}</span>
            </div>
          )}
        </div>
        <MatrixGrid matrix={combinedMatrix} />
      </div>
    </div>
  );
};

export default Sidebar;
