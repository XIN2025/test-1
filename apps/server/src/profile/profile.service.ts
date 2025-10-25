import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProfileDto } from './dto/create-update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async saveProfileDetails(createProfileDto: CreateProfileDto, userId: string) {
    const { dateOfBirth, timeOfBirth, placeOfBirth, gender, name } = createProfileDto;

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        dateOfBirth: new Date(dateOfBirth),
        gender,
        placeOfBirth,
        timeOfBirth,
      },
      create: {
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

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });
    return profile;
  }

  async deleteUserProfile(userId: string) {
    await this.prisma.userProfile.delete({
      where: { userId },
    });
    await this.prisma.user.delete({
      where: { id: userId },
    });
    return { message: 'User profile deleted successfully' };
  }
}
