'use client'

import React, { useState, useEffect } from 'react'
import { TemplateManager, Template, TemplateCategory } from '@/lib/canvas-features/templates'
import { X, Grid, FileText, Map, Layout, Plus, Download, Upload, Search } from 'lucide-react'
import { clsx } from 'clsx'

interface TemplateGalleryProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: Template) => void
  onCreateTemplate?: (name: string, description?: string, category?: TemplateCategory) => void
  currentBoardElements?: any[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  [TemplateCategory.FLOWCHART]: <Grid className="w-5 h-5" />,
  [TemplateCategory.WIREFRAME]: <Layout className="w-5 h-5" />,
  [TemplateCategory.KANBAN]: <FileText className="w-5 h-5" />,
  [TemplateCategory.MINDMAP]: <Map className="w-5 h-5" />,
  [TemplateCategory.DIAGRAM]: <Grid className="w-5 h-5" />,
  [TemplateCategory.PRESENTATION]: <FileText className="w-5 h-5" />,
  [TemplateCategory.CUSTOM]: <Plus className="w-5 h-5" />
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateTemplate,
  currentBoardElements
}) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newTemplateCategory, setNewTemplateCategory] = useState<TemplateCategory>(TemplateCategory.CUSTOM)
  const templateManager = new TemplateManager()

  useEffect(() => {
    // Load all templates
    const allTemplates: Template[] = []
    
    // Add built-in templates
    allTemplates.push(...templateManager.getBuiltInTemplates())
    
    // Add custom templates from localStorage
    const customTemplates = templateManager.getCustomTemplates()
    allTemplates.push(...customTemplates)
    
    setTemplates(allTemplates)
  }, [])

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleCreateTemplate = () => {
    if (!newTemplateName || !currentBoardElements) return
    
    const newTemplate = templateManager.createCustomTemplate(
      currentBoardElements,
      newTemplateName,
      newTemplateDescription || undefined,
      newTemplateCategory
    )
    
    // Save to localStorage
    templateManager.saveCustomTemplate(newTemplate)
    
    // Update local state
    setTemplates([...templates, newTemplate])
    
    // Reset form
    setNewTemplateName('')
    setNewTemplateDescription('')
    setNewTemplateCategory(TemplateCategory.CUSTOM)
    setShowCreateDialog(false)
    
    if (onCreateTemplate) {
      onCreateTemplate(newTemplateName, newTemplateDescription, newTemplateCategory)
    }
  }

  const handleExportTemplate = (template: Template) => {
    const exported = templateManager.exportTemplate(template.id)
    const blob = new Blob([exported], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = templateManager.importTemplate(e.target?.result as string)
        templateManager.saveCustomTemplate(imported)
        setTemplates([...templates, imported])
      } catch (error) {
        console.error('Failed to import template:', error)
      }
    }
    reader.readAsText(file)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Templates</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={clsx(
                  'px-3 py-1 rounded-lg transition-colors',
                  selectedCategory === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                )}
              >
                All
              </button>
              {Object.keys(categoryIcons).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category as TemplateCategory)}
                  className={clsx(
                    'px-3 py-1 rounded-lg transition-colors capitalize',
                    selectedCategory === category 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  )}
                >
                  {category.replace('-', ' ')}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {currentBoardElements && (
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save as Template
                </button>
              )}
              <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplate}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No templates found
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {categoryIcons[template.category]}
                      <h3 className="font-semibold">{template.name}</h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportTemplate(template)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    {template.elements.length} elements
                  </div>
                  {template.preview && (
                    <div className="mt-2 h-32 bg-gray-100 rounded flex items-center justify-center">
                      <img 
                        src={template.preview} 
                        alt={template.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Template Dialog */}
        {showCreateDialog && (
          <div className="absolute inset-0 bg-white flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">Create New Template</h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter template description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value as TemplateCategory)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="custom">Custom</option>
                  <option value="flowchart">Flowchart</option>
                  <option value="wireframe">Wireframe</option>
                  <option value="kanban">Kanban</option>
                  <option value="mindMap">Mind Map</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplateName}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}