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
            // Modern glassmorphism + gradient design
            "bg-gradient-to-r from-slate-900/95 to-slate-800/95",
            "backdrop-blur-sm border border-slate-700/50",
            "rounded-xl text-white font-medium",
            "shadow-lg shadow-slate-900/25",
            // Modern hover effects
            "hover:from-slate-800/95 hover:to-slate-700/95",
            "hover:border-slate-600/50 hover:shadow-xl hover:shadow-slate-900/30",
            "hover:scale-[1.02] transition-all duration-300 ease-out",
            // Focus states
            "focus:from-slate-800/95 focus:to-slate-700/95",
            "focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent",
            // Selected state
            value && "from-blue-900/95 to-slate-900/95 border-blue-500/50"
          )}
        >
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-400" />
            <span className={cn(
              "truncate text-left font-medium",
              value ? "text-white" : "text-slate-300"
            )}>
              {value
                ? items.find((item) => item.value === value)?.label
                : placeholder}
            </span>
          </div>
          <ChevronsUpDown className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            "text-slate-400",
            open && "rotate-180"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          "bg-white/95 backdrop-blur-xl border border-slate-200/50",
          "rounded-xl shadow-2xl shadow-slate-900/20",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        sideOffset={8}
      >
        <Command className="rounded-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <CommandInput 
              placeholder={inputPlaceholder}
              className={cn(
                "pl-10 pr-4 py-3 h-12",
                "border-0 border-b border-slate-100",
                "bg-transparent text-slate-900 placeholder:text-slate-500",
                "focus:ring-0 focus:border-blue-200",
                "rounded-t-xl font-medium"
              )}
            />
          </div>
          <CommandList className="max-h-[280px] overflow-auto">
            <CommandEmpty className="py-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">{searchMessage}</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item, index) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => handleSelect(item.value)}
                  className={cn(
                    "flex items-center justify-between px-4 py-4 mx-2 my-1",
                    "rounded-lg cursor-pointer transition-all duration-200",
                    "text-slate-700 font-medium",
                    // Modern hover effects
                    "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50",
                    "hover:text-blue-900 hover:scale-[1.02]",
                    "hover:shadow-md hover:shadow-blue-500/10",
                    // Selected state
                    value === item.value && cn(
                      "bg-gradient-to-r from-blue-500 to-indigo-600",
                      "text-white shadow-lg shadow-blue-500/25"
                    ),
                    // Stagger animation
                    "animate-in slide-in-from-left-1 duration-200",
                    `delay-[${index * 50}ms]`
                  )}
                >
                  <span className="truncate pr-3 flex-1">{item.label}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-200",
                      value === item.value ? "opacity-100 scale-100" : "opacity-0 scale-75",
                      value === item.value ? "text-white" : "text-blue-600"
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