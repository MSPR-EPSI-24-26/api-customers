import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './interfaces/user.interface';
import { Role } from '../customers/entities/customer.entity';

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: User) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateToken(@GetUser() user: User) {
    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Post('validate-permission')
  @HttpCode(HttpStatus.OK)
  async validatePermission(
    @Body() body: { token: string; requiredRole?: string },
  ) {
    try {
      // Verify the token without using guards
      const decoded = this.authService.verifyToken(body.token) as DecodedToken;
      const isValid = await this.authService.validatePermission(
        Number(decoded.sub),
        body.requiredRole as Role,
      );

      return {
        valid: isValid,
        user: isValid
          ? {
              id: decoded.sub,
              email: decoded.email,
              role: decoded.role,
            }
          : null,
      };
    } catch {
      return {
        valid: false,
        user: null,
        error: 'Invalid token',
      };
    }
  }
}
