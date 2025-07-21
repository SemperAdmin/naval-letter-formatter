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
          variant="naval-search"
          size="naval"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            value && "border-naval-gold bg-white/99 font-medium"
          )}
        >
          <div className="flex items-center gap-3">
            {/* Naval Search Badge */}
            <div className="naval-search-badge">
              <Search className="h-3.5 w-3.5 text-white" />
            </div>
            
            {/* Text Content */}
            <span className={cn(
              "flex-1 truncate text-left",
              value ? "text-naval-gray font-medium" : "text-naval-text-muted font-normal"
            )}>
              {value
                ? items.find((item) => item.value === value)?.label
                : placeholder}
            </span>
          </div>
          
          {/* Chevron */}
          <ChevronsUpDown className={cn(
            "h-4 w-4 shrink-0 text-naval-text-muted transition-transform duration-300",
            open && "rotate-180 text-naval-gold"
          )} />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="naval-dropdown w-[var(--radix-popover-trigger-width)]" sideOffset={8}>
        <Command className="rounded-xl">
          {/* Search Header */}
          <div className="relative border-b border-naval-gray-lighter">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <div className="naval-search-badge h-6 w-6">
                <Search className="h-3 w-3 text-white" />
              </div>
            </div>
            <CommandInput 
              placeholder={inputPlaceholder}
              className="h-14 pl-14 pr-4 border-0 bg-transparent text-naval-gray placeholder:text-naval-text-muted focus:ring-0"
            />
          </div>
          
          {/* Results */}
          <CommandList className="max-h-80 overflow-y-auto p-2">
            <CommandEmpty className="py-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner">
                  <Search className="h-5 w-5 text-naval-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-naval-gray">{searchMessage}</p>
                  <p className="text-xs text-naval-text-muted mt-1">Try different search terms</p>
                </div>
              </div>
            </CommandEmpty>
            
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => handleSelect(item.value)}
                  className="naval-command-item"
                >
                  <span className="flex-1 truncate pr-4 leading-relaxed">
                    {item.label}
                  </span>
                  
                  {/* Check Icon */}
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded transition-all duration-200",
                    value === item.value 
                      ? "bg-white/20" 
                      : "bg-naval-gold/10"
                  )}>
                    <Check className={cn(
                      "h-3 w-3 transition-all duration-200",
                      value === item.value 
                        ? "opacity-100 scale-110 text-white" 
                        : "opacity-0 scale-75 text-naval-gold"
                    )} />
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