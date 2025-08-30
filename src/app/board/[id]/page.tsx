'use client'

import { use } from 'react'
import { Whiteboard } from '@/components/Whiteboard'

type Params = Promise<{ id: string }>

export default function BoardPage({ params }: { params: Params }) {
  const resolvedParams = use(params)
  
  return (
    <div className="h-screen w-screen">
      <Whiteboard boardId={resolvedParams.id} />
    </div>
  )
}