"use client";

import { MessageScroller as ScrollerPrimitive } from "@shadcn/react/message-scroller";
import * as React from "react";

import { cn } from "@/lib/utils";

const MessageScrollerProvider = ScrollerPrimitive.Provider;

const MessageScroller = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ScrollerPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ScrollerPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex flex-1 flex-col overflow-hidden",
      className,
    )}
    {...props}
  />
));
MessageScroller.displayName = "MessageScroller";

const MessageScrollerViewport = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ScrollerPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ScrollerPrimitive.Viewport
    ref={ref}
    className={cn(
      "flex flex-1 flex-col overflow-y-auto",
      className,
    )}
    {...props}
  />
));
MessageScrollerViewport.displayName = "MessageScrollerViewport";

const MessageScrollerContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ScrollerPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ScrollerPrimitive.Content
    ref={ref}
    className={cn("flex flex-col gap-2 p-4", className)}
    {...props}
  />
));
MessageScrollerContent.displayName = "MessageScrollerContent";

const MessageScrollerItem = ScrollerPrimitive.Item;

const MessageScrollerButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof ScrollerPrimitive.Button>
>(({ className, ...props }, ref) => (
  <ScrollerPrimitive.Button
    ref={ref}
    className={cn(
      "absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background px-3 py-1 text-sm font-medium shadow-sm transition-opacity data-[active=false]:opacity-0 data-[active=false]:pointer-events-none",
      className,
    )}
    {...props}
  />
));
MessageScrollerButton.displayName = "MessageScrollerButton";

export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
};
