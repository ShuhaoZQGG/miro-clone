'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  id: string
  content: string
  user_id: string
  created_at: string
  resolved: boolean
  user?: {
    email: string
    full_name?: string
  }
  replies?: Comment[]
}

interface CommentThreadProps {
  boardId: string
  elementId?: string
  position?: { x: number; y: number }
}

export function CommentThread({ boardId, elementId, position }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchComments()
    
    // Subscribe to new comments
    const channel = supabase
      .channel(`comments:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, elementId])

  const fetchComments = async () => {
    const query = supabase
      .from('comments')
      .select(`
        *,
        user:auth.users(email, raw_user_meta_data)
      `)
      .eq('board_id', boardId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (elementId) {
      query.eq('element_id', elementId)
    }

    const { data, error } = await query

    if (!error && data) {
      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from('comments')
            .select(`
              *,
              user:auth.users(email, raw_user_meta_data)
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true })

          return {
            ...comment,
            replies: replies || [],
          }
        })
      )
      setComments(commentsWithReplies)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const commentData: any = {
      board_id: boardId,
      content: newComment,
      user_id: user.id,
      parent_id: parentId || null,
    }

    if (elementId) {
      commentData.element_id = elementId
    }

    if (position && !parentId) {
      commentData.position_x = position.x
      commentData.position_y = position.y
    }

    const { error } = await supabase
      .from('comments')
      .insert(commentData)

    if (!error) {
      setNewComment('')
      fetchComments()
    }
  }

  const toggleResolved = async (commentId: string, resolved: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('comments')
      .update({
        resolved: !resolved,
        resolved_by: !resolved ? user.id : null,
        resolved_at: !resolved ? new Date().toISOString() : null,
      })
      .eq('id', commentId)

    fetchComments()
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-8' : ''} mb-4 p-4 bg-white rounded-lg shadow-sm border ${
        comment.resolved ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
              {comment.user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-sm">
                {comment.user?.full_name || comment.user?.email || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <p className={`text-gray-800 ${comment.resolved ? 'line-through' : ''}`}>
            {comment.content}
          </p>
          <div className="mt-2 flex items-center gap-4">
            {!isReply && (
              <button
                onClick={() => toggleResolved(comment.id, comment.resolved)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {comment.resolved ? '✓ Resolved' : 'Mark as resolved'}
              </button>
            )}
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                // Handle reply
              }}
            >
              Reply
            </button>
          </div>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return <div className="p-4">Loading comments...</div>
  }

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-4">Comments</h3>
        
        <form onSubmit={(e) => handleSubmit(e)} className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... Use @ to mention someone"
            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Post Comment
          </button>
        </form>

        <div className="space-y-2">
          {comments.map((comment) => renderComment(comment))}
          {comments.length === 0 && (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  )
}