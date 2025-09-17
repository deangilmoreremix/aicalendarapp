import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ContactService, contactService, ValidationResult } from './contactService'
import { Contact } from '../types'

// Mock timers for async operations
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('ContactService', () => {
  let service: ContactService

  beforeEach(() => {
    service = new ContactService()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ContactService.getInstance()
      const instance2 = ContactService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should return the exported instance', () => {
      const instance = ContactService.getInstance()
      expect(contactService).toBe(instance)
    })
  })

  describe('validateContactData', () => {
    it('should validate a complete valid contact', () => {
      const contact: Partial<Contact> = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Tech Corp',
        title: 'Developer'
      }

      const result = service.validateContactData(contact)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate contact with full name instead of first/last', () => {
      const contact: Partial<Contact> = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Tech Corp',
        title: 'Developer'
      }

      const result = service.validateContactData(contact)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation when firstName and name are missing', () => {
      const contact: Partial<Contact> = {
        email: 'john.doe@example.com',
        company: 'Tech Corp',
        title: 'Developer'
      }

      const result = service.validateContactData(contact)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('First name or full name is required')
    })

    it('should fail validation when email is missing', () => {
      const contact: Partial<Contact> = {
        firstName: 'John',
        company: 'Tech Corp',
        title: 'Developer'
      }

      const result = service.validateContactData(contact)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Email is required')
    })

    it('should fail validation for invalid email format', () => {
      const contact: Partial<Contact> = {
        firstName: 'John',
        email: 'invalid-email',
        company: 'Tech Corp',
        title: 'Developer'
      }

      const result = service.validateContactData(contact)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid email format')
    })

    it('should fail validation when company is missing', () => {
      const contact: Partial<Contact> = {
        firstName: 'John',
        email: 'john.doe@example.com',
        title: 'Developer'
      }

      const result = service.validateContactData(contact)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Company is required')
    })

    it('should fail validation when title is missing', () => {
      const contact: Partial<Contact> = {
        firstName: 'John',
        email: 'john.doe@example.com',
        company: 'Tech Corp'
      }

      const result = service.validateContactData(contact)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Job title is required')
    })

    it('should accumulate multiple validation errors', () => {
      const contact: Partial<Contact> = {
        // Missing firstName, email, company, title
      }

      const result = service.validateContactData(contact)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(4)
      expect(result.errors).toContain('First name or full name is required')
      expect(result.errors).toContain('Email is required')
      expect(result.errors).toContain('Company is required')
      expect(result.errors).toContain('Job title is required')
    })
  })

  describe('Email validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@gmail.com',
        'user@subdomain.domain.com'
      ]

      validEmails.forEach(email => {
        expect(service['isValidEmail'](email)).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test@.com',
        'test @example.com'
      ]

      invalidEmails.forEach(email => {
        expect(service['isValidEmail'](email)).toBe(false)
      })
    })
  })

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      const updates: Partial<Contact> = {
        firstName: 'Updated',
        lastName: 'Name'
      }

      const promise = service.updateContact('123', updates)

      // Fast-forward time to resolve the promise
      vi.advanceTimersByTime(500)

      const result = await promise

      expect(result.id).toBe('123')
      expect(result.firstName).toBe('Updated')
      expect(result.lastName).toBe('Name')
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should simulate API delay', async () => {
      const promise = service.updateContact('123', { firstName: 'Test' })

      // Fast-forward time
      vi.advanceTimersByTime(500)

      const result = await promise
      expect(result).toBeDefined()
    })
  })

  describe('addContactActivity', () => {
    it('should add activity successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const promise = service.addContactActivity('123', 'email_sent', 'Email sent', { subject: 'Test' })

      vi.advanceTimersByTime(200)

      await promise

      expect(consoleSpy).toHaveBeenCalledWith(
        'Activity logged: email_sent - Email sent',
        { subject: 'Test' }
      )

      consoleSpy.mockRestore()
    })

    it('should simulate API delay', async () => {
      const promise = service.addContactActivity('123', 'test', 'description')

      vi.advanceTimersByTime(200)

      await promise
    })
  })

  describe('getContactActivities', () => {
    it('should return mock activities', async () => {
      const promise = service.getContactActivities('123')

      vi.advanceTimersByTime(300)

      const activities = await promise

      expect(activities).toHaveLength(2)
      expect(activities[0]).toMatchObject({
        id: '1',
        type: 'contact_created',
        description: 'Contact was created'
      })
      expect(activities[1]).toMatchObject({
        id: '2',
        type: 'email_sent',
        description: 'Email sent to contact'
      })
    })

    it('should simulate API delay', async () => {
      const promise = service.getContactActivities('123')

      vi.advanceTimersByTime(300)

      const activities = await promise
      expect(activities).toHaveLength(2)
    })
  })

  describe('searchContacts', () => {
    it('should return empty array', async () => {
      const promise = service.searchContacts('test query')

      vi.advanceTimersByTime(400)

      const results = await promise

      expect(results).toEqual([])
    })

    it('should simulate API delay', async () => {
      const promise = service.searchContacts('test')

      vi.advanceTimersByTime(400)

      const results = await promise
      expect(results).toEqual([])
    })
  })

  describe('exportContacts', () => {
    it('should return CSV data', async () => {
      const promise = service.exportContacts(['1', '2'])

      vi.advanceTimersByTime(1000)

      const csv = await promise

      expect(csv).toContain('id,name,email,company')
      expect(csv).toContain('John Doe,john@example.com,Company A')
      expect(csv).toContain('Jane Smith,jane@example.com,Company B')
    })

    it('should simulate API delay', async () => {
      const promise = service.exportContacts(['1'])

      vi.advanceTimersByTime(1000)

      const csv = await promise
      expect(typeof csv).toBe('string')
    })
  })
})