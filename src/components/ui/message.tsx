import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const messageVariants = cva("flex w-full gap-2", {
  variants: {
    align: {
      start: "flex-row",
      end: "flex-row-reverse",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

const Message = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof messageVariants>
>(({ className, align, ...props }, ref) => (
  <div ref={ref} className={cn(messageVariants({ align }), className)} {...props} />
));
Message.displayName = "Message";

const MessageGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
));
MessageGroup.displayName = "MessageGroup";

const MessageAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-end pb-1",
      "self-end",
      className,
    )}
    {...props}
  />
));
MessageAvatar.displayName = "MessageAvatar";

const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1 min-w-0 max-w-[80%]", className)}
    {...props}
  />
));
MessageContent.displayName = "MessageContent";

const MessageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs text-muted-foreground self-start", className)}
    {...props}
  />
));
MessageHeader.displayName = "MessageHeader";

const MessageFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex gap-1 mt-1 text-xs text-muted-foreground", className)}
    {...props}
  />
));
MessageFooter.displayName = "MessageFooter";

export {
  Message,
  MessageGroup,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
  messageVariants,
};
