import { Test, TestingModule } from '@nestjs/testing';
import { CustomerModule } from './customer.module';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import * as client from 'prom-client';

describe('CustomerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Clear Prometheus registry before each test
    client.register.clear();
    
    module = await Test.createTestingModule({
      imports: [CustomerModule],
    })
    .overrideProvider('CustomerRepository')
    .useValue({})
    .compile();
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

  it('should provide CustomerService', () => {
    const customerService = module.get<CustomerService>(CustomerService);
    expect(customerService).toBeInstanceOf(CustomerService);
  });

  it('should provide CustomerController', () => {
    const customerController = module.get<CustomerController>(CustomerController);
    expect(customerController).toBeInstanceOf(CustomerController);
  });
});