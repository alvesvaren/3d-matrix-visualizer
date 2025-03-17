import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const buttonVariants = cva(
  "rounded transition-colors font-medium inline-flex items-center justify-center cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 hover:bg-primary-700 text-primary-50",
        accent: "bg-accent-600 hover:bg-accent-700 text-primary-50",
        secondary: "bg-secondary-600 hover:bg-secondary-700 text-primary-50",
        outline: "border border-bg-300 bg-transparent hover:bg-bg-100 text-secondary-800",
        ghost: "bg-transparent hover:bg-bg-100 text-inherit",
      },
      size: {
        sm: "py-1 px-3 text-sm",
        md: "py-2 px-4 text-base",
        lg: "py-3 px-6 text-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants }; 