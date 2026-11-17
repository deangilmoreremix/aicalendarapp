import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ImportContactsModal } from '../components/ImportContactsModal'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AIProvider } from '../contexts/AIContext'

const { create } = vi.hoisted(() => ({ create: vi.fn() }))

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>()
  return { ...actual, contactApi: { ...actual.contactApi, create } }
})

const renderModal = () => {
  render(
    <ThemeProvider>
      <AIProvider>
        <ImportContactsModal isOpen={true} onClose={() => {}} />
      </AIProvider>
    </ThemeProvider>
  )
  // The file input lives on the "Upload File" tab
  fireEvent.click(screen.getByRole('button', { name: /upload file/i }))
  return screen.getByLabelText(/select csv file/i) as HTMLInputElement
}

const upload = (input: HTMLInputElement, content: string, name = 'contacts.csv', type = 'text/csv') => {
  const file = new File([content], name, { type })
  // jsdom's File lacks text(); the component uses FileReader which jsdom supports
  fireEvent.change(input, { target: { files: [file] } })
}

describe('ImportContactsModal CSV import', () => {
  beforeEach(() => {
    create.mockReset()
    create.mockResolvedValue({})
  })

  it('rejects non-CSV files', async () => {
    const input = renderModal()
    upload(input, 'hello', 'notes.txt', 'text/plain')
    expect(await screen.findByText(/Please select a CSV file/)).toBeInTheDocument()
  })

  it('rejects files over 10MB', async () => {
    const input = renderModal()
    const file = new File(['x'], 'big.csv', { type: 'text/csv' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText(/File size must be less than 10MB/)).toBeInTheDocument()
  })

  it('rejects potentially unsafe content', async () => {
    const input = renderModal()
    upload(input, 'firstName,lastName,email\n<script>alert(1)</script>,Doe,john@example.com')
    expect(await screen.findByText(/File contains potentially unsafe content/)).toBeInTheDocument()
  })

  it('parses a valid CSV and offers to import the contacts', async () => {
    const input = renderModal()
    upload(input, 'firstName,lastName,email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com')
    expect(await screen.findByText(/Import 2 Contacts/)).toBeInTheDocument()
  })

  it('reports invalid emails and duplicate emails by row', async () => {
    const input = renderModal()
    upload(input, 'firstName,lastName,email\nJohn,Doe,not-an-email\nJane,Smith,jane@example.com\nJan,Smyth,jane@example.com')
    expect(await screen.findByText(/Row 2: Invalid email format/)).toBeInTheDocument()
    expect(screen.getByText(/Row 4: Duplicate email "jane@example.com"/)).toBeInTheDocument()
  })

  it('requires first name, last name and email', async () => {
    const input = renderModal()
    upload(input, 'firstName,lastName,email\n,,')
    expect(await screen.findByText(/Row 2: First name is required, Last name is required, Email is required/)).toBeInTheDocument()
  })

  it('creates contacts with camelCase fields when importing', async () => {
    const input = renderModal()
    upload(input, 'firstName,lastName,email,interestLevel\nJohn,Doe,john@example.com,hot')
    fireEvent.click(await screen.findByText(/Import 1 Contacts/))
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create.mock.calls[0][0]).toMatchObject({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', interestLevel: 'hot' })
  })
})
