import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ImportContactsModal } from '../components/ImportContactsModal'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AIProvider } from '../contexts/AIContext'

// Mock the contact store
vi.mock('../store/contactStore', () => ({
  useContactStore: () => ({
    importContacts: vi.fn(),
  }),
}))

// Mock FileReader
const mockFileReader = class {
  static EMPTY = 0
  static LOADING = 1
  static DONE = 2

  onload: ((event: any) => void) | null = null
  readyState = 0

  readAsText(file: File) {
    this.readyState = mockFileReader.LOADING
    // Simulate successful CSV parsing
    setTimeout(() => {
      this.readyState = mockFileReader.DONE
      if (this.onload) {
        this.onload({
          target: {
            result: 'firstName,lastName,email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com'
          }
        })
      }
    }, 0)
  }
}

global.FileReader = mockFileReader as any

// Mock File constructor
global.File = class extends Blob {
  name: string
  lastModified: number
  webkitRelativePath: string = ''

  constructor(parts: any[], filename: string, options?: any) {
    super(parts, options)
    this.name = filename
    this.lastModified = Date.now()
  }
} as any

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <AIProvider>
        {component}
      </AIProvider>
    </ThemeProvider>
  )
}

describe('Upload Integration Tests', () => {
  let mockImportContacts: any

  beforeEach(() => {
    mockImportContacts = vi.fn()
    vi.mocked(import('../store/contactStore')).then((mockStore) => {
      mockStore.useContactStore.mockReturnValue({
        importContacts: mockImportContacts,
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('CSV Upload Security & Validation', () => {
    it('should reject non-CSV files', async () => {
      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Please select a CSV file')).toBeInTheDocument()
      })
    })

    it('should accept CSV files', async () => {
      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      const file = new File(['firstName,lastName,email\nJohn,Doe,john@example.com'], 'contacts.csv', { type: 'text/csv' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('contacts.csv')).toBeInTheDocument()
      })
    })

    it('should validate file size limits', async () => {
      // Create a large file (over 10MB)
      const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
      const largeFile = new File([largeContent], 'large.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByText(/File size exceeds the maximum limit/)).toBeInTheDocument()
      })
    })

    it('should detect and prevent duplicate emails', async () => {
      const csvContent = 'firstName,lastName,email\nJohn,Doe,john@example.com\nJane,Smith,john@example.com'
      const file = new File([csvContent], 'duplicates.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      // Navigate to preview
      await waitFor(() => {
        expect(screen.getByText('Preview & Import')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Preview & Import'))

      await waitFor(() => {
        expect(screen.getByText(/Duplicate email addresses detected/)).toBeInTheDocument()
      })
    })
  })

  describe('CSV Parsing & Data Validation', () => {
    it('should parse valid CSV data correctly', async () => {
      const csvContent = 'firstName,lastName,email,title,company\nJohn,Doe,john@example.com,Developer,TechCorp\nJane,Smith,jane@example.com,Manager,BusinessInc'
      const file = new File([csvContent], 'valid.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Preview & Import')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Preview & Import'))

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      const csvContent = 'firstName,lastName,email\nJohn,,john@example.com\n,Jane,jane@example.com'
      const file = new File([csvContent], 'missing-fields.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Preview & Import')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Preview & Import'))

      await waitFor(() => {
        expect(screen.getByText(/First name is required/)).toBeInTheDocument()
        expect(screen.getByText(/Last name is required/)).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      const csvContent = 'firstName,lastName,email\nJohn,Doe,invalid-email\nJane,Smith,jane@example.com'
      const file = new File([csvContent], 'invalid-email.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Preview & Import')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Preview & Import'))

      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/)).toBeInTheDocument()
      })
    })
  })

  describe('Import Process & Error Handling', () => {
    it('should show progress during import', async () => {
      mockImportContacts.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      const csvContent = 'firstName,lastName,email\nJohn,Doe,john@example.com'
      const file = new File([csvContent], 'progress-test.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Preview & Import')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Preview & Import'))

      // Navigate to import tab
      await waitFor(() => {
        expect(screen.getByText('Import 1 Contacts')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Import 1 Contacts'))

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Importing...')).toBeInTheDocument()
      })

      // Should complete successfully
      await waitFor(() => {
        expect(screen.getByText('Import Successful!')).toBeInTheDocument()
      })

      expect(mockImportContacts).toHaveBeenCalledWith([
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        })
      ])
    })

    it('should handle import errors gracefully', async () => {
      mockImportContacts.mockRejectedValue(new Error('Database connection failed'))

      const csvContent = 'firstName,lastName,email\nJohn,Doe,john@example.com'
      const file = new File([csvContent], 'error-test.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Preview & Import')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Preview & Import'))

      await waitFor(() => {
        expect(screen.getByText('Import 1 Contacts')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Import 1 Contacts'))

      await waitFor(() => {
        expect(screen.getByText('Failed to import contacts')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility & User Experience', () => {
    it('should be keyboard accessible', async () => {
      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      // Modal should have proper ARIA attributes
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby')

      // File input should be accessible
      const fileInput = screen.getByLabelText(/upload csv file/i)
      expect(fileInput).toHaveAttribute('accept', '.csv')
    })

    it('should provide clear user feedback', async () => {
      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      // Should show helpful guidance
      expect(screen.getByText('CSV Format Requirements')).toBeInTheDocument()
      expect(screen.getByText('Required Fields (Minimum)')).toBeInTheDocument()

      // Should have download template option
      expect(screen.getByText('Download CSV Template')).toBeInTheDocument()
    })

    it('should handle drag and drop interactions', async () => {
      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const dropZone = screen.getByText(/Drag and drop your CSV file here/).closest('div')

      // Simulate drag over
      fireEvent.dragOver(dropZone!)
      expect(dropZone).toHaveClass('border-blue-500')

      // Simulate drag leave
      fireEvent.dragLeave(dropZone!)
      expect(dropZone).not.toHaveClass('border-blue-500')
    })
  })

  describe('Security & Content Validation', () => {
    it('should prevent script injection in CSV', async () => {
      const maliciousCsv = 'firstName,lastName,email\n<script>,alert("xss")</script>,<script>alert("xss")</script>'
      const file = new File([maliciousCsv], 'malicious.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Preview & Import')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Preview & Import'))

      await waitFor(() => {
        // Should not render script tags, should show validation errors
        expect(screen.getByText(/First name is required/)).toBeInTheDocument()
      })
    })

    it('should validate data types and formats', async () => {
      const invalidDataCsv = 'firstName,lastName,email,interestLevel\nJohn,Doe,john@example.com,invalid_level\nJane,Smith,jane@example.com,hot'
      const file = new File([invalidDataCsv], 'invalid-data.csv', { type: 'text/csv' })

      renderWithProviders(<ImportContactsModal isOpen={true} onClose={() => {}} />)

      const fileInput = screen.getByLabelText(/upload csv file/i) as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Preview & Import')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Preview & Import'))

      await waitFor(() => {
        expect(screen.getByText(/Interest level must be/)).toBeInTheDocument()
      })
    })
  })
})