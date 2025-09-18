import { Customer, Role } from './customer.entity';

describe('Customer Entity', () => {
  it('should create a customer instance', () => {
    const customer = new Customer();
    
    expect(customer).toBeDefined();
    expect(customer).toBeInstanceOf(Customer);
  });

  it('should have all required properties', () => {
    const customer = new Customer();
    customer.id = 1;
    customer.firstName = 'John';
    customer.lastName = 'Doe';
    customer.email = 'john@example.com';
    customer.password = 'hashedPassword';
    customer.phone = '1234567890';
    customer.role = Role.CUSTOMER;
    customer.address = '123 Main St';
    customer.city = 'Test City';
    customer.postalCode = '12345';
    customer.country = 'Test Country';
    customer.type = 'individual';
    customer.isActive = true;
    customer.createdAt = new Date();
    customer.updatedAt = new Date();

    expect(customer.id).toBe(1);
    expect(customer.firstName).toBe('John');
    expect(customer.lastName).toBe('Doe');
    expect(customer.email).toBe('john@example.com');
    expect(customer.password).toBe('hashedPassword');
    expect(customer.phone).toBe('1234567890');
    expect(customer.role).toBe(Role.CUSTOMER);
    expect(customer.address).toBe('123 Main St');
    expect(customer.city).toBe('Test City');
    expect(customer.postalCode).toBe('12345');
    expect(customer.country).toBe('Test Country');
    expect(customer.type).toBe('individual');
    expect(customer.isActive).toBe(true);
    expect(customer.createdAt).toBeInstanceOf(Date);
    expect(customer.updatedAt).toBeInstanceOf(Date);
  });

  it('should have default role as CUSTOMER', () => {
    const customer = new Customer();
    customer.role = Role.CUSTOMER;
    
    expect(customer.role).toBe(Role.CUSTOMER);
  });

  it('should support ADMIN role', () => {
    const customer = new Customer();
    customer.role = Role.ADMIN;
    
    expect(customer.role).toBe(Role.ADMIN);
  });

  it('should have default isActive as true', () => {
    const customer = new Customer();
    customer.isActive = true;
    
    expect(customer.isActive).toBe(true);
  });

  it('should support both individual and professional types', () => {
    const individualCustomer = new Customer();
    individualCustomer.type = 'individual';
    
    const professionalCustomer = new Customer();
    professionalCustomer.type = 'professional';
    
    expect(individualCustomer.type).toBe('individual');
    expect(professionalCustomer.type).toBe('professional');
  });
});

describe('Role Enum', () => {
  it('should have CUSTOMER role', () => {
    expect(Role.CUSTOMER).toBe('customer');
  });

  it('should have ADMIN role', () => {
    expect(Role.ADMIN).toBe('admin');
  });

  it('should have only two roles', () => {
    const roles = Object.values(Role);
    expect(roles).toHaveLength(2);
    expect(roles).toContain('customer');
    expect(roles).toContain('admin');
  });
});