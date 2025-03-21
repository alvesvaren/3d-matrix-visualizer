import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useCombinedMatrix, useDeterminant, useMatrixContext } from "../store/hooks";
import { useMatrixStore } from "../store/matrixStore";
import { MatrixTransform, MatrixType } from "../types";
import { getDefaultValues, getValueLabels, matrixTypes } from "../utils/matrixUtils";
import MatrixControl, { MatrixGrid } from "./MatrixControl";
import { Button } from "./ui/Button";
import { Checkbox } from "./ui/Checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, TriggerIcon } from "./ui/Collapsible";
import { Slider } from "./ui/Slider";

// No M because it's used in the result
const ids = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

interface SortableMatrixControlProps {
  matrix: MatrixTransform;
  labels: string[];
  onUpdate: (values: number[], scalar: number) => void;
  onRemove: () => void;
}

const SortableMatrixControl = ({ matrix, labels, onUpdate, onRemove }: SortableMatrixControlProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: matrix.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${isOver ? "mt-8 transition-spacing duration-200" : "mt-0 transition-spacing duration-200"}`}>
      <MatrixControl matrix={matrix} labels={labels} onUpdate={onUpdate} onRemove={onRemove} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
};

const Prefs = () => {
  const setPref = useMatrixStore(state => state.setPref);
  const prefs = useMatrixStore(state => state.prefs);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='mb-4'>
      <Collapsible className='group' open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger>
          <span>Visualization Settings</span>

          <TriggerIcon />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4">
          <Checkbox label='Show Original Axes' id='originalAxis' onCheckedChange={checked => setPref("originalAxis", !!checked)} defaultChecked={prefs.originalAxis} />
          <Checkbox label='Show Transformed Axes' id='transformedAxis' onCheckedChange={checked => setPref("transformedAxis", !!checked)} defaultChecked={prefs.transformedAxis} />
          <Checkbox label='Show Labels' id='labels' onCheckedChange={checked => setPref("labels", !!checked)} defaultChecked={prefs.labels} />
          <Checkbox label='Show Determinant' id='determinant' onCheckedChange={checked => setPref("determinant", !!checked)} defaultChecked={prefs.determinant} />
          <Checkbox label='Show Original Grid' id='originalGrid' onCheckedChange={checked => setPref("originalGrid", !!checked)} defaultChecked={prefs.originalGrid} />
          <Checkbox label='Show Transformed Grid' id='transformedGrid' onCheckedChange={checked => setPref("transformedGrid", !!checked)} defaultChecked={prefs.transformedGrid} />
        </CollapsibleContent>
      </Collapsible>
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
      },
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
    <div className='h-screen p-4 overflow-y-auto max-w-96 min-w-96 flex flex-col backdrop-blur-lg bg-bg-200/30 border-r border-bg-300' id='sidebar'>
      <div className='flex-grow'>
        <h1 className='text-2xl font-bold text-primary-600 mb-4'>3D matrix transform visualizer!</h1>

        {/* Add new transformation */}
        <div className='mb-4 flex flex-wrap gap-2'>
          {matrixTypes.map(matrixType => (
            <Button key={matrixType.type} className='flex-1' variant='primary' onClick={() => handleAddMatrix(matrixType.type)}>
              {matrixType.name}
            </Button>
          ))}
        </div>

        {/* Preferences section */}
        <Prefs />

        {/* Global scale control */}
        <div className='bg-bg-100 rounded-sm p-3 mb-4'>
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
          <SortableContext items={matrices.map(m => m.id)} strategy={verticalListSortingStrategy}>
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
              <div className='opacity-80' style={{ width: "100%" }}>
                {/* Override the matrix control to always be collapsed while dragging */}
                <div className='bg-bg-100 rounded-sm overflow-hidden'>
                  <div className='bg-primary-600 text-accent-50 p-2 px-3 flex justify-between items-center'>
                    <div className='flex items-center'>
                      <span className='font-bold mr-2'>{activeMatrix.id}</span>
                      <span className='text-primary-200'>{activeMatrix.name}</span>
                    </div>
                    <div className='flex items-center'>
                      <Button variant='ghost' className='p-1 hover:bg-primary-500 rounded invisible'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                      </Button>
                      <span className='ml-2'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </span>
                      <span className='ml-2 cursor-grabbing'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 8h16M4 16h16' />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {matrices.length > 0 && (
        <Button
          variant='accent'
          fullWidth
          className='mt-4'
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
              <span className='font-semibold'>Formula:</span> M ={" "}
              <span>
                {[...matrices]
                  .reverse()
                  .map(m => m.id)
                  .join("")}
              </span>
            </div>
          )}
        </div>
        <MatrixGrid matrix={combinedMatrix} />
      </div>
    </div>
  );
};

export default Sidebar;
