'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, Merge } from 'lucide-react'
import { Button } from './ui/Button'

interface ConflictData {
  id: string
  elementId: string
  yourVersion: any
  theirVersion: any
  timestamp: Date
  userId: string
  userName?: string
}

interface ConflictResolutionProps {
  conflicts: ConflictData[]
  onResolve: (conflictId: string, resolution: 'yours' | 'theirs' | 'merge') => void
  onDismiss: (conflictId: string) => void
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  conflicts,
  onResolve,
  onDismiss
}) => {
  const [activeConflict, setActiveConflict] = useState<ConflictData | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedResolution, setSelectedResolution] = useState<'yours' | 'theirs' | 'merge' | null>(null)

  useEffect(() => {
    if (conflicts.length > 0 && !activeConflict) {
      setActiveConflict(conflicts[0])
      setShowModal(true)
    }
  }, [conflicts, activeConflict])

  const handleResolve = () => {
    if (activeConflict && selectedResolution) {
      onResolve(activeConflict.id, selectedResolution)
      
      // Move to next conflict
      const nextConflict = conflicts.find(c => c.id !== activeConflict.id)
      if (nextConflict) {
        setActiveConflict(nextConflict)
        setSelectedResolution(null)
      } else {
        setActiveConflict(null)
        setShowModal(false)
      }
    }
  }

  const handleDismiss = () => {
    if (activeConflict) {
      onDismiss(activeConflict.id)
      setActiveConflict(null)
      setShowModal(false)
    }
  }

  const renderPreview = (data: any, label: string) => {
    return (
      <div className="flex-1 p-4 border rounded-lg">
        <h4 className="text-sm font-medium mb-2">{label}</h4>
        <div className="bg-gray-50 p-3 rounded">
          {/* Render preview based on element type */}
          {data.type === 'text' && (
            <p className="text-sm">{data.content || 'No text content'}</p>
          )}
          {data.type === 'shape' && (
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: data.fill || '#000' }}
              />
              <span className="text-sm">
                {data.shapeType} ({data.width}x{data.height})
              </span>
            </div>
          )}
          {data.position && (
            <p className="text-xs text-gray-500 mt-1">
              Position: ({Math.round(data.position.x)}, {Math.round(data.position.y)})
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Conflict Indicators on Canvas Elements */}
      <AnimatePresence>
        {conflicts.map(conflict => (
          <motion.div
            key={conflict.id}
            className="absolute pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: [1, 1.1, 1],
              transition: {
                scale: {
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }
              }
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              left: conflict.yourVersion?.position?.x || 0,
              top: conflict.yourVersion?.position?.y || 0,
            }}
          >
            <div className="bg-yellow-500 rounded-full p-1">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Conflict Resolution Modal */}
      <AnimatePresence>
        {showModal && activeConflict && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold">Merge Conflict Detected</h3>
                </div>

                {activeConflict.userName && (
                  <p className="text-sm text-gray-600 mb-4">
                    Conflict with changes from {activeConflict.userName}
                  </p>
                )}

                <div className="flex gap-4 mb-6">
                  {renderPreview(activeConflict.yourVersion, 'Your Version')}
                  {renderPreview(activeConflict.theirVersion, 'Their Version')}
                </div>

                <div className="flex gap-2 mb-4">
                  <Button
                    variant={selectedResolution === 'yours' ? 'primary' : 'outline'}
                    onClick={() => setSelectedResolution('yours')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Keep Mine
                  </Button>
                  <Button
                    variant={selectedResolution === 'theirs' ? 'primary' : 'outline'}
                    onClick={() => setSelectedResolution('theirs')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Keep Theirs
                  </Button>
                  <Button
                    variant={selectedResolution === 'merge' ? 'primary' : 'outline'}
                    onClick={() => setSelectedResolution('merge')}
                    className="flex-1"
                  >
                    <Merge className="w-4 h-4 mr-2" />
                    Merge Both
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Dismiss
                  </Button>
                  <Button
                    onClick={handleResolve}
                    disabled={!selectedResolution}
                  >
                    Apply Resolution
                  </Button>
                </div>

                {conflicts.length > 1 && (
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    {conflicts.length - 1} more conflict{conflicts.length > 2 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}