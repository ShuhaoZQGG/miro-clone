'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { TextEditingManager } from '@/lib/canvas-features/text-editing'

interface TextFormattingToolbarProps {
  textManager: TextEditingManager | null
  visible?: boolean
  className?: string
}

export const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({ 
  textManager, 
  visible = false,
  className 
}) => {
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontSize, setFontSize] = useState(16)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left')
  const [textColor, setTextColor] = useState('#000000')

  useEffect(() => {
    if (!textManager) return

    // Listen for selection changes
    const handleSelectionChange = (element: any) => {
      if (element && (element.type === 'text' || element.type === 'i-text')) {
        setSelectedElement(element)
        // Update toolbar state based on selected element
        setFontFamily(element.fontFamily || 'Arial')
        setFontSize(element.fontSize || 16)
        setIsBold(element.fontWeight === 'bold')
        setIsItalic(element.fontStyle === 'italic')
        setIsUnderline(element.underline || false)
        setTextAlign(element.textAlign || 'left')
        setTextColor(element.fill || '#000000')
      } else {
        setSelectedElement(null)
      }
    }

    // Keyboard shortcuts handler
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if (!selectedElement) return
      
      // Check for Ctrl/Cmd key
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault()
            toggleBold()
            break
          case 'i':
            event.preventDefault()
            toggleItalic()
            break
          case 'u':
            event.preventDefault()
            toggleUnderline()
            break
          case 'l':
            event.preventDefault()
            handleTextAlignChange('left')
            break
          case 'e':
            event.preventDefault()
            handleTextAlignChange('center')
            break
          case 'r':
            event.preventDefault()
            handleTextAlignChange('right')
            break
        }
      }
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyboardShortcuts)

    // You'd need to add this event to TextEditingManager
    // For now, we'll just show the toolbar when visible prop is true
    return () => {
      // Cleanup
      document.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [textManager, selectedElement, toggleBold, toggleItalic, toggleUnderline, handleTextAlignChange])

  if (!visible || !textManager) return null

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family)
    if (selectedElement) {
      textManager.updateTextProperty(selectedElement, 'fontFamily', family)
    }
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    if (selectedElement) {
      textManager.updateTextProperty(selectedElement, 'fontSize', size)
    }
  }

  const toggleBold = () => {
    const newBold = !isBold
    setIsBold(newBold)
    if (selectedElement) {
      textManager.updateTextProperty(selectedElement, 'fontWeight', newBold ? 'bold' : 'normal')
    }
  }

  const toggleItalic = () => {
    const newItalic = !isItalic
    setIsItalic(newItalic)
    if (selectedElement) {
      textManager.updateTextProperty(selectedElement, 'fontStyle', newItalic ? 'italic' : 'normal')
    }
  }

  const toggleUnderline = () => {
    const newUnderline = !isUnderline
    setIsUnderline(newUnderline)
    if (selectedElement) {
      textManager.updateTextProperty(selectedElement, 'underline', newUnderline)
    }
  }

  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    setTextAlign(align)
    if (selectedElement) {
      textManager.updateTextProperty(selectedElement, 'textAlign', align)
    }
  }

  const handleColorChange = (color: string) => {
    setTextColor(color)
    if (selectedElement) {
      textManager.updateTextProperty(selectedElement, 'fill', color)
    }
  }

  return (
    <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-2 bg-white shadow-lg rounded-lg border p-2 ${className}`}>
      {/* Font Family */}
      <select 
        value={fontFamily}
        onChange={(e) => handleFontFamilyChange(e.target.value)}
        className="px-2 py-1 text-sm border rounded"
      >
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
      </select>

      {/* Font Size */}
      <select
        value={fontSize}
        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
        className="px-2 py-1 text-sm border rounded"
      >
        <option value="12">12</option>
        <option value="14">14</option>
        <option value="16">16</option>
        <option value="18">18</option>
        <option value="20">20</option>
        <option value="24">24</option>
        <option value="28">28</option>
        <option value="32">32</option>
        <option value="36">36</option>
        <option value="48">48</option>
      </select>

      <div className="w-px h-6 bg-gray-200" />

      {/* Bold */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleBold}
        className={isBold ? 'bg-gray-200' : ''}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </Button>

      {/* Italic */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleItalic}
        className={isItalic ? 'bg-gray-200' : ''}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </Button>

      {/* Underline */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleUnderline}
        className={isUnderline ? 'bg-gray-200' : ''}
        title="Underline (Ctrl+U)"
      >
        <u>U</u>
      </Button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Text Align */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleTextAlignChange('left')}
        className={textAlign === 'left' ? 'bg-gray-200' : ''}
        title="Align Left"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h10M3 18h15" />
        </svg>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleTextAlignChange('center')}
        className={textAlign === 'center' ? 'bg-gray-200' : ''}
        title="Align Center"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M7 12h10M5 18h14" />
        </svg>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleTextAlignChange('right')}
        className={textAlign === 'right' ? 'bg-gray-200' : ''}
        title="Align Right"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M11 12h10M6 18h15" />
        </svg>
      </Button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Color Picker */}
      <input
        type="color"
        value={textColor}
        onChange={(e) => handleColorChange(e.target.value)}
        className="w-8 h-8 border rounded cursor-pointer"
        title="Text Color"
      />
    </div>
  )
}