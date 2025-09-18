import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { register } from 'prom-client';

// Mock prom-client
jest.mock('prom-client', () => ({
  register: {
    metrics: jest.fn(),
    clear: jest.fn(),
  },
  Counter: jest.fn().mockImplementation(() => ({
    inc: jest.fn(),
  })),
  Histogram: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
  })),
  Gauge: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
  })),
  collectDefaultMetrics: jest.fn(),
}));

describe('MetricsService', () => {
  let service: MetricsService;
  let mockHttpRequestsTotal: any;
  let mockHttpRequestDuration: any;
  let mockCustomersTotal: any;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);

    // Get the mock instances
    const { Counter, Histogram, Gauge } = require('prom-client');
    mockHttpRequestsTotal = Counter.mock.results[0]?.value || { inc: jest.fn() };
    mockHttpRequestDuration = Histogram.mock.results[0]?.value || { observe: jest.fn() };
    mockCustomersTotal = Gauge.mock.results[0]?.value || { set: jest.fn() };
  });

  afterEach(() => {
    register.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with default metrics collection', () => {
    const { collectDefaultMetrics } = require('prom-client');
    expect(collectDefaultMetrics).toHaveBeenCalled();
  });

  describe('getMetrics', () => {
    it('should return metrics string', async () => {
      const mockMetrics = 'mock metrics data';
      (register.metrics as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await service.getMetrics();

      expect(result).toBe(mockMetrics);
      expect(register.metrics).toHaveBeenCalled();
    });

    it('should handle empty metrics', async () => {
      (register.metrics as jest.Mock).mockResolvedValue('');

      const result = await service.getMetrics();

      expect(result).toBe('');
    });
  });

  describe('incrementHttpRequests', () => {
    it('should increment HTTP requests counter with correct labels', () => {
      const method = 'GET';
      const route = '/customers';
      const statusCode = 200;

      service.incrementHttpRequests(method, route, statusCode);

      expect(mockHttpRequestsTotal.inc).toHaveBeenCalledWith({
        method,
        route,
        status_code: statusCode.toString(),
      });
    });

    it('should handle different HTTP methods and status codes', () => {
      service.incrementHttpRequests('POST', '/auth/login', 401);

      expect(mockHttpRequestsTotal.inc).toHaveBeenCalledWith({
        method: 'POST',
        route: '/auth/login',
        status_code: '401',
      });
    });

    it('should handle error status codes', () => {
      service.incrementHttpRequests('DELETE', '/customers/1', 500);

      expect(mockHttpRequestsTotal.inc).toHaveBeenCalledWith({
        method: 'DELETE',
        route: '/customers/1',
        status_code: '500',
      });
    });
  });

  describe('observeHttpDuration', () => {
    it('should observe HTTP request duration with correct labels', () => {
      const method = 'GET';
      const route = '/customers';
      const duration = 0.5;

      service.observeHttpDuration(method, route, duration);

      expect(mockHttpRequestDuration.observe).toHaveBeenCalledWith(
        { method, route },
        duration
      );
    });

    it('should handle different durations', () => {
      service.observeHttpDuration('POST', '/auth/register', 1.2);

      expect(mockHttpRequestDuration.observe).toHaveBeenCalledWith(
        { method: 'POST', route: '/auth/register' },
        1.2
      );
    });

    it('should handle very short durations', () => {
      service.observeHttpDuration('GET', '/metrics', 0.001);

      expect(mockHttpRequestDuration.observe).toHaveBeenCalledWith(
        { method: 'GET', route: '/metrics' },
        0.001
      );
    });
  });

  describe('setCustomersCount', () => {
    it('should set customers count gauge', () => {
      const count = 42;

      service.setCustomersCount(count);

      expect(mockCustomersTotal.set).toHaveBeenCalledWith(count);
    });

    it('should handle zero count', () => {
      service.setCustomersCount(0);

      expect(mockCustomersTotal.set).toHaveBeenCalledWith(0);
    });

    it('should handle large counts', () => {
      service.setCustomersCount(9999);

      expect(mockCustomersTotal.set).toHaveBeenCalledWith(9999);
    });
  });
});