import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

export interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  className?: string
  children?: React.ReactNode
  [key: string]: any
}

export function RadioGroup({
  value,
  onValueChange,
  defaultValue,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const currentValue = value !== undefined ? value : internalValue

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <RadioGroupContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("grid gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export interface RadioGroupItemProps {
  value: string
  className?: string
  id?: string
  [key: string]: any
}

export function RadioGroupItem({
  value,
  className,
  id,
  ...props
}: RadioGroupItemProps) {
  const { value: groupValue, onValueChange } = React.useContext(RadioGroupContext)
  const isChecked = groupValue === value

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      onClick={() => onValueChange?.(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {isChecked && (
        <Circle className="h-2.5 w-2.5 fill-current text-current m-auto" />
      )}
    </button>
  )
}
