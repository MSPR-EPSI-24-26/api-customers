import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Role } from './entities/customer.entity';

describe('CustomerController', () => {
  let controller: CustomerController;
  let customerService: jest.Mocked<CustomerService>;

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

  const mockUser = {
    id: 1,
    email: 'john@example.com',
    role: Role.CUSTOMER,
  };

  beforeEach(async () => {
    const mockCustomerService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    customerService = module.get(CustomerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of customers', async () => {
      const expectedCustomers = [mockCustomer];
      customerService.findAll.mockResolvedValue(expectedCustomers);

      const result = await controller.findAll();

      expect(result).toEqual(expectedCustomers);
      expect(customerService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no customers exist', async () => {
      customerService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      customerService.findOne.mockResolvedValue(mockCustomer);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockCustomer);
      expect(customerService.findOne).toHaveBeenCalledWith(1);
    });

    it('should handle user not found', async () => {
      customerService.findOne.mockRejectedValue(new NotFoundException('Customer with ID 1 not found'));

      await expect(controller.getProfile(mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      customerService.findOne.mockResolvedValue(mockCustomer);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockCustomer);
      expect(customerService.findOne).toHaveBeenCalledWith(1);
    });

    it('should handle customer not found', async () => {
      customerService.findOne.mockRejectedValue(new NotFoundException('Customer with ID 999 not found'));

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createCustomerDto: CreateCustomerDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: 'password123',
      phone: '9876543210',
      address: '456 Oak St',
      city: 'New City',
      postalCode: '54321',
      country: 'New Country',
      type: 'professional',
      role: Role.CUSTOMER,
    };

    it('should create a new customer', async () => {
      const createdCustomer = { ...mockCustomer, ...createCustomerDto, id: 2, password: 'hashedPassword' };
      customerService.create.mockResolvedValue(createdCustomer);

      const result = await controller.create(createCustomerDto);

      expect(result).toEqual(createdCustomer);
      expect(customerService.create).toHaveBeenCalledWith(createCustomerDto);
    });

    it('should handle creation errors', async () => {
      customerService.create.mockRejectedValue(new Error('Email already exists'));

      await expect(controller.create(createCustomerDto)).rejects.toThrow('Email already exists');
    });
  });

  describe('updateProfile', () => {
    const updateCustomerDto: UpdateCustomerDto = {
      firstName: 'Johnny',
      phone: '5555555555',
    };

    it('should update current user profile', async () => {
      const updatedCustomer = { ...mockCustomer, ...updateCustomerDto, password: 'hashedPassword' };
      customerService.update.mockResolvedValue(updatedCustomer);

      const result = await controller.updateProfile(mockUser, updateCustomerDto);

      expect(result).toEqual(updatedCustomer);
      expect(customerService.update).toHaveBeenCalledWith(1, updateCustomerDto);
    });

    it('should handle update errors', async () => {
      customerService.update.mockRejectedValue(new NotFoundException('Customer with ID 1 not found'));

      await expect(controller.updateProfile(mockUser, updateCustomerDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateCustomerDto: UpdateCustomerDto = {
      firstName: 'Johnny',
      email: 'johnny@example.com',
    };

    it('should update a customer by id', async () => {
      const updatedCustomer = { ...mockCustomer, ...updateCustomerDto, password: 'hashedPassword' };
      customerService.update.mockResolvedValue(updatedCustomer);

      const result = await controller.update(1, updateCustomerDto);

      expect(result).toEqual(updatedCustomer);
      expect(customerService.update).toHaveBeenCalledWith(1, updateCustomerDto);
    });

    it('should handle customer not found during update', async () => {
      customerService.update.mockRejectedValue(new NotFoundException('Customer with ID 999 not found'));

      await expect(controller.update(999, updateCustomerDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a customer by id', async () => {
      customerService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(result).toBeUndefined();
      expect(customerService.remove).toHaveBeenCalledWith(1);
    });

    it('should handle customer not found during removal', async () => {
      customerService.remove.mockRejectedValue(new NotFoundException('Customer with ID 999 not found'));

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});