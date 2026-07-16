import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const bubbleVariants = cva(
  "relative rounded-xl px-4 py-2.5 text-sm max-w-[80%] break-words",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-muted-foreground",
        tinted: "bg-primary/10 text-primary",
        outline: "border border-border bg-background",
        ghost: "bg-transparent max-w-full",
        destructive: "bg-destructive text-destructive-foreground",
      },
      align: {
        start: "self-start",
        end: "self-end",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "start",
    },
  },
);

const bubbleGroupVariants = cva("flex flex-col gap-1", {
  variants: {
    align: {
      start: "items-start",
      end: "items-end",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

const Bubble = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof bubbleVariants>
>(({ className, variant, align, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(bubbleVariants({ variant, align }), className)}
    {...props}
  />
));
Bubble.displayName = "Bubble";

const BubbleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { render?: React.ReactElement }
>(({ className, render, children, ...props }, ref) => {
  if (render) {
    const Comp = render.type as React.ElementType;
    const compProps = render.props as Record<string, unknown>;
    return (
      <Comp {...compProps} className={cn("block", className)}>
        {children}
      </Comp>
    );
  }
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  );
});
BubbleContent.displayName = "BubbleContent";

const BubbleReactions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "top" | "bottom";
    align?: "start" | "end";
  }
>(({ className, side = "bottom", align = "end", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex gap-1 -mb-2",
      side === "top" && "-mt-2 mb-0",
      align === "start" && "justify-start",
      align === "end" && "justify-end",
      className,
    )}
    {...props}
  />
));
BubbleReactions.displayName = "BubbleReactions";

const BubbleGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof bubbleGroupVariants>
>(({ className, align, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(bubbleGroupVariants({ align }), className)}
    {...props}
  />
));
BubbleGroup.displayName = "BubbleGroup";

export { Bubble, BubbleContent, BubbleReactions, BubbleGroup, bubbleVariants };
