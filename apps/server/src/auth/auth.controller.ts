import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-verification-email')
  @ApiOperation({ summary: 'Send verification email to a user' })
  sendVerificationEmail(@Body('email') email: string) {
    return this.authService.sendVerificationEmail(email);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify a user email using token' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user after email verification' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
