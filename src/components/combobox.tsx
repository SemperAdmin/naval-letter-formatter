// src/components/combobox.tsx - RED theme to match your app

'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No option found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            // RED theme to match your form fields (like in image 2)
            "w-full justify-between h-11 px-4 py-2",
            "bg-red-500 border-0 rounded-lg", // Red background, no border
            "text-white font-medium", // White text
            "hover:bg-red-600 transition-colors duration-200",
            "focus:bg-red-600 focus:ring-2 focus:ring-red-300 focus:ring-opacity-50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-sm",
            className
          )}
        >
          <span className={cn(
            "truncate text-left text-white",
            !selectedOption && "text-red-100 opacity-90"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          "border border-red-200 shadow-lg",
          "bg-white rounded-lg"
        )}
        sideOffset={4}
      >
        <Command className="rounded-lg">
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            className={cn(
              "border-b border-red-100 text-gray-900",
              "focus:ring-0 focus:border-red-300"
            )}
          />
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty className="py-6 text-center text-gray-500">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? "" : currentValue;
                    onValueChange?.(newValue);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3",
                    "hover:bg-red-50 cursor-pointer",
                    "text-gray-900 font-medium",
                    "border-b border-gray-100 last:border-b-0",
                    // Highlight selected item in red theme
                    value === option.value && "bg-red-100 text-red-900"
                  )}
                >
                  <span className="truncate pr-2">{option.label}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 text-red-600 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}