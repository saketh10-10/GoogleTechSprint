import * as React from "react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

interface SelectTriggerProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children?: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

interface SelectContentProps {
  children?: React.ReactNode
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
  children?: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { value, onValueChange })
          : child
      )}
    </div>
  )
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, value, onValueChange, ...props }) => {
  return (
    <select
      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    >
      {children}
    </select>
  )
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <option value="" disabled>{placeholder}</option>
}

const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return <>{children}</>
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children, ...props }) => {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}
