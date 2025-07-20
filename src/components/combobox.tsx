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
          className="w-full justify-between"
          style={{
            // Override Bootstrap .form-control styling
            background: '#ffffff',
            border: '2px solid #e9ecef',
            borderRadius: '0 8px 8px 0',
            padding: '12px',
            minHeight: '48px',
            transition: 'all 0.3s ease',
            fontSize: '16px',
            fontWeight: '400',
            color: '#495057',
            boxShadow: 'none',
            // Modern enhancements
            backdropFilter: 'blur(4px)',
            position: 'relative',
            zIndex: '1'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#b8860b';
            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(184, 134, 11, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            if (!value) {
              e.currentTarget.style.borderColor = '#e9ecef';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#b8860b';
            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(184, 134, 11, 0.25)';
          }}
          onBlur={(e) => {
            if (!value) {
              e.currentTarget.style.borderColor = '#e9ecef';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            {/* Modern Search Icon Badge */}
            <div 
              style={{
                background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                flexShrink: '0'
              }}
            >
              <Search style={{ width: '14px', height: '14px', color: 'white' }} />
            </div>
            
            {/* Text Content */}
            <span style={{ 
              flex: '1',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: value ? '#495057' : '#6c757d',
              fontWeight: value ? '500' : '400'
            }}>
              {value
                ? items.find((item) => item.value === value)?.label
                : placeholder}
            </span>
            
            {/* Chevron Icon */}
            <ChevronsUpDown 
              style={{
                width: '16px',
                height: '16px',
                color: '#6c757d',
                transition: 'all 0.3s ease',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: '0'
              }}
            />
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(184, 134, 11, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: '9999'
        }}
        className="w-[var(--radix-popover-trigger-width)] p-0"
        sideOffset={8}
      >
        <Command style={{ borderRadius: '12px' }}>
          {/* Search Input Header */}
          <div style={{ 
            position: 'relative', 
            borderBottom: '1px solid #e9ecef',
            padding: '0'
          }}>
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #b8860b, #ffd700)',
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '2'
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
                borderRadius: '12px 12px 0 0',
                color: '#495057'
              }}
              className="text-gray-900 placeholder:text-gray-500 focus:ring-0"
            />
          </div>
          
          {/* Results List */}
          <CommandList style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.95)'
          }}>
            <CommandEmpty style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '12px' 
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                  borderRadius: '12px',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
                }}>
                  <Search style={{ width: '20px', height: '20px', color: '#6c757d' }} />
                </div>
                <div>
                  <p style={{ 
                    color: '#495057', 
                    fontWeight: '500', 
                    fontSize: '14px',
                    margin: '0 0 4px 0'
                  }}>
                    {searchMessage}
                  </p>
                  <p style={{ 
                    color: '#6c757d', 
                    fontSize: '12px', 
                    margin: '0'
                  }}>
                    Try different search terms
                  </p>
                </div>
              </div>
            </CommandEmpty>
            
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => handleSelect(item.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    margin: '2px 0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: '1px solid transparent',
                    background: value === item.value 
                      ? 'linear-gradient(90deg, #b8860b, #ffd700)'
                      : 'transparent',
                    color: value === item.value ? 'white' : '#495057',
                    transform: value === item.value ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: value === item.value ? '0 4px 12px rgba(184, 134, 11, 0.25)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== item.value) {
                      e.currentTarget.style.background = 'linear-gradient(90deg, rgba(184, 134, 11, 0.1), rgba(255, 215, 0, 0.05))';
                      e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.01)';
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
                    lineHeight: '1.4'
                  }}>
                    {item.label}
                  </span>
                  
                  {/* Check Icon Container */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: value === item.value 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(184, 134, 11, 0.1)',
                    transition: 'all 0.2s ease',
                    flexShrink: '0'
                  }}>
                    <Check
                      style={{
                        width: '12px',
                        height: '12px',
                        transition: 'all 0.2s ease',
                        opacity: value === item.value ? '1' : '0',
                        transform: value === item.value ? 'scale(1.1)' : 'scale(0.8)',
                        color: value === item.value ? 'white' : '#b8860b'
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