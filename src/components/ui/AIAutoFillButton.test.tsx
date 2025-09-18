import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIAutoFillButton } from './AIAutoFillButton';

// Mock the AI enrichment service
const mockEnrichContactByEmail = vi.fn();
const mockEnrichContactByLinkedIn = vi.fn();
const mockEnrichContactByName = vi.fn();

vi.mock('../../services/aiEnrichmentService', () => ({
  AIEnrichmentService: {
    enrichContactByEmail: mockEnrichContactByEmail,
    enrichContactByLinkedIn: mockEnrichContactByLinkedIn,
    enrichContactByName: mockEnrichContactByName
  }
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
      expect(screen.getByText('Enter email or name for AI auto-fill')).toBeInTheDocument();
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
    it('should call enrichContactByEmail when email is provided', async () => {
      const mockEnrichmentData = {
        firstName: 'John',
        lastName: 'Smith',
        title: 'CEO',
        company: 'TechCorp'
      };

      mockEnrichContactByEmail.mockResolvedValue(mockEnrichmentData);

      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'john@techcorp.com' }} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEnrichContactByEmail).toHaveBeenCalledWith('john@techcorp.com');
        expect(mockOnAutoFill).toHaveBeenCalledWith(mockEnrichmentData);
      });
    });

    it('should call enrichContactByLinkedIn when LinkedIn URL is provided', async () => {
      const mockEnrichmentData = {
        firstName: 'John',
        lastName: 'Smith',
        title: 'CEO'
      };

      mockEnrichContactByLinkedIn.mockResolvedValue(mockEnrichmentData);

      render(<AIAutoFillButton {...defaultProps} formData={{
        socialProfiles: { linkedin: 'https://linkedin.com/in/johnsmith' }
      }} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEnrichContactByLinkedIn).toHaveBeenCalledWith('https://linkedin.com/in/johnsmith');
        expect(mockOnAutoFill).toHaveBeenCalledWith(mockEnrichmentData);
      });
    });

    it('should call enrichContactByName when name is provided', async () => {
      const mockEnrichmentData = {
        email: 'john@techcorp.com',
        title: 'CEO'
      };

      mockEnrichContactByName.mockResolvedValue(mockEnrichmentData);

      render(<AIAutoFillButton {...defaultProps} formData={{
        firstName: 'John',
        lastName: 'Smith',
        company: 'TechCorp'
      } as any} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEnrichContactByName).toHaveBeenCalledWith('John', 'Smith', 'TechCorp');
        expect(mockOnAutoFill).toHaveBeenCalledWith(mockEnrichmentData);
      });
    });

    it('should prioritize email over LinkedIn over name', async () => {
      const mockEnrichmentData = { firstName: 'John' };

      mockEnrichContactByEmail.mockResolvedValue(mockEnrichmentData);

      render(<AIAutoFillButton {...defaultProps} formData={{
        email: 'john@techcorp.com',
        firstName: 'John',
        lastName: 'Smith',
        socialProfiles: { linkedin: 'https://linkedin.com/in/john' }
      } as any} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEnrichContactByEmail).toHaveBeenCalledWith('john@techcorp.com');
        expect(mockEnrichContactByLinkedIn).not.toHaveBeenCalled();
        expect(mockEnrichContactByName).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during enrichment', async () => {
      mockEnrichContactByEmail.mockImplementation(() =>
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
      mockEnrichContactByEmail.mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );

      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'test@example.com' }} />);

      const button = screen.getByText('AI Auto-Fill');
      fireEvent.click(button);

      expect(button).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle enrichment errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockEnrichContactByEmail.mockRejectedValue(new Error('API Error'));

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

      const button = screen.getByText('AI Auto-Fill');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should support keyboard interaction', () => {
      render(<AIAutoFillButton {...defaultProps} formData={{ email: 'test@example.com' }} />);

      const button = screen.getByText('AI Auto-Fill');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });
});