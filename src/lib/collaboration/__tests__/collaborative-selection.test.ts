import { CollaborativeSelection } from '../collaborative-selection'
import { SelectionBox, UserSelection } from '../types'

describe('CollaborativeSelection', () => {
  let collaborativeSelection: CollaborativeSelection

  beforeEach(() => {
    collaborativeSelection = new CollaborativeSelection()
  })

  describe('updateUserSelection', () => {
    it('should track user selection box', () => {
      const selection: SelectionBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 150
      }

      collaborativeSelection.updateUserSelection('user-1', selection, '#FF0000')
      
      const userSelection = collaborativeSelection.getUserSelection('user-1')
      expect(userSelection).toBeDefined()
      expect(userSelection?.box).toEqual(selection)
      expect(userSelection?.color).toBe('#FF0000')
    })

    it('should update existing user selection', () => {
      const selection1: SelectionBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 150
      }

      const selection2: SelectionBox = {
        x: 150,
        y: 150,
        width: 250,
        height: 200
      }

      collaborativeSelection.updateUserSelection('user-1', selection1, '#FF0000')
      collaborativeSelection.updateUserSelection('user-1', selection2, '#FF0000')
      
      const userSelection = collaborativeSelection.getUserSelection('user-1')
      expect(userSelection?.box).toEqual(selection2)
    })

    it('should track multiple user selections', () => {
      const selection1: SelectionBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 150
      }

      const selection2: SelectionBox = {
        x: 300,
        y: 300,
        width: 100,
        height: 100
      }

      collaborativeSelection.updateUserSelection('user-1', selection1, '#FF0000')
      collaborativeSelection.updateUserSelection('user-2', selection2, '#00FF00')
      
      const allSelections = collaborativeSelection.getAllSelections()
      expect(allSelections).toHaveLength(2)
      expect(allSelections.find(s => s.userId === 'user-1')).toBeDefined()
      expect(allSelections.find(s => s.userId === 'user-2')).toBeDefined()
    })
  })

  describe('clearUserSelection', () => {
    it('should remove user selection', () => {
      const selection: SelectionBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 150
      }

      collaborativeSelection.updateUserSelection('user-1', selection, '#FF0000')
      collaborativeSelection.clearUserSelection('user-1')
      
      const userSelection = collaborativeSelection.getUserSelection('user-1')
      expect(userSelection).toBeUndefined()
    })
  })

  describe('getSelectedElements', () => {
    it('should return elements within selection box', () => {
      const selection: SelectionBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 200
      }

      const elements = [
        { id: 'elem-1', position: { x: 150, y: 150 }, size: { width: 50, height: 50 } },
        { id: 'elem-2', position: { x: 400, y: 400 }, size: { width: 50, height: 50 } },
        { id: 'elem-3', position: { x: 200, y: 200 }, size: { width: 50, height: 50 } }
      ]

      collaborativeSelection.updateUserSelection('user-1', selection, '#FF0000')
      const selectedIds = collaborativeSelection.getSelectedElements('user-1', elements)
      
      expect(selectedIds).toContain('elem-1')
      expect(selectedIds).toContain('elem-3')
      expect(selectedIds).not.toContain('elem-2')
    })

    it('should handle partial intersection', () => {
      const selection: SelectionBox = {
        x: 100,
        y: 100,
        width: 100,
        height: 100
      }

      const elements = [
        { id: 'elem-1', position: { x: 150, y: 150 }, size: { width: 100, height: 100 } }
      ]

      collaborativeSelection.updateUserSelection('user-1', selection, '#FF0000')
      const selectedIds = collaborativeSelection.getSelectedElements('user-1', elements)
      
      expect(selectedIds).toContain('elem-1')
    })
  })

  describe('renderSelectionBox', () => {
    it('should create visual representation of selection box', () => {
      const selection: SelectionBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 150
      }

      collaborativeSelection.updateUserSelection('user-1', selection, '#FF0000')
      const rendered = collaborativeSelection.renderSelectionBox('user-1', 'John Doe')
      
      expect(rendered).toBeDefined()
      expect(rendered.type).toBe('selection-box')
      expect(rendered.bounds).toEqual(selection)
      expect(rendered.color).toBe('#FF0000')
      expect(rendered.userName).toBe('John Doe')
      expect(rendered.strokeWidth).toBe(2)
      expect(rendered.strokeDashArray).toEqual([5, 5])
    })

    it('should return null for non-existent user', () => {
      const rendered = collaborativeSelection.renderSelectionBox('user-1', 'John Doe')
      expect(rendered).toBeNull()
    })
  })

  describe('detectOverlap', () => {
    it('should detect overlapping selections', () => {
      const selection1: SelectionBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 200
      }

      const selection2: SelectionBox = {
        x: 200,
        y: 200,
        width: 200,
        height: 200
      }

      collaborativeSelection.updateUserSelection('user-1', selection1, '#FF0000')
      collaborativeSelection.updateUserSelection('user-2', selection2, '#00FF00')
      
      const overlaps = collaborativeSelection.detectOverlap()
      expect(overlaps).toHaveLength(1)
      expect(overlaps[0].users).toContain('user-1')
      expect(overlaps[0].users).toContain('user-2')
    })

    it('should not detect non-overlapping selections', () => {
      const selection1: SelectionBox = {
        x: 100,
        y: 100,
        width: 100,
        height: 100
      }

      const selection2: SelectionBox = {
        x: 300,
        y: 300,
        width: 100,
        height: 100
      }

      collaborativeSelection.updateUserSelection('user-1', selection1, '#FF0000')
      collaborativeSelection.updateUserSelection('user-2', selection2, '#00FF00')
      
      const overlaps = collaborativeSelection.detectOverlap()
      expect(overlaps).toHaveLength(0)
    })
  })

  describe('clearAll', () => {
    it('should remove all selections', () => {
      collaborativeSelection.updateUserSelection('user-1', 
        { x: 100, y: 100, width: 200, height: 200 }, '#FF0000')
      collaborativeSelection.updateUserSelection('user-2', 
        { x: 300, y: 300, width: 100, height: 100 }, '#00FF00')
      
      collaborativeSelection.clearAll()
      
      const allSelections = collaborativeSelection.getAllSelections()
      expect(allSelections).toHaveLength(0)
    })
  })
})