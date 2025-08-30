'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface TestResult {
  id: string
  file: string
  name: string
  status: 'passed' | 'failed' | 'running' | 'pending'
  error?: string
  duration?: number
  timestamp: number
}

interface TestStats {
  passed: number
  failed: number
  running: number
  pending: number
  total: number
}

export function TestDashboard() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [stats, setStats] = useState<TestStats>({
    passed: 0,
    failed: 0,
    running: 0,
    pending: 0,
    total: 0
  })

  // Poll for test results from Jest reporter file
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for development mode
    if (process.env.NODE_ENV !== 'development') return

    // Poll for test dashboard file updates
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/test-results')
        if (response.ok) {
          const data = await response.json()
          
          // Update stats from Jest reporter
          setStats({
            passed: data.passed || 0,
            failed: data.failed || 0,
            running: data.running || 0,
            pending: 0,
            total: (data.passed || 0) + (data.failed || 0) + (data.running || 0)
          })
          
          // Update failures list
          if (data.failures && data.failures.length > 0) {
            const failures = data.failures.map((f: any, index: number) => ({
              id: `failure-${index}`,
              file: f.file,
              name: f.title,
              status: 'failed' as const,
              error: f.message,
              timestamp: Date.now()
            }))
            setTestResults(failures)
          }
        }
      } catch (error) {
        // Silently fail if API not available
      }
    }, 1000) // Poll every second

    return () => clearInterval(pollInterval)
  }, [])

  // Legacy event listener for backward compatibility
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleTestUpdate = (event: CustomEvent) => {
      const result = event.detail as TestResult
      setTestResults(prev => {
        const existing = prev.findIndex(r => r.id === result.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = result
          return updated
        }
        return [...prev, result]
      })
    }

    window.addEventListener('test:result' as any, handleTestUpdate)
    return () => window.removeEventListener('test:result' as any, handleTestUpdate)
  }, [])

  // Calculate stats
  useEffect(() => {
    const newStats = testResults.reduce((acc, result) => {
      acc[result.status]++
      acc.total++
      return acc
    }, {
      passed: 0,
      failed: 0,
      running: 0,
      pending: 0,
      total: 0
    } as TestStats)
    
    setStats(newStats)
  }, [testResults])

  const toggleDashboard = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])

  const clearResults = useCallback(() => {
    setTestResults([])
  }, [])

  const runTests = useCallback(() => {
    // Trigger test run (in production, this would start actual test runner)
    console.log('Starting test run...')
    // Emit event to trigger test runner
    window.dispatchEvent(new CustomEvent('test:run'))
  }, [])

  const stopTests = useCallback(() => {
    // Stop test run
    console.log('Stopping test run...')
    window.dispatchEvent(new CustomEvent('test:stop'))
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Keyboard shortcut to toggle dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        toggleDashboard()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleDashboard])

  if (!isOpen) {
    return (
      <button
        onClick={toggleDashboard}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 rounded text-xs font-mono hover:bg-gray-700 transition-colors"
        title="Open Test Dashboard (Ctrl+Shift+T)"
      >
        Tests
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-gray-100 font-mono text-xs transition-all duration-300 ${
        isCollapsed ? 'h-10' : 'h-64'
      }`}
      style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.3)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <span className="font-bold">Test Runner</span>
          <div className="flex items-center gap-2">
            <button
              onClick={runTests}
              className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
              disabled={stats.running > 0}
            >
              Run
            </button>
            <button
              onClick={stopTests}
              className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
              disabled={stats.running === 0}
            >
              Stop
            </button>
            <button
              onClick={clearResults}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="text-green-400">✓ {stats.passed} Passed</span>
            <span className="text-red-400">✗ {stats.failed} Failed</span>
            {stats.running > 0 && (
              <span className="text-yellow-400">⚡ {stats.running} Running</span>
            )}
            {stats.pending > 0 && (
              <span className="text-gray-400">◯ {stats.pending} Pending</span>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCollapse}
              className="hover:text-white"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? '▲' : '▼'}
            </button>
            <button
              onClick={toggleDashboard}
              className="hover:text-white"
              title="Close (Ctrl+Shift+T)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {!isCollapsed && (
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 2.5rem)' }}>
          {testResults.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No test results yet. Click "Run" to start tests.
            </div>
          ) : (
            <div className="p-2">
              {testResults
                .filter(r => r.status === 'failed')
                .map(result => (
                  <div
                    key={result.id}
                    className="mb-2 p-2 bg-red-900/20 border border-red-700/50 rounded"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400">✗</span>
                          <span className="text-gray-300">{result.file}</span>
                        </div>
                        <div className="ml-4 mt-1">
                          <div className="text-gray-400">{result.name}</div>
                          {result.error && (
                            <div className="mt-1 text-red-300 text-xs whitespace-pre-wrap">
                              {result.error}
                            </div>
                          )}
                        </div>
                      </div>
                      {result.duration && (
                        <span className="text-gray-500">{result.duration}ms</span>
                      )}
                    </div>
                  </div>
                ))}
              
              {testResults
                .filter(r => r.status === 'running')
                .map(result => (
                  <div
                    key={result.id}
                    className="mb-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 animate-spin">⚡</span>
                      <span className="text-gray-300">{result.file}</span>
                      <span className="text-gray-400">- {result.name}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}