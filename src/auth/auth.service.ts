import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer, Role } from '../customers/entities/customer.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string; customer: Omit<Customer, 'password'> }> {
    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingCustomer) {
      throw new UnauthorizedException('Customer with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create customer
    const customer = this.customerRepository.create({
      ...registerDto,
      password: hashedPassword,
      role: registerDto.role || Role.CUSTOMER,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Generate JWT token
    const payload = { sub: savedCustomer.id, email: savedCustomer.email, role: savedCustomer.role };
    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    const { password, ...customerWithoutPassword } = savedCustomer;

    return {
      access_token,
      customer: customerWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; customer: Omit<Customer, 'password'> }> {
    // Find customer by email
    const customer = await this.customerRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, customer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if customer is active
    if (!customer.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate JWT token
    const payload = { sub: customer.id, email: customer.email, role: customer.role };
    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    const { password, ...customerWithoutPassword } = customer;

    return {
      access_token,
      customer: customerWithoutPassword,
    };
  }

  async validateCustomer(id: number): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async validatePermission(customerId: number, requiredRole?: Role): Promise<boolean> {
    const customer = await this.validateCustomer(customerId);
    
    if (!customer) {
      return false;
    }

    // If no specific role required, just check if customer exists and is active
    if (!requiredRole) {
      return true;
    }

    // Admin can access everything
    if (customer.role === Role.ADMIN) {
      return true;
    }

    // Check if customer has required role
    return customer.role === requiredRole;
  }

  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}