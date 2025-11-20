/**
 * CollapsibleFormSection Component
 * Collapsible wrapper for form-section styled content
 */

"use client"

import * as React from "react"

interface CollapsibleFormSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleFormSection({
  title,
  icon,
  children,
  defaultExpanded = false
}: CollapsibleFormSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className="form-section">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="section-legend cursor-pointer hover:opacity-90 transition-opacity w-full flex items-center justify-between border-0 bg-transparent"
        aria-expanded={isExpanded}
        style={{ padding: '8px 16px' }}
      >
        <div className="flex items-center">
          {icon && <i className={icon} style={{ marginRight: '8px' }}></i>}
          <span>{title}</span>
        </div>
        <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} transition-transform ml-2`}></i>
      </button>

      {isExpanded && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
