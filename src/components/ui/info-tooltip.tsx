/**
 * InfoTooltip Component
 * Reusable tooltip icon for providing contextual help
 */

"use client"

import * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

interface InfoTooltipProps {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoTooltip({ content, side = "top" }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center ml-1 text-blue-600 hover:text-blue-800 transition-colors"
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              cursor: 'help',
              fontSize: '0.95rem',
              verticalAlign: 'middle',
            }}
            aria-label="More information"
          >
            <i className="fas fa-info-circle"></i>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs sm:max-w-sm md:max-w-md p-3 text-sm leading-relaxed bg-white border-2 border-blue-200 shadow-lg"
          style={{ zIndex: 9999 }}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
