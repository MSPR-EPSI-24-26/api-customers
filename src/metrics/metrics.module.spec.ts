import { Test, TestingModule } from '@nestjs/testing';
import { MetricsModule } from './metrics.module';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import * as client from 'prom-client';

describe('MetricsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Clear Prometheus registry before each test
    client.register.clear();
    
    module = await Test.createTestingModule({
      imports: [MetricsModule],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    // Clear registry after each test
    client.register.clear();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide MetricsService', () => {
    const metricsService = module.get<MetricsService>(MetricsService);
    expect(metricsService).toBeInstanceOf(MetricsService);
  });

  it('should provide MetricsController', () => {
    const metricsController = module.get<MetricsController>(MetricsController);
    expect(metricsController).toBeInstanceOf(MetricsController);
  });
});