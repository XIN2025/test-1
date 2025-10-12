import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/user.decorator';
import { RequestUser } from './dto/request-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Send verification email
  @Post('send-verification-email')
  @ApiOperation({ summary: 'Send verification email to user' })
  sendVerificationEmail(@Body('email') email: string) {
    return this.authService.sendVerificationEmail(email);
  }

  // Verify email from token
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email from token' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // Register user after verification (set password + name)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (after email verification)' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  // Login existing user
  @Post('login')
  @ApiOperation({ summary: 'Login using email and password' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  // Get the current authenticated user
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch current authenticated user' })
  getCurrentUser(@CurrentUser() user: RequestUser) {
    return this.authService.getCurrentUser(user);
  }
}
