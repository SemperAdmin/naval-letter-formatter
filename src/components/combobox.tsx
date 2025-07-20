"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  items: {
    value: string;
    label: string;
    [key: string]: any;
  }[];
  onSelect: (value: string) => void;
  placeholder: string;
  searchMessage: string;
  inputPlaceholder: string;
}

export function Combobox({ items, onSelect, placeholder, searchMessage, inputPlaceholder }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  const handleSelect = (currentValue: string) => {
    const finalValue = currentValue === value ? "" : currentValue;
    setValue(finalValue);
    onSelect(finalValue);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-12 px-4 py-3",
            // Golden/amber theme matching your form fields
            "bg-gradient-to-r from-amber-500 to-yellow-500",
            "border-0 rounded-lg text-white font-medium shadow-sm",
            // Modern hover effects
            "hover:from-amber-600 hover:to-yellow-600",
            "hover:shadow-md hover:scale-[1.02]",
            "transition-all duration-200 ease-out",
            // Focus states
            "focus:from-amber-600 focus:to-yellow-600",
            "focus:ring-2 focus:ring-amber-300 focus:ring-opacity-50",
            // Selected state
            value && "from-amber-600 to-yellow-600 shadow-md"
          )}
        >
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-white/90" />
            <span className={cn(
              "truncate text-left font-medium",
              value ? "text-white" : "text-white/95"
            )}>
              {value
                ? items.find((item) => item.value === value)?.label
                : placeholder}
            </span>
          </div>
          <ChevronsUpDown className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            "text-white/90",
            open && "rotate-180"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          "bg-white/98 backdrop-blur-sm border border-amber-200/50",
          "rounded-lg shadow-xl shadow-amber-900/10",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        sideOffset={8}
      >
        <Command className="rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
            <CommandInput 
              placeholder={inputPlaceholder}
              className={cn(
                "pl-10 pr-4 py-3 h-12",
                "border-0 border-b border-amber-100",
                "bg-transparent text-amber-900 placeholder:text-amber-600/70",
                "focus:ring-0 focus:border-amber-400",
                "rounded-t-lg font-medium"
              )}
            />
          </div>
          <CommandList className="max-h-[280px] overflow-auto">
            <CommandEmpty className="py-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <Search className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-amber-700 font-medium">{searchMessage}</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item, index) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => handleSelect(item.value)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 mx-2 my-1",
                    "rounded-lg cursor-pointer transition-all duration-200",
                    "text-amber-800 font-medium",
                    // Modern hover effects
                    "hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50",
                    "hover:text-amber-900 hover:scale-[1.02]",
                    "hover:shadow-sm",
                    // Selected state
                    value === item.value && cn(
                      "bg-gradient-to-r from-amber-500 to-yellow-500",
                      "text-white shadow-md"
                    ),
                    // Stagger animation
                    "animate-in slide-in-from-left-1 duration-150",
                    `delay-[${Math.min(index * 25, 200)}ms]`
                  )}
                >
                  <span className="truncate pr-3 flex-1">{item.label}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-200",
                      value === item.value ? "opacity-100 scale-100" : "opacity-0 scale-75",
                      value === item.value ? "text-white" : "text-amber-600"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}