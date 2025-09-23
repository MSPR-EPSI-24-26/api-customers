import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { Role } from '../../customers/entities/customer.entity';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockCustomer = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main St',
    city: 'Test City',
    postalCode: '12345',
    country: 'Test Country',
    type: 'individual',
    isActive: true,
    role: Role.CUSTOMER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse = {
    access_token: 'mock-jwt-token',
    customer: mockCustomer,
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return customer when credentials are valid', async () => {
    const email = 'john@example.com';
    const password = 'password123';
    
    authService.login.mockResolvedValue(mockLoginResponse);

    const result = await strategy.validate(email, password);

    expect(result).toEqual(mockCustomer);
    expect(authService.login).toHaveBeenCalledWith({ email, password });
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    const email = 'john@example.com';
    const password = 'wrongpassword';
    
    authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

    await expect(strategy.validate(email, password)).rejects.toThrow(
      new UnauthorizedException('Invalid credentials')
    );
  });

  it('should handle different error types from auth service', async () => {
    const email = 'inactive@example.com';
    const password = 'password123';
    
    authService.login.mockRejectedValue(new UnauthorizedException('Account is deactivated'));

    await expect(strategy.validate(email, password)).rejects.toThrow(
      new UnauthorizedException('Account is deactivated')
    );
  });

  it('should handle network or database errors gracefully', async () => {
    const email = 'john@example.com';
    const password = 'password123';
    
    authService.login.mockRejectedValue(new Error('Database connection failed'));

    await expect(strategy.validate(email, password)).rejects.toThrow(
      'Database connection failed'
    );
  });
});