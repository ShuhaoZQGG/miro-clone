'use client'

import React from 'react'
import { Button } from './ui/Button'
import { Tooltip } from './ui/Tooltip'
import { GridIcon } from './ui/Icons'
import { clsx } from 'clsx'

interface GridSettingsProps {
  isOpen: boolean
  onClose: () => void
  gridEnabled: boolean
  gridSize: number
  onGridToggle: (enabled: boolean) => void
  onGridSizeChange: (size: number) => void
  className?: string
}

const GRID_SIZES = [10, 20, 30, 40, 50]

export const GridSettings: React.FC<GridSettingsProps> = ({
  isOpen,
  onClose,
  gridEnabled,
  gridSize,
  onGridToggle,
  onGridSizeChange,
  className
}) => {
  if (!isOpen) return null

  return (
    <div
      className={clsx(
        'absolute top-16 right-4 z-50',
        'bg-white rounded-lg shadow-xl border',
        'p-4 w-72',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GridIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Grid Settings</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close grid settings"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Grid Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="grid-enabled" className="text-sm font-medium text-gray-700">
            Show Grid
          </label>
          <button
            id="grid-enabled"
            role="switch"
            aria-checked={gridEnabled}
            onClick={() => onGridToggle(!gridEnabled)}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              gridEnabled ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                gridEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Snap to Grid */}
        <div className="flex items-center justify-between">
          <label htmlFor="snap-to-grid" className="text-sm font-medium text-gray-700">
            Snap to Grid
          </label>
          <button
            id="snap-to-grid"
            role="switch"
            aria-checked={gridEnabled}
            onClick={() => onGridToggle(!gridEnabled)}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              gridEnabled ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                gridEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Grid Size */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Grid Size: {gridSize}px
          </label>
          <div className="flex gap-2">
            {GRID_SIZES.map(size => (
              <Tooltip key={size} content={`${size}px grid`}>
                <button
                  onClick={() => onGridSizeChange(size)}
                  className={clsx(
                    'px-3 py-1 rounded text-sm font-medium transition-colors',
                    gridSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                  aria-label={`Set grid size to ${size} pixels`}
                >
                  {size}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Grid Color */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Grid Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              defaultValue="#E5E7EB"
              className="w-8 h-8 rounded border border-gray-300"
              aria-label="Grid color picker"
            />
            <span className="text-sm text-gray-600">#E5E7EB</span>
          </div>
        </div>

        {/* Grid Opacity */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Grid Opacity: 40%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            defaultValue="40"
            className="w-full"
            aria-label="Grid opacity slider"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onGridToggle(false)
              onClose()
            }}
            className="flex-1"
          >
            Hide Grid
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onGridToggle(true)
              onClose()
            }}
            className="flex-1"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}