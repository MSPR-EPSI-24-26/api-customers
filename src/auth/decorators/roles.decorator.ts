import { SetMetadata } from '@nestjs/common';
import { Role } from '../../customers/entities/customer.entity';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
