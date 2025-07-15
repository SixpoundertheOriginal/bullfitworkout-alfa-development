
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-montserrat font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "btn btn-primary",
        destructive: "bg-negative text-white hover:bg-negative/90 shadow-sm",
        outline: "btn btn-outline",
        secondary: "btn btn-secondary",
        ghost: "btn btn-ghost",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:scale-105",
        "icon-circle": "rounded-full bg-gradient-to-br shadow-lg transition-all duration-300 hover:scale-105 focus:ring-offset-background",
        "nav-action": "bg-gradient-to-r from-primary to-secondary text-white font-semibold tracking-wide hover:from-primary/80 hover:to-secondary/80 shadow-lg hover:shadow-primary/25 border border-white/10",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-full",
        square: "rounded-none",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-14 rounded-md px-8 text-lg",
        icon: "h-11 w-11 p-2",
        "icon-lg": "h-16 w-16 p-4",
      },
      iconPosition: {
        left: "[&_svg]:ml-0 [&_svg]:mr-2",
        right: "[&_svg]:ml-2 [&_svg]:mr-0",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
      iconPosition: "left",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconOnly?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, iconPosition, icon, children, iconOnly = false, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const effectiveSize = iconOnly ? (size === "lg" ? "icon-lg" : "icon") : size
    const effectiveIconPosition = iconOnly ? "none" : iconPosition

    return (
      <Comp
        className={cn(
          buttonVariants({ 
            variant, 
            size: effectiveSize, 
            shape,
            iconPosition: effectiveIconPosition,
            className 
          }),
          "transition-all duration-200 ease-in-out",
          props.disabled && "btn-disabled"
        )}
        ref={ref}
        {...props}
      >
        {icon}
        {!iconOnly && children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
