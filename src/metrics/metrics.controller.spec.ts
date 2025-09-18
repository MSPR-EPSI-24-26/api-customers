import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    const mockMetricsService = {
      getMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics from service', async () => {
      const mockMetrics = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/customers",status_code="200"} 5

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1",method="GET",route="/customers"} 3
http_request_duration_seconds_bucket{le="0.3",method="GET",route="/customers"} 5
http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/customers"} 5
http_request_duration_seconds_sum{method="GET",route="/customers"} 0.875
http_request_duration_seconds_count{method="GET",route="/customers"} 5

# HELP customers_total Total number of customers
# TYPE customers_total gauge
customers_total 42`;

      metricsService.getMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getMetrics();

      expect(result).toBe(mockMetrics);
      expect(metricsService.getMetrics).toHaveBeenCalled();
    });

    it('should handle empty metrics', async () => {
      metricsService.getMetrics.mockResolvedValue('');

      const result = await controller.getMetrics();

      expect(result).toBe('');
      expect(metricsService.getMetrics).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Metrics collection failed');
      metricsService.getMetrics.mockRejectedValue(error);

      await expect(controller.getMetrics()).rejects.toThrow('Metrics collection failed');
    });

    it('should be called only once per request', async () => {
      const mockMetrics = '# Mock metrics';
      metricsService.getMetrics.mockResolvedValue(mockMetrics);

      await controller.getMetrics();
      await controller.getMetrics();

      expect(metricsService.getMetrics).toHaveBeenCalledTimes(2);
    });
  });
});