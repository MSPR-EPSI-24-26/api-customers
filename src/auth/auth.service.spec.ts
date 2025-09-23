import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { Customer, Role } from '../customers/entities/customer.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockCustomer: Customer = {
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
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    customerRepository = module.get(getRepositoryToken(Customer));
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: Role.CUSTOMER,
    };

    it('should register a new customer successfully', async () => {
      customerRepository.findOne.mockResolvedValue(null);
      customerRepository.create.mockReturnValue({ ...mockCustomer, ...registerDto });
      customerRepository.save.mockResolvedValue({ ...mockCustomer, ...registerDto });
      jwtService.sign.mockReturnValue('mock-jwt-token');

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        customer: expect.objectContaining({
          email: 'john@example.com',
        }),
      });
      expect(result.customer).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if customer already exists', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      await expect(service.register(registerDto)).rejects.toThrow(
        new UnauthorizedException('Customer with this email already exists')
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      jwtService.sign.mockReturnValue('mock-jwt-token');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        customer: expect.objectContaining({
          email: 'john@example.com',
        }),
      });
      expect(result.customer).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if customer not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException if customer is inactive', async () => {
      const inactiveCustomer = { ...mockCustomer, isActive: false };
      customerRepository.findOne.mockResolvedValue(inactiveCustomer);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Account is deactivated')
      );
    });
  });

  describe('validateCustomer', () => {
    it('should return customer if found and active', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.validateCustomer(1);

      expect(result).toEqual(mockCustomer);
      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, isActive: true },
      });
    });

    it('should return null if customer not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      const result = await service.validateCustomer(1);

      expect(result).toBeNull();
    });
  });

  describe('validatePermission', () => {
    it('should return true if customer exists and no specific role required', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.validatePermission(1);

      expect(result).toBe(true);
    });

    it('should return false if customer not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      const result = await service.validatePermission(1, Role.CUSTOMER);

      expect(result).toBe(false);
    });

    it('should return true if customer is admin (can access everything)', async () => {
      const adminCustomer = { ...mockCustomer, role: Role.ADMIN };
      customerRepository.findOne.mockResolvedValue(adminCustomer);

      const result = await service.validatePermission(1, Role.CUSTOMER);

      expect(result).toBe(true);
    });

    it('should return true if customer has required role', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.validatePermission(1, Role.CUSTOMER);

      expect(result).toBe(true);
    });

    it('should return false if customer does not have required role', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.validatePermission(1, Role.ADMIN);

      expect(result).toBe(false);
    });
  });

  describe('verifyToken', () => {
    it('should return decoded token if valid', () => {
      const mockDecoded = { sub: 1, email: 'john@example.com', role: Role.CUSTOMER };
      jwtService.verify.mockReturnValue(mockDecoded);

      const result = service.verifyToken('valid-token');

      expect(result).toEqual(mockDecoded);
    });

    it('should throw UnauthorizedException if token is invalid', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.verifyToken('invalid-token')).toThrow(
        new UnauthorizedException('Invalid token')
      );
    });
  });
});