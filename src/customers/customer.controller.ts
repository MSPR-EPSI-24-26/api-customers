import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Put,
  Delete, 
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { MetricsService } from '../metrics/metrics.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from './entities/customer.entity';

@Controller("customers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.customerService.findAll();
  }

  @Get('me')
  getProfile(@GetUser() user: any) {
    return this.customerService.findOne(user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Patch('me')
  updateProfile(@GetUser() user: any, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(user.id, updateCustomerDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.remove(id);
  }
}
