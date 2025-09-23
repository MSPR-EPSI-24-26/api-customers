import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../customers/entities/customer.entity';

describe('AuthController', () => {
  let controller: AuthController;
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

  const mockAuthResponse = {
    access_token: 'mock-jwt-token',
    customer: mockCustomer,
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyToken: jest.fn(),
      validatePermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: Role.CUSTOMER,
    };

    it('should register a new customer', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration errors', async () => {
      authService.register.mockRejectedValue(
        new UnauthorizedException('Customer with this email already exists')
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should login successfully', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login errors', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const mockUser = { id: 1, email: 'john@example.com', role: Role.CUSTOMER };

      const result = controller.getProfile(mockUser);

      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user info', async () => {
      const mockUser = { id: 1, email: 'john@example.com', role: Role.CUSTOMER };

      const result = await controller.validateToken(mockUser);

      expect(result).toEqual({
        valid: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });
  });

  describe('validatePermission', () => {
    const mockBody = {
      token: 'valid-token',
      requiredRole: Role.CUSTOMER,
    };

    const mockDecoded = {
      sub: 1,
      email: 'john@example.com',
      role: Role.CUSTOMER,
    };

    it('should validate permission successfully', async () => {
      authService.verifyToken.mockReturnValue(mockDecoded);
      authService.validatePermission.mockResolvedValue(true);

      const result = await controller.validatePermission(mockBody);

      expect(result).toEqual({
        valid: true,
        user: {
          id: mockDecoded.sub,
          email: mockDecoded.email,
          role: mockDecoded.role,
        },
      });
      expect(authService.verifyToken).toHaveBeenCalledWith(mockBody.token);
      expect(authService.validatePermission).toHaveBeenCalledWith(
        mockDecoded.sub,
        mockBody.requiredRole
      );
    });

    it('should return invalid if permission validation fails', async () => {
      authService.verifyToken.mockReturnValue(mockDecoded);
      authService.validatePermission.mockResolvedValue(false);

      const result = await controller.validatePermission(mockBody);

      expect(result).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should handle token verification errors', async () => {
      authService.verifyToken.mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });

      const result = await controller.validatePermission(mockBody);

      expect(result).toEqual({
        valid: false,
        user: null,
        error: 'Invalid token',
      });
    });

    it('should validate permission without specific role', async () => {
      const bodyWithoutRole = { token: 'valid-token' };
      authService.verifyToken.mockReturnValue(mockDecoded);
      authService.validatePermission.mockResolvedValue(true);

      const result = await controller.validatePermission(bodyWithoutRole);

      expect(result).toEqual({
        valid: true,
        user: {
          id: mockDecoded.sub,
          email: mockDecoded.email,
          role: mockDecoded.role,
        },
      });
      expect(authService.validatePermission).toHaveBeenCalledWith(
        mockDecoded.sub,
        undefined
      );
    });
  });
});