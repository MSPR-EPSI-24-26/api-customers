/* eslint-disable */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../interfaces/user.interface';

export const GetUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return data ? (user as Record<string, any>)?.[data] : user;
  },
);
