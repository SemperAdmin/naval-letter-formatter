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
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            border: '2px solid rgba(156, 163, 175, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease-out',
            minHeight: '48px'
          }}
          className={cn(
            "w-full justify-between px-4 py-3 text-gray-900 font-medium",
            "hover:border-amber-300 hover:shadow-md hover:bg-white",
            "focus:border-amber-400 focus:ring-4 focus:ring-amber-100",
            value && "border-amber-300 bg-white shadow-md"
          )}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgb(252 211 77)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'scale(1.01)';
          }}
          onMouseLeave={(e) => {
            if (!value) {
              e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              style={{
                background: 'linear-gradient(135deg, rgb(245 158 11), rgb(251 191 36))',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Search style={{ width: '16px', height: '16px', color: 'white' }} />
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
          <ChevronsUpDown 
            className={cn(
              "h-5 w-5 shrink-0 transition-all duration-300 text-gray-400",
              open && "rotate-180 text-amber-500"
            )} 
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(156, 163, 175, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        className="w-[var(--radix-popover-trigger-width)] p-0"
        sideOffset={8}
      >
        <Command style={{ borderRadius: '12px' }}>
          <div style={{ 
            position: 'relative', 
            borderBottom: '1px solid rgb(243 244 246)',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}>
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, rgb(245 158 11), rgb(251 191 36))',
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Search style={{ width: '12px', height: '12px', color: 'white' }} />
            </div>
            <CommandInput 
              placeholder={inputPlaceholder}
              style={{
                paddingLeft: '56px',
                paddingRight: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                height: '56px',
                border: 'none',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '12px 12px 0 0'
              }}
              className="text-gray-900 placeholder:text-gray-500 focus:ring-0"
            />
          </div>
          <CommandList style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
            <CommandEmpty style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgb(243 244 246), rgb(229 231 235))',
                  borderRadius: '16px',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  <Search style={{ width: '28px', height: '28px', color: 'rgb(156 163 175)' }} />
                </div>
                <div>
                  <p style={{ color: 'rgb(75 85 99)', fontWeight: '500', fontSize: '14px' }}>{searchMessage}</p>
                  <p style={{ color: 'rgb(156 163 175)', fontSize: '12px', marginTop: '4px' }}>Try adjusting your search terms</p>
                </div>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item, index) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => handleSelect(item.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    margin: '4px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    border: '1px solid transparent',
                    background: value === item.value 
                      ? 'linear-gradient(90deg, rgb(245 158 11), rgb(251 191 36))'
                      : 'transparent',
                    color: value === item.value ? 'white' : 'rgb(55 65 81)',
                    transform: value === item.value ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: value === item.value ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== item.value) {
                      e.currentTarget.style.background = 'linear-gradient(90deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05))';
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== item.value) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    paddingRight: '16px',
                    flex: '1',
                    lineHeight: '1.5'
                  }}>
                    {item.label}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: value === item.value 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgb(254 243 199)',
                    transition: 'all 0.2s ease'
                  }}>
                    <Check
                      style={{
                        width: '16px',
                        height: '16px',
                        transition: 'all 0.2s ease',
                        opacity: value === item.value ? '1' : '0',
                        transform: value === item.value ? 'scale(1.1)' : 'scale(0.75)',
                        color: value === item.value ? 'white' : 'rgb(245 158 11)'
                      }}
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