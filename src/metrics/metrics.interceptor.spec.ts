import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let metricsService: jest.Mocked<MetricsService>;

  const mockRequest = {
    method: 'GET',
    path: '/customers',
    route: { path: '/customers' },
  };

  const mockResponse = {
    statusCode: 200,
  };

  const mockExecutionContext: ExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
  } as any;

  const mockCallHandler: CallHandler = {
    handle: jest.fn(),
  };

  beforeEach(async () => {
    const mockMetricsService = {
      incrementHttpRequests: jest.fn(),
      observeHttpDuration: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsInterceptor,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    interceptor = module.get<MetricsInterceptor>(MetricsInterceptor);
    metricsService = module.get(MetricsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should track metrics for successful requests', (done) => {
      const mockData = { id: 1, name: 'Test' };
      mockCallHandler.handle = jest.fn(() => of(mockData));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (data) => {
          expect(data).toBe(mockData);
          
          // Allow some time for the tap operator to execute
          setTimeout(() => {
            expect(metricsService.incrementHttpRequests).toHaveBeenCalledWith(
              'GET',
              '/customers',
              200
            );
            expect(metricsService.observeHttpDuration).toHaveBeenCalledWith(
              'GET',
              '/customers',
              expect.any(Number)
            );
            
            // Check that duration is a reasonable value (less than 1 second for a test)
            const duration = (metricsService.observeHttpDuration as jest.Mock).mock.calls[0][2];
            expect(duration).toBeGreaterThanOrEqual(0);
            expect(duration).toBeLessThan(1);
            
            done();
          }, 10);
        },
      });
    });

    it('should track metrics for error requests', (done) => {
      const error = new Error('Test error');
      mockResponse.statusCode = 500;
      mockCallHandler.handle = jest.fn(() => throwError(() => error));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        error: (err) => {
          expect(err).toBe(error);
          
          // Allow some time for the tap operator to execute
          setTimeout(() => {
            expect(metricsService.incrementHttpRequests).toHaveBeenCalledWith(
              'GET',
              '/customers',
              500
            );
            expect(metricsService.observeHttpDuration).toHaveBeenCalledWith(
              'GET',
              '/customers',
              expect.any(Number)
            );
            done();
          }, 10);
        },
      });
    });

    it('should handle requests without route path', (done) => {
      const mockRequestWithoutRoute = {
        method: 'POST',
        path: '/auth/login',
        route: undefined,
      };

      const contextWithoutRoute = {
        switchToHttp: () => ({
          getRequest: () => mockRequestWithoutRoute,
          getResponse: () => ({ statusCode: 201 }),
        }),
      } as any;

      mockCallHandler.handle = jest.fn(() => of({ success: true }));

      const result = interceptor.intercept(contextWithoutRoute, mockCallHandler);

      result.subscribe({
        next: () => {
          setTimeout(() => {
            expect(metricsService.incrementHttpRequests).toHaveBeenCalledWith(
              'POST',
              '/auth/login',
              201
            );
            expect(metricsService.observeHttpDuration).toHaveBeenCalledWith(
              'POST',
              '/auth/login',
              expect.any(Number)
            );
            done();
          }, 10);
        },
      });
    });

    it('should use default 500 status code for errors without status code', (done) => {
      const mockResponseWithoutStatus = {};
      
      const contextWithoutStatus = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponseWithoutStatus,
        }),
      } as any;

      const error = new Error('Database error');
      mockCallHandler.handle = jest.fn(() => throwError(() => error));

      const result = interceptor.intercept(contextWithoutStatus, mockCallHandler);

      result.subscribe({
        error: () => {
          setTimeout(() => {
            expect(metricsService.incrementHttpRequests).toHaveBeenCalledWith(
              'GET',
              '/customers',
              500
            );
            done();
          }, 10);
        },
      });
    });

    it('should measure duration accurately', (done) => {
      // Mock a delayed response
      mockCallHandler.handle = jest.fn(() => of({ data: 'test' }));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: () => {
          setTimeout(() => {
            const duration = (metricsService.observeHttpDuration as jest.Mock).mock.calls[0][2];
            expect(duration).toBeGreaterThanOrEqual(0);
            expect(duration).toBeLessThan(1); // Should be less than 1 second for a test
            done();
          }, 10);
        },
      });
    });

    it('should handle different HTTP methods', (done) => {
      const putRequest = { ...mockRequest, method: 'PUT' };
      const contextWithPut = {
        switchToHttp: () => ({
          getRequest: () => putRequest,
          getResponse: () => ({ statusCode: 204 }),
        }),
      } as any;

      mockCallHandler.handle = jest.fn(() => of(null));

      const result = interceptor.intercept(contextWithPut, mockCallHandler);

      result.subscribe({
        next: () => {
          setTimeout(() => {
            expect(metricsService.incrementHttpRequests).toHaveBeenCalledWith(
              'PUT',
              '/customers',
              204
            );
            done();
          }, 10);
        },
      });
    });
  });
});