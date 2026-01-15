import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogContext = React.createContext<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
}>({})

export function DialogTrigger({ 
  children, 
  asChild 
}: { 
  children: React.ReactNode
  asChild?: boolean 
}) {
  const { onOpenChange } = React.useContext(DialogContext)
  
  const handleClick = () => {
    onOpenChange?.(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any)
  }

  return <button onClick={handleClick}>{children}</button>
}

export function DialogContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = React.useContext(DialogContext)

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => onOpenChange?.(false)}
    >
      <div
        className={cn(
          "relative bg-card text-card-foreground rounded-2xl shadow-3d-lg border-2 border-chocolate p-4 sm:p-6 w-full max-w-lg mx-4",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-lg p-2 opacity-70 bg-chocolate/50 hover:bg-chocolate transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-kawaii focus:ring-offset-2 focus:ring-offset-burgundy"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg sm:text-xl font-bold leading-none tracking-tight text-foreground drop-shadow-text", className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export function DialogDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm sm:text-base text-muted-foreground/80", className)}
      {...props}
    >
      {children}
    </p>
  )
}
