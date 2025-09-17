import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600', 'text-white', 'px-4', 'py-2')
  })

  it('renders with custom children', () => {
    render(<Button>Custom Text</Button>)
    expect(screen.getByText('Custom Text')).toBeInTheDocument()
  })

  it('applies default variant styles', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700')
  })

  it('applies outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-gray-300', 'bg-white', 'text-gray-700')
  })

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-gray-700', 'hover:bg-gray-100')
  })

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-100', 'text-gray-900', 'hover:bg-gray-200')
  })

  it('applies small size styles', () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-2', 'text-sm')
  })

  it('applies medium size styles', () => {
    render(<Button size="md">Medium</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm')
  })

  it('applies large size styles', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3', 'text-base')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('passes through additional props', () => {
    render(<Button type="submit" disabled>Submit</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toBeDisabled()
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies focus styles', async () => {
    const user = userEvent.setup()
    render(<Button>Focus me</Button>)

    const button = screen.getByRole('button')
    await user.tab()

    expect(button).toHaveFocus()
  })

  it('has proper accessibility attributes', () => {
    render(<Button aria-label="Custom label">Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Custom label')
  })

  it('renders with complex children', () => {
    render(
      <Button>
        <span>Icon</span>
        Text
      </Button>
    )
    expect(screen.getByText('Icon')).toBeInTheDocument()
    expect(screen.getByText('Text')).toBeInTheDocument()
  })
})