'use client'

import { Whiteboard } from '@/components/Whiteboard'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface BoardPageProps {
  params: {
    boardId: string
  }
}

export default function BoardPage({ params }: BoardPageProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      <Suspense 
        fallback={
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading whiteboard...</p>
            </div>
          </div>
        }
      >
        <Whiteboard boardId={params.boardId} />
      </Suspense>
    </div>
  )
}