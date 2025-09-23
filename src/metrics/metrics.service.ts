import { Injectable } from '@nestjs/common';
import {
  register,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // buckets en secondes
  });

  private readonly customersTotal = new Gauge({
    name: 'customers_total',
    help: 'Total number of customers',
  });

  constructor() {
    // Collecter les métriques par défaut (CPU, mémoire, etc.)
    collectDefaultMetrics();
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
  }

  observeHttpDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe({ method, route }, duration);
  }

  setCustomersCount(count: number) {
    this.customersTotal.set(count);
  }
}
