import { GetUser } from './get-user.decorator';

describe('GetUser Decorator', () => {
  it('should be defined', () => {
    expect(GetUser).toBeDefined();
  });

  it('should create a parameter decorator function', () => {
    const decorator = GetUser();
    expect(typeof decorator).toBe('function');
  });

  it('should create a parameter decorator function with property', () => {
    const decorator = GetUser('email');
    expect(typeof decorator).toBe('function');
  });

  it('should work as expected decorator', () => {
    // Test that we can apply the decorator without throwing
    expect(() => {
      const decorator = GetUser();
      decorator({} as any, {} as any, {} as any);
    }).not.toThrow();
  });
});