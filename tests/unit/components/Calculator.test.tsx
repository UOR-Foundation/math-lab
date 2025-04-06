import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Calculator from '../../../src/components/dashboard/Calculator';

// Mock the hooks module to avoid math-js dependency
vi.mock('../../../src/hooks', () => ({
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
  }),
  // Mock other required hooks
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));

// Mock React Redux hooks to avoid store dependency
vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: vi.fn()
}));

describe('Calculator Component', () => {
  it('renders the calculator component title', () => {
    render(<Calculator />);
    expect(screen.getByText('Calculator')).toBeDefined();
  });
});