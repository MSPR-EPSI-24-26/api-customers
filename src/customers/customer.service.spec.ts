import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CustomerService } from './customer.service';
import { Customer, Role } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: jest.Mocked<Repository<Customer>>;

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

  const mockCustomerWithoutPassword = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: '',
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
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get(getRepositoryToken(Customer));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of customers', async () => {
      const expectedCustomers = [mockCustomerWithoutPassword];
      customerRepository.find.mockResolvedValue(expectedCustomers);

      const result = await service.findAll();

      expect(result).toEqual(expectedCustomers);
      expect(customerRepository.find).toHaveBeenCalledWith({
        select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'address', 'city', 'postalCode', 'country', 'type', 'isActive', 'createdAt', 'updatedAt'],
      });
    });

    it('should return empty array when no customers exist', async () => {
      customerRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a customer when found', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomerWithoutPassword);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCustomerWithoutPassword);
      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'address', 'city', 'postalCode', 'country', 'type', 'isActive', 'createdAt', 'updatedAt'],
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Customer with ID 999 not found')
      );
    });
  });

  describe('create', () => {
    const createCustomerDto: CreateCustomerDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Main St',
      city: 'Test City',
      postalCode: '12345',
      country: 'Test Country',
      type: 'individual',
      role: Role.CUSTOMER,
    };

    it('should create a customer with hashed password', async () => {
      const hashedPassword = 'hashedPassword123';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      customerRepository.create.mockReturnValue({ ...mockCustomer, password: hashedPassword });
      customerRepository.save.mockResolvedValue({ ...mockCustomer, password: hashedPassword });

      const result = await service.create(createCustomerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(customerRepository.create).toHaveBeenCalledWith({
        ...createCustomerDto,
        password: hashedPassword,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual(expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }));
    });

    it('should create a customer without password when not provided', async () => {
      const dtoWithoutPassword = { ...createCustomerDto };
      delete dtoWithoutPassword.password;

      customerRepository.create.mockReturnValue(mockCustomerWithoutPassword);
      customerRepository.save.mockResolvedValue(mockCustomerWithoutPassword);

      const result = await service.create(dtoWithoutPassword);

      expect(customerRepository.create).toHaveBeenCalledWith({
        ...dtoWithoutPassword,
        password: undefined,
      });
      expect(result).toEqual(expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }));
    });
  });

  describe('update', () => {
    const updateCustomerDto: UpdateCustomerDto = {
      firstName: 'Jane',
      email: 'jane@example.com',
    };

    it('should update a customer successfully', async () => {
      const updatedCustomer = { ...mockCustomerWithoutPassword, firstName: 'Jane', email: 'jane@example.com' };
      
      customerRepository.findOne.mockResolvedValueOnce(mockCustomerWithoutPassword);
      customerRepository.update.mockResolvedValue({ affected: 1 } as any);
      customerRepository.findOne.mockResolvedValueOnce(updatedCustomer);

      const result = await service.update(1, updateCustomerDto);

      expect(customerRepository.update).toHaveBeenCalledWith(1, updateCustomerDto);
      expect(result).toEqual(updatedCustomer);
    });

    it('should hash password when updating password', async () => {
      const updateWithPassword = { ...updateCustomerDto, password: 'newPassword123' };
      const hashedPassword = 'hashedNewPassword';
      
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      customerRepository.findOne.mockResolvedValue(mockCustomerWithoutPassword);
      customerRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.update(1, updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(customerRepository.update).toHaveBeenCalledWith(1, {
        ...updateWithPassword,
        password: hashedPassword,
      });
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateCustomerDto)).rejects.toThrow(
        new NotFoundException('Customer with ID 999 not found')
      );
    });
  });

  describe('remove', () => {
    it('should remove a customer successfully', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomerWithoutPassword);
      customerRepository.remove.mockResolvedValue(mockCustomerWithoutPassword);

      await service.remove(1);

      expect(customerRepository.remove).toHaveBeenCalledWith(mockCustomerWithoutPassword);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Customer with ID 999 not found')
      );
    });
  });

  describe('findByEmail', () => {
    it('should return customer when found by email', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findByEmail('john@example.com');

      expect(result).toEqual(mockCustomer);
      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });

    it('should return null when customer not found by email', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});