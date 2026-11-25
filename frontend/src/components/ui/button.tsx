import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg text-base font-bold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-150 outline-none active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-55 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-card hover:bg-primary-hover",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        "destructive-outline":
          "border-2 border-destructive/40 bg-card text-destructive hover:bg-destructive-soft",
        outline:
          "border-2 border-primary/30 bg-card text-accent-foreground hover:border-primary hover:bg-primary-soft",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted-foreground/15",
        ghost:
          "text-foreground hover:bg-muted",
        link: "text-primary underline underline-offset-4 hover:text-primary-hover",
      },
      size: {
        // 48px é o mínimo de toque; o "lg" (56px) é para a ação principal da tela
        default: "min-h-12 px-5 py-2",
        sm: "min-h-11 gap-1.5 px-4 text-[0.95rem] [&_svg:not([class*='size-'])]:size-[1.1rem]",
        lg: "min-h-14 px-7 text-lg [&_svg:not([class*='size-'])]:size-6",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
