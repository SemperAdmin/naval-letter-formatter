"use client"

import * as React from "react"
import { Search, ChevronDown, Check } from "lucide-react"

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
  const [searchTerm, setSearchTerm] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    onSelect(selectedValue);
    setOpen(false);
    setSearchTerm("");
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = items.find(item => item.value === value);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', flex: '1' }}>
      {/* Trigger Button - Styled to match your form-control exactly */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          // EXACT .form-control styling from your app
          flex: '1',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: '#e9ecef',
          borderRadius: '0 8px 8px 0',
          padding: '12px',
          minHeight: '48px',
          transition: 'all 0.3s ease',
          fontSize: '16px',
          fontWeight: '400',
          color: value ? '#495057' : '#6c757d',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          outline: 'none',
          width: '100%',
          
          // Layout
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          
          // Hover/focus states
          ...(open ? {
            borderColor: '#b8860b',
            boxShadow: '0 0 0 0.2rem rgba(184, 134, 11, 0.25)'
          } : {})
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#b8860b';
          e.target.style.boxShadow = '0 0 0 0.2rem rgba(184, 134, 11, 0.25)';
        }}
        onBlur={(e) => {
          if (!open) {
            e.target.style.borderColor = '#e9ecef';
            e.target.style.boxShadow = 'none';
          }
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = '#b8860b';
            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(184, 134, 11, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = '#e9ecef';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Golden Search Icon */}
          <div style={{
            background: 'linear-gradient(135deg, #b8860b, #ffd700)',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Search style={{ width: '14px', height: '14px', color: 'white' }} />
          </div>
          
          {/* Text */}
          <span style={{ 
            flex: 1, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap'
          }}>
            {selectedItem ? selectedItem.label : placeholder}
          </span>
        </div>
        
        {/* Chevron */}
        <ChevronDown style={{ 
          width: '16px', 
          height: '16px', 
          color: '#6c757d',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          zIndex: 1000,
          marginTop: '4px',
          background: 'white',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(184, 134, 11, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          maxHeight: '300px',
          overflow: 'hidden'
        }}>
          {/* Search Input */}
          <div style={{ 
            padding: '16px',
            borderBottom: '1px solid #e9ecef',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '28px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #b8860b, #ffd700)',
              borderRadius: '4px',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Search style={{ width: '10px', height: '10px', color: 'white' }} />
            </div>
            <input
              type="text"
              placeholder={inputPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 40px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8f9fa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#b8860b';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
          </div>

          {/* Results */}
          <div style={{ 
            maxHeight: '240px', 
            overflowY: 'auto',
            padding: '8px'
          }}>
            {filteredItems.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '14px'
              }}>
                <Search style={{ 
                  width: '24px', 
                  height: '24px', 
                  color: '#dee2e6',
                  margin: '0 auto 8px auto',
                  display: 'block'
                }} />
                {searchMessage}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.value}
                  onClick={() => handleSelect(item.value)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    margin: '2px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    backgroundColor: value === item.value ? 
                      'linear-gradient(90deg, #b8860b, #ffd700)' : 'transparent',
                    color: value === item.value ? 'white' : '#495057'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== item.value) {
                      e.currentTarget.style.backgroundColor = 'rgba(184, 134, 11, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== item.value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ 
                    flex: 1, 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {item.label}
                  </span>
                  
                  {value === item.value && (
                    <Check style={{ 
                      width: '16px', 
                      height: '16px',
                      color: 'white'
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}