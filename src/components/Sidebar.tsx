import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Popover from "@radix-ui/react-popover";
import { Plus, Settings } from "lucide-react";
import { useState } from "react";
import { useCombinedMatrix, useDeterminant, useMatrixContext } from "../store/hooks";
import { useMatrixStore } from "../store/matrixStore";
import { MatrixTransform, MatrixType } from "../types";
import { getDefaultValues, getValueLabels, matrixTypes } from "../utils/matrixUtils";
import MatrixControl, { MatrixGrid } from "./MatrixControl";
import { Button } from "./ui/Button";
import { Checkbox } from "./ui/Checkbox";
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

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button className='flex items-center justify-center text-text-950' variant='ghost'>
          <Settings size={16} />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className='bg-bg-100 p-4 rounded-md shadow-md border border-bg-300 w-64 z-50'>
          <h3 className='font-semibold mb-3 text-text-950'>Visualization Settings</h3>
          <div className='space-y-2'>
            <Checkbox
              label='Show Original Axes'
              id='originalAxis'
              onCheckedChange={checked => setPref("originalAxis", !!checked)}
              defaultChecked={prefs.originalAxis}
            />
            <Checkbox
              label='Show Transformed Axes'
              id='transformedAxis'
              onCheckedChange={checked => setPref("transformedAxis", !!checked)}
              defaultChecked={prefs.transformedAxis}
            />
            <Checkbox label='Show Labels' id='labels' onCheckedChange={checked => setPref("labels", !!checked)} defaultChecked={prefs.labels} />
            <Checkbox
              label='Show Determinant'
              id='determinant'
              onCheckedChange={checked => setPref("determinant", !!checked)}
              defaultChecked={prefs.determinant}
            />
            <Checkbox
              label='Show Original Grid'
              id='originalGrid'
              onCheckedChange={checked => setPref("originalGrid", !!checked)}
              defaultChecked={prefs.originalGrid}
            />
            <Checkbox
              label='Show Transformed Grid'
              id='transformedGrid'
              onCheckedChange={checked => setPref("transformedGrid", !!checked)}
              defaultChecked={prefs.transformedGrid}
            />
          </div>
          <Popover.Arrow className='fill-bg-100' />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

const AddMatrixButton = ({ onAddMatrix }: { onAddMatrix: (type: MatrixType) => void }) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button className='flex items-center justify-center' variant='primary'>
          <Plus size={16} className='mr-2' />
          <span>Add Matrix</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content collisionPadding={16} className='bg-bg-100 p-2 rounded-md shadow-md border border-bg-300 w-64 z-50'>
          <div className='flex flex-col space-y-1'>
            {matrixTypes.map(matrixType => (
              <Popover.Close asChild key={matrixType.type}>
                <Button
                  variant='secondary'
                  onClick={() => {
                    onAddMatrix(matrixType.type);
                  }}
                  className='justify-start text-left'
                >
                  <matrixType.icon size={16} className='mr-2' />
                  {matrixType.name}
                </Button>
              </Popover.Close>
            ))}
          </div>
          <Popover.Arrow className='fill-bg-100' />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

// Component interfaces
interface SidebarProps {
  isMobile?: boolean;
}

const Sidebar = ({ isMobile = false }: SidebarProps) => {
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
    <div
      className={`
        p-4 overflow-y-auto backdrop-blur-lg bg-bg-200/30
        ${isMobile ? "h-full w-full border-t border-bg-300" : "h-screen max-w-96 min-w-96 border-r border-bg-300"}
        flex flex-col
      `}
      id='sidebar'
    >
      <div className='flex-grow'>
        {/* Responsive header */}
        <h1 className={`font-bold text-primary-600 mb-4 ${isMobile ? "text-xl" : "text-2xl"}`}>3D matrix transform visualizer!</h1>

        {/* Add matrix and settings buttons */}
        <div className='mb-4 flex justify-between gap-2'>
          <div className='flex gap-2'>
            <AddMatrixButton onAddMatrix={handleAddMatrix} />
            {matrices.length > 0 && (
              <Button
                variant='secondary'
                onClick={() => {
                  matrices.forEach(m => removeMatrix(m.id));
                }}
              >
                Clear All
              </Button>
            )}
          </div>
          <Prefs />
        </div>

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

      {/* Bottom section with actions and matrix display */}
      <div className='flex flex-col'>
        <div className='mt-2 pt-4 border-t border-bg-300'>
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
    </div>
  );
};

export default Sidebar;
