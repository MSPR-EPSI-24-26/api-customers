import { Roles } from './roles.decorator';
import { Role } from '../../customers/entities/customer.entity';

describe('Roles Decorator', () => {
  it('should be defined', () => {
    expect(Roles).toBeDefined();
  });

  it('should create a decorator function for single role', () => {
    const decorator = Roles(Role.ADMIN);
    expect(typeof decorator).toBe('function');
  });

  it('should create a decorator function for multiple roles', () => {
    const decorator = Roles(Role.ADMIN, Role.CUSTOMER);
    expect(typeof decorator).toBe('function');
  });

  it('should work with all available roles', () => {
    const adminDecorator = Roles(Role.ADMIN);
    const customerDecorator = Roles(Role.CUSTOMER);
    const bothDecorator = Roles(Role.ADMIN, Role.CUSTOMER);

    expect(typeof adminDecorator).toBe('function');
    expect(typeof customerDecorator).toBe('function');
    expect(typeof bothDecorator).toBe('function');
  });

  it('should create decorator that can be applied to methods', () => {
    const decorator = Roles(Role.ADMIN);

    // Test that we can apply the decorator without throwing
    expect(() => {
      class TestClass {
        @decorator
        testMethod() {}
      }
    }).not.toThrow();
  });
});