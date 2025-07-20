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
            // Modern clean input styling
            "bg-white/95 backdrop-blur-sm",
            "border-2 border-gray-200/80 rounded-xl",
            "text-gray-900 font-medium shadow-sm",
            // Modern hover effects
            "hover:border-amber-300/60 hover:bg-white",
            "hover:shadow-md hover:scale-[1.01]",
            "transition-all duration-300 ease-out",
            // Focus states with modern amber glow
            "focus:border-amber-400 focus:ring-4 focus:ring-amber-100/50",
            "focus:bg-white focus:shadow-lg",
            // Selected state
            value && "border-amber-300 bg-white shadow-md"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm">
              <Search className="h-4 w-4 text-white" />
            </div>
            <span className={cn(
              "truncate text-left font-medium",
              value ? "text-gray-900" : "text-gray-500"
            )}>
              {value
                ? items.find((item) => item.value === value)?.label
                : placeholder}
            </span>
          </div>
          <ChevronsUpDown className={cn(
            "h-5 w-5 shrink-0 transition-all duration-300",
            "text-gray-400",
            open && "rotate-180 text-amber-500"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          "bg-white/98 backdrop-blur-xl border border-gray-200/50",
          "rounded-xl shadow-2xl shadow-gray-900/10",
          "animate-in fade-in-0 zoom-in-96 duration-300 ease-out"
        )}
        sideOffset={8}
      >
        <Command className="rounded-xl">
          <div className="relative border-b border-gray-100">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-500">
                <Search className="h-3 w-3 text-white" />
              </div>
            </div>
            <CommandInput 
              placeholder={inputPlaceholder}
              className={cn(
                "pl-14 pr-4 py-4 h-14",
                "border-0 bg-transparent",
                "text-gray-900 placeholder:text-gray-500",
                "focus:ring-0 font-medium",
                "rounded-t-xl"
              )}
            />
          </div>
          <CommandList className="max-h-[320px] overflow-auto p-2">
            <CommandEmpty className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner">
                  <Search className="h-7 w-7 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-600 font-medium text-sm">{searchMessage}</p>
                  <p className="text-gray-400 text-xs mt-1">Try adjusting your search terms</p>
                </div>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item, index) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => handleSelect(item.value)}
                  className={cn(
                    "flex items-center justify-between px-4 py-4 mx-1 my-1",
                    "rounded-lg cursor-pointer transition-all duration-200",
                    "text-gray-700 font-medium",
                    "border border-transparent",
                    // Modern hover effects
                    "hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-amber-100/50",
                    "hover:border-amber-200/50 hover:text-gray-900",
                    "hover:shadow-sm hover:scale-[1.02]",
                    // Selected state with modern styling
                    value === item.value && cn(
                      "bg-gradient-to-r from-amber-500 to-amber-600",
                      "text-white font-semibold shadow-lg border-amber-300",
                      "transform scale-[1.02]"
                    ),
                    // Stagger animation
                    "animate-in slide-in-from-left-2 duration-200",
                    `delay-[${Math.min(index * 30, 300)}ms]`
                  )}
                >
                  <span className="truncate pr-4 flex-1 leading-relaxed">
                    {item.label}
                  </span>
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200",
                    value === item.value 
                      ? "bg-white/20" 
                      : "bg-amber-100"
                  )}>
                    <Check
                      className={cn(
                        "h-4 w-4 transition-all duration-200",
                        value === item.value 
                          ? "opacity-100 scale-110 text-white" 
                          : "opacity-0 scale-75 text-amber-600"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}