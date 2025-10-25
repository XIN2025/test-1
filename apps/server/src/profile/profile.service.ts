import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AstrologyApiService } from 'src/astrology-apis/astrology-api.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProfileDto } from './dto/create-update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async saveProfileDetails(createProfileDto: CreateProfileDto, userId: string) {
    const { dateOfBirth, timeOfBirth, placeOfBirth, gender, name } = createProfileDto;

    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Profile already exists');
    }

    const profile = await this.prisma.userProfile.create({
      data: {
        dateOfBirth: new Date(dateOfBirth),
        gender,
        placeOfBirth,
        timeOfBirth,
        userId,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name,
      },
    });

    return profile;
  }

  async getKarmiPoints(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    return { karmiPoints: profile?.karmiPoints };
  }
}
