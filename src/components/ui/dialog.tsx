"use client";

import * as React from "react";
import { Dialog as DialogNamespace } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";

function DialogRoot({ ...props }: DialogNamespace.Root.Props) {
  return <DialogNamespace.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  className,
  ...props
}: DialogNamespace.Trigger.Props) {
  return (
    <DialogNamespace.Trigger
      data-slot="dialog-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

function DialogPortal({ ...props }: DialogNamespace.Portal.Props) {
  return <DialogNamespace.Portal data-slot="dialog-portal" {...props} />;
}

function DialogBackdrop({
  className,
  ...props
}: DialogNamespace.Backdrop.Props) {
  return (
    <DialogNamespace.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function DialogViewport({
  className,
  ...props
}: DialogNamespace.Viewport.Props) {
  return (
    <DialogNamespace.Viewport
      data-slot="dialog-viewport"
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  ...props
}: DialogNamespace.Popup.Props) {
  return (
    <DialogNamespace.Popup
      data-slot="dialog-popup"
      className={cn(
        "bg-card text-card-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:fade-in-0 data-open:zoom-in-95 max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-lg ring-1 ring-foreground/10 duration-100 outline-none",
        className,
      )}
      {...props}
    />
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("mb-4 flex flex-col gap-1 pr-10", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: DialogNamespace.Title.Props) {
  return (
    <DialogNamespace.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogNamespace.Description.Props) {
  return (
    <DialogNamespace.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function DialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-body" className={cn("space-y-4", className)} {...props} />
  );
}

function DialogClose({
  className,
  ...props
}: DialogNamespace.Close.Props) {
  return (
    <DialogNamespace.Close
      data-slot="dialog-close"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "absolute top-4 right-4 rounded-md opacity-70 hover:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: DialogNamespace.Popup.Props & { showClose?: boolean }) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogViewport>
        <DialogPopup className={cn("relative", className)} {...props}>
          {showClose ? (
            <DialogClose aria-label="Fechar">
              <XIcon className="size-4" />
            </DialogClose>
          ) : null}
          {children}
        </DialogPopup>
      </DialogViewport>
    </DialogPortal>
  );
}

export {
  DialogRoot as Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogViewport,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogClose,
  DialogContent,
};
