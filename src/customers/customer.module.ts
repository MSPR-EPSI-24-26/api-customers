// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), MetricsModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
