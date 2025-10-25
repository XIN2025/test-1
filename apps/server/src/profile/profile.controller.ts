import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateProfileDto } from './dto/create-update-profile.dto';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';

@ApiTags('Profile')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create user profile' })
  createProfile(@Body() body: CreateProfileDto, @CurrentUser() user: RequestUser) {
    return this.profileService.saveProfileDetails(body, user.id);
  }

  @Get('karmi-points')
  @ApiOperation({ summary: 'Get user karmi points' })
  getKarmiPoints(@CurrentUser() user: RequestUser) {
    return this.profileService.getKarmiPoints(user.id);
  }
}
