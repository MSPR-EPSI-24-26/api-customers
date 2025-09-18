import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../../customers/entities/customer.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockExecutionContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user } as any),
      getResponse: () => ({} as any),
      getNext: () => ({} as any),
    }),
    getHandler: () => ({} as any),
    getClass: () => ({} as any),
    getArgs: () => ([] as any),
    getArgByIndex: () => ({} as any),
    switchToRpc: () => ({} as any),
    switchToWs: () => ({} as any),
    getType: () => 'http' as any,
  });

  beforeEach(async () => {
    const mockReflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    const contextWithUser = createMockExecutionContext({
      id: 1,
      email: 'test@example.com',
      role: Role.CUSTOMER,
      password: 'hashed'
    });

    reflector.get.mockReturnValue(undefined);

    const result = guard.canActivate(contextWithUser);

    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const contextWithUser = createMockExecutionContext({
      id: 1,
      email: 'test@example.com',
      role: Role.CUSTOMER,
      password: 'hashed'
    });

    reflector.get.mockReturnValue([Role.CUSTOMER]);

    const result = guard.canActivate(contextWithUser);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    const contextWithUser = createMockExecutionContext({
      id: 1,
      email: 'test@example.com',
      role: Role.CUSTOMER,
      password: 'hashed'
    });

    reflector.get.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(contextWithUser)).toThrow(ForbiddenException);
  });

  it('should allow access for admin to any resource', () => {
    const contextWithAdmin = createMockExecutionContext({
      id: 1,
      email: 'admin@example.com',
      role: Role.ADMIN,
      password: 'hashed'
    });

    reflector.get.mockReturnValue([Role.CUSTOMER]);

    const result = guard.canActivate(contextWithAdmin);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user is not authenticated', () => {
    const contextWithoutUser = createMockExecutionContext(null);

    reflector.get.mockReturnValue([Role.CUSTOMER]);

    expect(() => guard.canActivate(contextWithoutUser)).toThrow(ForbiddenException);
  });

  it('should handle multiple required roles', () => {
    const contextWithUser = createMockExecutionContext({
      id: 1,
      email: 'test@example.com',
      role: Role.CUSTOMER,
      password: 'hashed'
    });

    reflector.get.mockReturnValue([Role.CUSTOMER, Role.ADMIN]);

    const result = guard.canActivate(contextWithUser);

    expect(result).toBe(true);
  });

  it('should allow admin access to multiple required roles', () => {
    const contextWithAdmin = createMockExecutionContext({
      id: 1,
      email: 'admin@example.com',
      role: Role.ADMIN,
      password: 'hashed'
    });

    reflector.get.mockReturnValue([Role.CUSTOMER]);

    const result = guard.canActivate(contextWithAdmin);

    expect(result).toBe(true);
  });
});