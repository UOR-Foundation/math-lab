import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Calculator from '../../../src/components/dashboard/Calculator';
import * as hooks from '../../../src/hooks';

// Mock the useMathJs hook
vi.mock('../../../src/hooks', async () => {
  const actual = await vi.importActual('../../../src/hooks');
  return {
    ...actual,
    useMathJs: () => ({
      add: vi.fn().mockResolvedValue('3'),
      subtract: vi.fn().mockResolvedValue('1'),
      multiply: vi.fn().mockResolvedValue('2'),
      divide: vi.fn().mockResolvedValue('2'),
      isPrime: vi.fn().mockResolvedValue(true),
      factorize: vi.fn().mockResolvedValue({ '2': 1, '3': 1 }),
      gcd: vi.fn().mockResolvedValue('1'),
      lcm: vi.fn().mockResolvedValue('6'),
      clearCache: vi.fn(),
      error: null,
      loading: false
    })
  };
});

describe('Calculator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the calculator component', () => {
    render(<Calculator />);
    expect(screen.getByText('Calculator')).toBeInTheDocument();
  });
  
  it('has basic, scientific, and number theory modes', () => {
    render(<Calculator />);
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Scientific')).toBeInTheDocument();
    expect(screen.getByText('Number Theory')).toBeInTheDocument();
  });
  
  it('allows input of digits', () => {
    render(<Calculator />);
    
    // Click on digit 1
    fireEvent.click(screen.getByText('1'));
    
    // Check that display shows 1
    const displays = screen.getAllByRole('textbox');
    expect(displays[1]).toHaveValue('1');
  });
  
  it('allows performing basic operations', async () => {
    render(<Calculator />);
    
    // Input 1 + 2 = 
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('='));
    
    // Wait for the calculation to complete
    await vi.waitFor(() => {
      const displays = screen.getAllByRole('textbox');
      expect(displays[1]).toHaveValue('3');
    });
  });
});