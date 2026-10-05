import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 outline-none select-none hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none disabled:shadow-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 text-white shadow-soft hover:bg-emerald-700 hover:shadow-float",
        outline:
          "border-slate-200/80 bg-white text-slate-700 shadow-soft hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow-float dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200/80 shadow-2xs dark:bg-slate-800 dark:text-slate-100",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 hover:-translate-y-0 shadow-none active:scale-95 dark:hover:bg-slate-800 dark:text-slate-200",
        destructive:
          "bg-rose-600 text-white shadow-soft hover:bg-rose-700 hover:shadow-float focus-visible:ring-rose-500/50",
        link: "text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-700 hover:-translate-y-0 shadow-none",
      },
      size: {
        default:
          "h-9 gap-2 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1.5 rounded-lg px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 px-5 text-base has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7.5 rounded-lg in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11 rounded-xl",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
