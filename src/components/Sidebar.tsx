import { useCombinedMatrix, useDeterminant, useMatrixContext } from "../store/hooks";
import { MatrixTransform, MatrixType } from "../types";
import { getDefaultValues, getValueLabels, matrixTypes } from "../utils/matrixUtils";
import MatrixControl, { MatrixGrid } from "./MatrixControl";
import { Button } from "./ui/Button";
import { Slider } from "./ui/Slider";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from "react";

// No M because it's used in the result
const ids = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

interface SortableMatrixControlProps {
  matrix: MatrixTransform;
  labels: string[];
  onUpdate: (values: number[], scalar: number) => void;
  onRemove: () => void;
}

// Sortable wrapper component for MatrixControl
const SortableMatrixControl = ({ matrix, labels, onUpdate, onRemove }: SortableMatrixControlProps) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: matrix.id
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`${isOver ? 'mt-8 transition-spacing duration-200' : 'mt-0 transition-spacing duration-200'}`}
    >
      <MatrixControl
        matrix={matrix}
        labels={labels}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    </div>
  );
};

const Sidebar = () => {
  const { matrices, globalScale, addMatrix, removeMatrix, updateMatrix, setGlobalScale, reorderMatrices } = useMatrixContext();
  const usedIds = matrices.map(m => m.id);
  const determinant = useDeterminant();
  const combinedMatrix = useCombinedMatrix();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Only start dragging after moving 8px
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const oldIndex = matrices.findIndex(m => m.id === active.id);
      const newIndex = matrices.findIndex(m => m.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder matrices in the store
        reorderMatrices(arrayMove(matrices, oldIndex, newIndex));
      }
    }
  };

  // Find the active matrix
  const activeMatrix = activeId ? matrices.find(m => m.id === activeId) : null;

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
            label='Global Contribution'
            value={[globalScale]}
            onValueChange={handleScaleChange}
            min={0}
            max={1}
            step={0.01}
            showValue
            valueFormat={v => `${v.toFixed(1)}x`}
          />
        </div>

        {/* List of transformations with drag and drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext 
            items={matrices.map(m => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-3'>
              {matrices.map(matrix => (
                <SortableMatrixControl
                  key={matrix.id}
                  matrix={matrix}
                  labels={getValueLabels(matrix.type)}
                  onUpdate={(values, scalar) => updateMatrix(matrix.id, values, scalar)}
                  onRemove={() => removeMatrix(matrix.id)}
                />
              ))}
            </div>
          </SortableContext>
          
          {/* Drag overlay to show while dragging */}
          <DragOverlay>
            {activeMatrix ? (
              <div className="opacity-80">
                <MatrixControl
                  matrix={activeMatrix}
                  labels={getValueLabels(activeMatrix.type)}
                  onUpdate={(values, scalar) => updateMatrix(activeMatrix.id, values, scalar)}
                  onRemove={() => removeMatrix(activeMatrix.id)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
