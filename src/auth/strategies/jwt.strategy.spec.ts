import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { Role } from '../../customers/entities/customer.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockCustomer = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
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

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const mockAuthService = {
      validateCustomer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return customer when customer exists', async () => {
    const payload = { sub: 1, email: 'john@example.com', role: Role.CUSTOMER };
    authService.validateCustomer.mockResolvedValue(mockCustomer);

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: mockCustomer.id,
      email: mockCustomer.email,
      role: mockCustomer.role,
    });
    expect(authService.validateCustomer).toHaveBeenCalledWith(1);
  });

  it('should throw UnauthorizedException when customer not found', async () => {
    const payload = { sub: 1, email: 'john@example.com', role: Role.CUSTOMER };
    authService.validateCustomer.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('should handle different payload structures', async () => {
    const payload = { sub: 2, email: 'admin@example.com', role: Role.ADMIN };
    const adminCustomer = { ...mockCustomer, id: 2, email: 'admin@example.com', role: Role.ADMIN, password: 'hashedPassword' };
    authService.validateCustomer.mockResolvedValue(adminCustomer);

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 2,
      email: 'admin@example.com',
      role: Role.ADMIN,
    });
  });
});