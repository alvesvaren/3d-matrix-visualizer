import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../utils/cn";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: React.ReactNode;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ 
    label, 
    showValue = false, 
    valueFormat = (v) => v.toFixed(1), 
    min = 0, 
    max = 1, 
    step = 0.01, 
    className,
    value, 
    ...props 
  }, ref) => {
    // Extract the current value for display
    const currentValue = Array.isArray(value) ? value[0] : 0;
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-secondary-700">{label}</label>
            {showValue && (
              <span className="text-sm w-12 text-right text-secondary-800">{valueFormat(currentValue)}</span>
            )}
          </div>
        )}
        <SliderPrimitive.Root
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value}
          className={cn(
            "relative flex items-center w-full h-5 touch-none select-none",
            className
          )}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-bg-300">
            <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary-600" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className="block h-4 w-4 rounded-full border border-primary-700 bg-primary-600 shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
          />
        </SliderPrimitive.Root>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider }; 