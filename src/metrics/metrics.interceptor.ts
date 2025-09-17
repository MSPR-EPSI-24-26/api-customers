import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly metricsService: MetricsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        const start = Date.now();
        const method = request.method;
        const route = request.route?.path || request.path;

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = (Date.now() - start) / 1000;
                    const statusCode = response.statusCode;

                    this.metricsService.incrementHttpRequests(method, route, statusCode);
                    this.metricsService.observeHttpDuration(method, route, duration);
                },
                error: () => {
                    const duration = (Date.now() - start) / 1000;
                    const statusCode = response.statusCode || 500;

                    this.metricsService.incrementHttpRequests(method, route, statusCode);
                    this.metricsService.observeHttpDuration(method, route, duration);
                },
            }),
        );
    }
}