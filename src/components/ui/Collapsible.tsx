import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as React from "react";
import { cn } from "../../utils/cn";

const Collapsible = CollapsiblePrimitive.Root;

export const TriggerIcon = () => (
  <div className='transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180'>
    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
    </svg>
  </div>
);

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={cn("flex w-full justify-between rounded-sm group-data-[state=open]:rounded-b-none items-center py-2 px-3 font-medium text-accent-50 bg-primary-600 cursor-pointer", className)}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.Trigger>
));
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content ref={ref} className={cn("overflow-hidden bg-bg-100 rounded-b-sm", className)} {...props}>
    <div className='space-y-3'>{children}</div>
  </CollapsiblePrimitive.Content>
));
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;

// Also exporting the original trigger for cases where it might be needed with simpler content

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
