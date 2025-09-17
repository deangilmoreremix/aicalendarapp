import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateId,
  getInitials,
  formatDate,
  getPriorityColor,
  getCategoryColor,
  getTypeColor
} from './index'

describe('generateId', () => {
  it('should generate a string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })

  it('should generate unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('should generate IDs of expected length', () => {
    const id = generateId()
    expect(id.length).toBe(9)
  })
})

describe('getInitials', () => {
  it('should return initials for single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('should return initials for two names', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('should return initials for multiple names', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('should handle empty string', () => {
    expect(getInitials('')).toBe('')
  })

  it('should handle single character names', () => {
    expect(getInitials('A B')).toBe('AB')
  })

  it('should convert to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('formatDate', () => {
  const mockDate = new Date('2024-01-15T10:30:00')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "No due date" for undefined date', () => {
    expect(formatDate()).toBe('No due date')
  })

  it('should format today\'s date correctly', () => {
    const today = new Date('2024-01-15T14:00:00')
    expect(formatDate(today)).toBe('Today, 02:00 PM')
  })

  it('should format tomorrow\'s date correctly', () => {
    const tomorrow = new Date('2024-01-16T09:15:00')
    expect(formatDate(tomorrow)).toBe('Tomorrow, 09:15 AM')
  })

  it('should format future dates correctly', () => {
    const future = new Date('2024-01-20T16:45:00')
    const result = formatDate(future)
    expect(result).toContain('1/20/2024')
    expect(result).toContain('4:45 PM')
  })

  it('should format overdue dates correctly', () => {
    const overdue = new Date('2024-01-10T11:00:00')
    const result = formatDate(overdue)
    expect(result).toContain('Overdue:')
    expect(result).toContain('1/10/2024')
    expect(result).toContain('11:00 AM')
  })
})

describe('getPriorityColor', () => {
  it('should return correct color for urgent priority', () => {
    expect(getPriorityColor('urgent')).toBe('bg-red-100 text-red-800 border-red-200')
  })

  it('should return correct color for high priority', () => {
    expect(getPriorityColor('high')).toBe('bg-red-100 text-red-800 border-red-200')
  })

  it('should return correct color for medium priority', () => {
    expect(getPriorityColor('medium')).toBe('bg-amber-100 text-amber-800 border-amber-200')
  })

  it('should return correct color for low priority', () => {
    expect(getPriorityColor('low')).toBe('bg-green-100 text-green-800 border-green-200')
  })
})

describe('getCategoryColor', () => {
  it('should return correct color for call category', () => {
    expect(getCategoryColor('call')).toBe('bg-purple-100 text-purple-800 border-purple-200')
  })

  it('should return correct color for email category', () => {
    expect(getCategoryColor('email')).toBe('bg-blue-100 text-blue-800 border-blue-200')
  })

  it('should return correct color for meeting category', () => {
    expect(getCategoryColor('meeting')).toBe('bg-indigo-100 text-indigo-800 border-indigo-200')
  })

  it('should return correct color for follow-up category', () => {
    expect(getCategoryColor('follow-up')).toBe('bg-amber-100 text-amber-800 border-amber-200')
  })

  it('should return correct color for proposal category', () => {
    expect(getCategoryColor('proposal')).toBe('bg-green-100 text-green-800 border-green-200')
  })

  it('should return correct color for research category', () => {
    expect(getCategoryColor('research')).toBe('bg-cyan-100 text-cyan-800 border-cyan-200')
  })

  it('should return correct color for administrative category', () => {
    expect(getCategoryColor('administrative')).toBe('bg-orange-100 text-orange-800 border-orange-200')
  })

  it('should return default color for unknown category', () => {
    expect(getCategoryColor('unknown')).toBe('bg-gray-100 text-gray-800 border-gray-200')
  })

  it('should return correct color for other category', () => {
    expect(getCategoryColor('other')).toBe('bg-gray-100 text-gray-800 border-gray-200')
  })
})

describe('getTypeColor', () => {
  it('should be an alias for getCategoryColor', () => {
    expect(getTypeColor('call')).toBe(getCategoryColor('call'))
    expect(getTypeColor('email')).toBe(getCategoryColor('email'))
    expect(getTypeColor('unknown')).toBe(getCategoryColor('unknown'))
  })
})