import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIAutoFillButton } from './AIAutoFillButton';

// Mock the AI enrichment service
const { mockEnrich } = vi.hoisted(() => ({ mockEnrich: vi.fn() }));

// Enrichment is a single OpenAI web_search lookup using everything known about the contact
vi.mock('../../services/aiEnrichmentService', () => ({
  AIEnrichmentService: { enrich: mockEnrich }
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Wand2: () => <div data-testid="wand-icon">Wand2</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>
}));

describe('AIAutoFillButton', () => {
  const mockOnAutoFill = vi.fn();
  const defaultProps = {
    formData: {} as any,
    onAutoFill: mockOnAutoFill
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Visibility and State', () => {
    it('should show hint text when no enrichment data is available', () => {
      render(<AIAutoFillButton {...defaultProps} />);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('title', expect.stringContaining('Enter email'));
    });

    it('should show auto-fill button when email is provided', () => {
      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'test@example.com' }} />);
      expect(screen.getByText('AI Auto-Fill')).toBeInTheDocument();
      expect(screen.getByTestId('wand-icon')).toBeInTheDocument();
    });

    it('should show auto-fill button when LinkedIn URL is provided', () => {
      render(<AIAutoFillButton {...defaultProps} formData={{
        socialProfiles: { linkedin: 'https://linkedin.com/in/test' }
      }} />);
      expect(screen.getByText('AI Auto-Fill')).toBeInTheDocument();
    });

    it('should show auto-fill button when name is provided', () => {
      render(<AIAutoFillButton {...defaultProps} formData={{
        firstName: 'John',
        lastName: 'Smith'
      }} />);
      expect(screen.getByText('AI Auto-Fill')).toBeInTheDocument();
    });
  });

  describe('Auto-Fill Functionality', () => {
    it('should enrich when email is provided', async () => {
      const mockEnrichmentData = {
        firstName: 'John',
        lastName: 'Smith',
        title: 'CEO',
        company: 'TechCorp'
      };

      mockEnrich.mockResolvedValue(mockEnrichmentData);

      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'john@techcorp.com' }} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEnrich).toHaveBeenCalledWith({ email: 'john@techcorp.com' });
        expect(mockOnAutoFill).toHaveBeenCalledWith(mockEnrichmentData);
      });
    });

    it('should enrich when LinkedIn URL is provided', async () => {
      const mockEnrichmentData = {
        firstName: 'John',
        lastName: 'Smith',
        title: 'CEO'
      };

      mockEnrich.mockResolvedValue(mockEnrichmentData);

      render(<AIAutoFillButton {...defaultProps} formData={{
        socialProfiles: { linkedin: 'https://linkedin.com/in/johnsmith' }
      }} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEnrich).toHaveBeenCalledWith({ socialProfiles: { linkedin: 'https://linkedin.com/in/johnsmith' } });
        expect(mockOnAutoFill).toHaveBeenCalledWith(mockEnrichmentData);
      });
    });

    it('should enrich when name is provided', async () => {
      const mockEnrichmentData = {
        email: 'john@techcorp.com',
        title: 'CEO'
      };

      mockEnrich.mockResolvedValue(mockEnrichmentData);

      render(<AIAutoFillButton {...defaultProps} formData={{
        firstName: 'John',
        lastName: 'Smith',
        company: 'TechCorp'
      } as any} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEnrich).toHaveBeenCalledWith({ firstName: 'John', lastName: 'Smith', company: 'TechCorp' });
        expect(mockOnAutoFill).toHaveBeenCalledWith(mockEnrichmentData);
      });
    });

    it('should send all known contact details in one lookup', async () => {
      const mockEnrichmentData = { firstName: 'John' };

      mockEnrich.mockResolvedValue(mockEnrichmentData);

      render(<AIAutoFillButton {...defaultProps} formData={{
        email: 'john@techcorp.com',
        firstName: 'John',
        lastName: 'Smith',
        socialProfiles: { linkedin: 'https://linkedin.com/in/john' }
      } as any} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEnrich).toHaveBeenCalledTimes(1);
        expect(mockEnrich.mock.calls[0][0]).toMatchObject({ email: 'john@techcorp.com', firstName: 'John', lastName: 'Smith' });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during enrichment', async () => {
      mockEnrich.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'test@example.com' }} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      expect(screen.getByText('AI Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('AI Processing...')).not.toBeInTheDocument();
      });
    });

    it('should disable button during processing', () => {
      mockEnrich.mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );

      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'test@example.com' }} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(button).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle enrichment errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockEnrich.mockRejectedValue(new Error('API Error'));

      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'test@example.com' }} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Auto-fill failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button attributes', () => {
      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'test@example.com' }} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should support keyboard interaction', () => {
      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'test@example.com' }} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });
});