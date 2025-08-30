import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CollaborativeCursors } from '../CollaborativeCursors'

describe('CollaborativeCursors', () => {
  const mockUsers = [
    {
      userId: 'user1',
      displayName: 'Alice',
      avatarColor: '#FF5733',
      cursor: { x: 100, y: 200 }
    },
    {
      userId: 'user2',
      displayName: 'Bob',
      avatarColor: '#33FF57',
      cursor: { x: 300, y: 400 }
    },
    {
      userId: 'user3',
      displayName: 'Charlie',
      avatarColor: '#3357FF',
      cursor: undefined
    }
  ]

  it('should render cursors for users with cursor positions', () => {
    const { container } = render(
      <CollaborativeCursors users={mockUsers} currentUserId="currentUser" />
    )

    const cursors = container.querySelectorAll('[data-testid^="cursor-user"]')
    expect(cursors).toHaveLength(2)
  })

  it('should not render cursor for current user', () => {
    const { container } = render(
      <CollaborativeCursors users={mockUsers} currentUserId="user1" />
    )

    const cursor1 = container.querySelector('[data-testid="cursor-user1"]')
    expect(cursor1).not.toBeInTheDocument()

    const cursor2 = container.querySelector('[data-testid="cursor-user2"]')
    expect(cursor2).toBeInTheDocument()
  })

  it('should position cursors correctly', () => {
    const { container } = render(
      <CollaborativeCursors users={mockUsers} currentUserId="currentUser" />
    )

    const cursor1 = container.querySelector('[data-testid="cursor-user1"]') as HTMLElement
    expect(cursor1.style.transform).toBe('translate(100px, 200px)')

    const cursor2 = container.querySelector('[data-testid="cursor-user2"]') as HTMLElement
    expect(cursor2.style.transform).toBe('translate(300px, 400px)')
  })

  it('should display user names on cursors', () => {
    render(<CollaborativeCursors users={mockUsers} currentUserId="currentUser" />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })

  it('should apply user avatar colors', () => {
    const { container } = render(
      <CollaborativeCursors users={mockUsers} currentUserId="currentUser" />
    )

    const cursor1 = container.querySelector('[data-testid="cursor-user1"]')
    const cursorSvg1 = cursor1?.querySelector('svg')
    expect(cursorSvg1).toHaveAttribute('fill', '#FF5733')

    const cursor2 = container.querySelector('[data-testid="cursor-user2"]')
    const cursorSvg2 = cursor2?.querySelector('svg')
    expect(cursorSvg2).toHaveAttribute('fill', '#33FF57')
  })

  it('should handle empty users array', () => {
    const { container } = render(
      <CollaborativeCursors users={[]} currentUserId="currentUser" />
    )

    const cursors = container.querySelectorAll('[data-testid^="cursor-"]')
    expect(cursors).toHaveLength(0)
  })

  it('should update cursor positions when users prop changes', () => {
    const { container, rerender } = render(
      <CollaborativeCursors users={mockUsers} currentUserId="currentUser" />
    )

    const updatedUsers = [
      ...mockUsers.slice(0, 1),
      { ...mockUsers[1], cursor: { x: 500, y: 600 } }
    ]

    rerender(<CollaborativeCursors users={updatedUsers} currentUserId="currentUser" />)

    const cursor2 = container.querySelector('[data-testid="cursor-user2"]') as HTMLElement
    expect(cursor2.style.transform).toBe('translate(500px, 600px)')
  })

  it('should show cursor labels with proper styling', () => {
    const { container } = render(
      <CollaborativeCursors users={mockUsers} currentUserId="currentUser" />
    )

    const label1 = container.querySelector('[data-testid="cursor-label-user1"]') as HTMLElement
    expect(label1.style.backgroundColor).toBe('rgb(255, 87, 51)')
    expect(label1).toHaveTextContent('Alice')
  })

  it('should handle viewport boundaries', () => {
    const { container } = render(
      <CollaborativeCursors 
        users={[
          { ...mockUsers[0], cursor: { x: -100, y: -100 } },
          { ...mockUsers[1], cursor: { x: 10000, y: 10000 } }
        ]} 
        currentUserId="currentUser"
        viewportBounds={{ minX: 0, minY: 0, maxX: 1920, maxY: 1080 }}
      />
    )

    const cursors = container.querySelectorAll('[data-testid^="cursor-"]')
    expect(cursors).toHaveLength(0)
  })

  it('should animate cursor movements', () => {
    const { container } = render(
      <CollaborativeCursors users={mockUsers} currentUserId="currentUser" />
    )

    const cursor1 = container.querySelector('[data-testid="cursor-user1"]') as HTMLElement
    expect(cursor1.style.transition).toContain('transform')
  })
})