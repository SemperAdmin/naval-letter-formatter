"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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
            "w-full justify-between h-11 px-4 py-2",
            // Red styling to match your btn btn-danger theme
            "bg-gradient-to-r from-red-500 to-red-600",
            "border-0 rounded-lg text-white font-medium",
            "hover:from-red-600 hover:to-red-700",
            "focus:from-red-600 focus:to-red-700 focus:ring-2 focus:ring-red-300 focus:ring-opacity-50",
            "transition-all duration-200 shadow-sm"
          )}
        >
          <span className={cn(
            "truncate text-left",
            value ? "text-white" : "text-red-100"
          )}>
            {value
              ? items.find((item) => item.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(
        "w-[--radix-popover-trigger-width] p-0",
        "border border-red-200 shadow-lg bg-white rounded-lg"
      )}>
        <Command filter={(value, search) => {
          // The `value` is the `label` from the `CommandItem`
          // The `search` is the user's input
          if (value.toLowerCase().includes(search.toLowerCase())) return 1
          return 0
        }}>
          <CommandInput 
            placeholder={inputPlaceholder}
            className="border-b border-red-100 focus:ring-0 focus:border-red-300"
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-gray-500">
              {searchMessage}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Pass the full label for searching
                  onSelect={() => handleSelect(item.value)}
                  className={cn(
                    "flex items-center px-4 py-3 cursor-pointer",
                    "hover:bg-red-50 text-gray-900 font-medium",
                    "border-b border-gray-100 last:border-b-0",
                    value === item.value && "bg-red-100 text-red-900"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-red-600",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}