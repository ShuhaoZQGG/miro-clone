'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Zap, Eye, Users, X } from 'lucide-react'

interface PerformanceStats {
  fps: number
  webgl: {
    drawCalls: number
    vertices: number
    triangles: number
    textureMemory: number
    fps: number
  } | null
  culling: {
    totalElements: number
    visibleElements: number
    culledElements: number
    quadTreeDepth: number
    nodesVisited: number
  } | null
  crdt: {
    localOperations: number
    remoteOperations: number
    conflicts: number
    merges: number
    pendingOperations: number
  } | null
}

interface PerformanceSettingsProps {
  canvasEngine?: any
  isOpen?: boolean
  onClose?: () => void
}

export const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({
  canvasEngine,
  isOpen = false,
  onClose
}) => {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    webgl: null,
    culling: null,
    crdt: null
  })
  
  const [settings, setSettings] = useState({
    webglEnabled: false,
    webglMode: 'auto' as 'auto' | 'performance' | 'quality',
    cullingEnabled: true,
    showStats: false
  })

  useEffect(() => {
    if (!canvasEngine) return

    const updateStats = () => {
      const newStats = canvasEngine.getPerformanceStats()
      setStats(newStats)
    }

    // Update stats every second
    const interval = setInterval(updateStats, 1000)
    updateStats()

    return () => clearInterval(interval)
  }, [canvasEngine])

  const handleWebGLToggle = () => {
    const newEnabled = !settings.webglEnabled
    setSettings(prev => ({ ...prev, webglEnabled: newEnabled }))
    canvasEngine?.setWebGLEnabled(newEnabled)
  }

  const handleWebGLModeChange = (mode: 'auto' | 'performance' | 'quality') => {
    setSettings(prev => ({ ...prev, webglMode: mode }))
    canvasEngine?.setWebGLPerformanceMode(mode)
  }

  const handleCullingToggle = () => {
    const newEnabled = !settings.cullingEnabled
    setSettings(prev => ({ ...prev, cullingEnabled: newEnabled }))
    canvasEngine?.setCullingEnabled(newEnabled)
  }

  const handleStatsToggle = () => {
    setSettings(prev => ({ ...prev, showStats: !prev.showStats }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold">Performance Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* FPS Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Current FPS</span>
              <span className={`text-2xl font-bold ${
                stats.fps >= 50 ? 'text-green-600' : 
                stats.fps >= 30 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {Math.round(stats.fps)}
              </span>
            </div>
          </div>

          {/* WebGL Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">WebGL Acceleration</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable WebGL</p>
                <p className="text-xs text-gray-500">Hardware acceleration for better performance</p>
              </div>
              <button
                onClick={handleWebGLToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.webglEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.webglEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.webglEnabled && (
              <div className="ml-8 space-y-2">
                <p className="text-sm font-medium text-gray-700">Performance Mode</p>
                <div className="flex gap-2">
                  {(['auto', 'performance', 'quality'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleWebGLModeChange(mode)}
                      className={`px-3 py-1 text-sm rounded-lg capitalize transition-colors ${
                        settings.webglMode === mode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                
                {stats.webgl && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Draw Calls:</span>
                      <span className="font-mono">{stats.webgl.drawCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vertices:</span>
                      <span className="font-mono">{stats.webgl.vertices.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Triangles:</span>
                      <span className="font-mono">{stats.webgl.triangles.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Viewport Culling */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Viewport Culling</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Culling</p>
                <p className="text-xs text-gray-500">Only render visible elements</p>
              </div>
              <button
                onClick={handleCullingToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.cullingEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.cullingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.cullingEnabled && stats.culling && (
              <div className="ml-8 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Elements:</span>
                  <span className="font-mono">{stats.culling.totalElements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visible:</span>
                  <span className="font-mono text-green-600">{stats.culling.visibleElements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Culled:</span>
                  <span className="font-mono text-orange-600">{stats.culling.culledElements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Optimization:</span>
                  <span className="font-mono">
                    {stats.culling.totalElements > 0 
                      ? `${Math.round((stats.culling.culledElements / stats.culling.totalElements) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CRDT Status */}
          {stats.crdt && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Collaboration Sync</h3>
              </div>
              
              <div className="ml-8 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Local Operations:</span>
                  <span className="font-mono">{stats.crdt.localOperations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remote Operations:</span>
                  <span className="font-mono">{stats.crdt.remoteOperations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conflicts:</span>
                  <span className="font-mono text-yellow-600">{stats.crdt.conflicts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-mono text-orange-600">{stats.crdt.pendingOperations}</span>
                </div>
              </div>
            </div>
          )}

          {/* Debug Stats Toggle */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Show Performance Overlay</p>
                <p className="text-xs text-gray-500">Display real-time stats on canvas</p>
              </div>
              <button
                onClick={handleStatsToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showStats ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showStats ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            Performance optimizations help with boards containing 100+ elements
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default PerformanceSettings