import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const markerVariants = cva("flex items-center gap-2 text-sm", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      border: "text-muted-foreground border-b border-border pb-2",
      separator:
        "text-muted-foreground before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border before:content-[''] after:content-['']",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const Marker = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof markerVariants> & { render?: React.ReactElement }
>(({ className, variant, render, children, ...props }, ref) => {
  if (render) {
    const Comp = render.type as React.ElementType;
    const compProps = render.props as Record<string, unknown>;
    return (
      <Comp
        {...compProps}
        className={cn(markerVariants({ variant }), className)}
      >
        {children}
      </Comp>
    );
  }
  return (
    <div
      ref={ref}
      className={cn(markerVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
});
Marker.displayName = "Marker";

const MarkerIcon = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-hidden="true"
    className={cn("shrink-0", className)}
    {...props}
  />
));
MarkerIcon.displayName = "MarkerIcon";

const MarkerContent = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn("flex-1", className)} {...props} />
));
MarkerContent.displayName = "MarkerContent";

export { Marker, MarkerIcon, MarkerContent, markerVariants };
