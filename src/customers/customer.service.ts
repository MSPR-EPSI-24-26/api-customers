import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'role',
        'address',
        'city',
        'postalCode',
        'country',
        'type',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'role',
        'address',
        'city',
        'postalCode',
        'country',
        'type',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Hash password if provided
    let hashedPassword: string | undefined;
    if (createCustomerDto.password) {
      hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      password: hashedPassword,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...customerWithoutPassword } = savedCustomer;
    return customerWithoutPassword as Customer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    // Verify customer exists
    await this.findOne(id);

    // Hash password if provided
    if (updateCustomerDto.password) {
      updateCustomerDto.password = await bcrypt.hash(
        updateCustomerDto.password,
        10,
      );
    }

    await this.customerRepository.update(id, updateCustomerDto);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { email } });
  }
}
