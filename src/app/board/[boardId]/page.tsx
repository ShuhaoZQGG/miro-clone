import { Whiteboard } from '@/components/Whiteboard'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface BoardPageProps {
  params: Promise<{
    boardId: string
  }>
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params
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
        <Whiteboard boardId={boardId} />
      </Suspense>
    </div>
  )
}