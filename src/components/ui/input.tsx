import * as React from "react"

import { DateOfBirthPicker } from "@/components/profile/DateOfBirthPicker"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const isDobInput = type === "date" && (props.id === "dob" || props.name === "dob")

    if (isDobInput) {
      const value = typeof props.value === "string" ? props.value : ""
      return (
        <div className={className}>
          <input
            ref={ref}
            type="hidden"
            id={props.id}
            name={props.name}
            value={value}
            readOnly
            aria-hidden="true"
            tabIndex={-1}
          />
          <DateOfBirthPicker
            id={props.id ? `${props.id}-picker` : "dob-picker"}
            value={value}
            disabled={props.disabled}
            onChange={(nextValue) => {
              props.onChange?.({
                target: { value: nextValue, name: props.name },
                currentTarget: { value: nextValue, name: props.name },
              } as React.ChangeEvent<HTMLInputElement>)
            }}
          />
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
        value={props.value ?? ""}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
