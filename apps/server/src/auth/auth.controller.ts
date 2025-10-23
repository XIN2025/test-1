import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterEmailDto, SetPasswordDto } from './dto/register.dto';
import { LoginEmailDto, LoginGoogleDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/user.decorator';
import { RequestUser } from './dto/request-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/email')
  @ApiOperation({ summary: 'Login via email and password' })
  loginEmail(@Body() body: LoginEmailDto) {
    return this.authService.loginEmail(body);
  }

  @Post('login/google')
  @ApiOperation({ summary: 'Login via google' })
  loginGoogle(@Body() body: LoginGoogleDto) {
    return this.authService.loginGoogle(body);
  }

  @Post('register/email')
  @ApiOperation({ summary: 'Register email' })
  registerEmail(@Body() body: RegisterEmailDto) {
    return this.authService.registerEmail(body);
  }

  @Post('set/password')
  @ApiOperation({ summary: 'Set a new password using token' })
  registerPassword(@Body() body: SetPasswordDto) {
    return this.authService.setPassword(body);
  }

  @Get('verify/email')
  @ApiOperation({ summary: 'Verify email' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('set/password/status')
  @ApiOperation({ summary: 'Check password reset status' })
  checkPasswordResetStatus(@Query('token') token: string) {
    return this.authService.checkPasswordResetStatus(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user);
  }
}
