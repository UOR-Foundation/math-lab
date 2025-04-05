import plugin from '../index';
import * as calculations from '../methods/calculations';

// Mock the dashboard object
const mockDashboard = {
  events: {
    subscribe: jest.fn(() => jest.fn()),
  },
  notifications: {
    error: jest.fn(),
  },
  openDocumentation: jest.fn(),
  mathJs: {
    evaluateExpression: jest.fn(),
  },
};

describe('Basic Plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lifecycle methods', () => {
    it('should initialize successfully', async () => {
      const result = await plugin.initialize(mockDashboard, {}, {});
      expect(result.success).toBe(true);
      expect(mockDashboard.events.subscribe).toHaveBeenCalledWith(
        'expression:evaluated',
        expect.any(Function)
      );
    });

    it('should clean up successfully', async () => {
      const result = await plugin.cleanup();
      expect(result.success).toBe(true);
    });
  });

  describe('Methods', () => {
    it('should calculate square correctly', () => {
      const square = plugin.methods.calculateSquare(5);
      expect(square).toBe(25);
    });

    it('should double a value correctly', () => {
      const doubled = plugin.methods.double(5);
      expect(doubled).toBe(10);
    });
  });

  describe('API', () => {
    it('should return the correct version', () => {
      const version = plugin.api.getVersion();
      expect(version).toBe('1.0.0');
    });

    it('should perform calculation correctly', () => {
      jest.spyOn(calculations, 'calculateSquare');
      const result = plugin.api.performCalculation(5);
      expect(result).toBe(25);
      expect(calculations.calculateSquare).toHaveBeenCalledWith(5);
    });
  });
});