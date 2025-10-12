import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestUser } from './dto/request-user.dto';
import { config } from 'src/common/config';
import { MailService } from 'src/mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { UpdateProfileDto } from './dto/update-profile.dto';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService
  ) {}

  // Send verification email when user enters email
  async sendVerificationEmail(email: string) {
    const normalizedEmail = email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && existing.isVerified) {
      throw new BadRequestException('Email already registered and verified');
    }

    const token = uuidv4();
    if (existing) {
      await this.prisma.user.update({
        where: { email: normalizedEmail },
        data: { emailVerificationToken: token },
      });
    } else {
      await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: 'Pending Verification', // placeholder
          password: 'temporary', // placeholder
          emailVerificationToken: token,
          isVerified: false,
        },
      });
    }

    const verifyUrl = `${config.urls.frontend}/verify?token=${token}`;

    await this.mailService.sendTemplateMail({
      to: normalizedEmail,
      subject: 'Verify your email - Karmi',
      templateName: 'VERIFY_EMAIL',
      context: {
        verificationLink: verifyUrl,
      },
    });

    this.logger.log(`Verification email sent to ${normalizedEmail}`);
    return { message: 'Verification email sent successfully' };
  }

  // Verify user email from token
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null,
      },
    });

    this.logger.log(`Email verified for user ${user.email}`);
    return { message: 'Email verified successfully' };
  }

  // Set password after verification
  async register(input: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!existingUser) {
      throw new BadRequestException('Email not found. Please verify first.');
    }

    if (!existingUser.isVerified) {
      throw new BadRequestException('Email not verified yet.');
    }

    if (existingUser.password) {
      throw new BadRequestException('Password already set. Please log in.');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.update({
      where: { email: input.email.toLowerCase() },
      data: {
        name: input.name,
        password: hashedPassword,
      },
    });

    return { id: user.id, email: user.email, name: user.name };
  }

  // Login existing user
  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(input.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: RequestUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      sub: user.id,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: config.jwt.secret,
      expiresIn: config.jwt.expiresIn ?? '10d',
    });

    return { ...payload, token };
  }

  // Get current user info
  async updateProfile(user: RequestUser, input: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    if (!existingUser.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.dateOfBirth && { dateOfBirth: new Date(input.dateOfBirth) }),
        ...(input.timeOfBirth && { timeOfBirth: input.timeOfBirth }),
        ...(input.placeOfBirth && { placeOfBirth: input.placeOfBirth.trim() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        updatedAt: true,
      },
    });
    this.logger.log(`Profile updated for user ${user.email}`);
    return updated;
  }

  // Get current user info
  async getCurrentUser(user: RequestUser) {
    const userData = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      throw new BadRequestException('User not found');
    }

    return userData;
  }
}
