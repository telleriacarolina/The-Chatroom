import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-chocolate/50 border-2 border-chocolate", className)}
      {...props}
    />
  )
}

export { Skeleton }
