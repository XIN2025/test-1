import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterEmailDto, SetPasswordDto } from './dto/register.dto';
import { config } from 'src/common/config';
import { MailService } from 'src/mail/mail.service';
import { emailVerifyEmailTemplate } from 'src/mail/templates/verify-email-template';
import { AuthProvider } from '@repo/db';
import * as bcrypt from 'bcrypt';
import { Auth, google } from 'googleapis';
import { LoginEmailDto, LoginGoogleDto } from './dto/login.dto';
import { RequestUser } from './dto/request-user.dto';
import { v7 as uuid7 } from 'uuid';

@Injectable()
export class AuthService {
  private oauth2Client: Auth.OAuth2Client;
  private saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.callbackUrl
    );
  }

  private async generatePasswordResetData() {
    const passwordResetToken = uuid7();
    const passwordResetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const passwordResetLink = `${config.urls.frontend}/auth/set-password?token=${encodeURIComponent(passwordResetToken)}`;
    return {
      passwordResetToken,
      passwordResetTokenExpiresAt,
      passwordResetLink,
    };
  }

  private async generateVerificationData() {
    const verificationToken = uuid7();
    const verificationTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const verificationLink = `${config.urls.frontend}/auth/verify?token=${encodeURIComponent(verificationToken)}`;
    return {
      verificationToken,
      verificationTokenExpiresAt,
      verificationLink,
    };
  }

  async loginEmail(loginEmailDto: LoginEmailDto) {
    const { email, password } = loginEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        auth: true,
      },
    });

    if (!user || !user.auth?.password) throw new UnauthorizedException('Invalid credentials');

    const isPassValid = await bcrypt.compare(password, user.auth.password);
    if (!isPassValid) throw new UnauthorizedException('Invalid credentials');

    const jwtPayload: RequestUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      sub: user.id,
    };

    const token = await this.jwtService.signAsync(jwtPayload, {
      secret: config.jwt.secret,
      expiresIn: config.jwt.expiresIn,
    });

    return { ...jwtPayload, token };
  }

  async loginGoogle(loginGoogleDto: LoginGoogleDto) {
    const { idToken } = loginGoogleDto;
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Invalid google id token');
    }
    const { email, sub: googleId, given_name, family_name } = payload;

    if (!email) {
      throw new UnauthorizedException('Invalid google id token');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        auth: true,
      },
    });

    const isPasswordSet = user?.auth?.password;
    const isVerified = user?.auth?.isVerified;
    const { passwordResetToken, passwordResetTokenExpiresAt } = await this.generatePasswordResetData();

    const tempName = `${given_name} ${family_name}`;

    const newUser = await this.prisma.user.upsert({
      where: {
        email,
      },
      create: {
        email,
        name: tempName,
        auth: {
          create: {
            provider: AuthProvider.GOOGLE,
            verificationToken: googleId,
            isVerified: true,
            verifiedAt: new Date(),
            ...(!isPasswordSet && { passwordResetToken, passwordResetTokenExpiresAt }),
          },
        },
      },
      update: {
        auth: {
          update: {
            data: {
              provider: AuthProvider.GOOGLE,
              verificationToken: googleId,
              isVerified: true,
              ...(!isVerified && { verifiedAt: new Date() }),
              ...(!isPasswordSet && { passwordResetToken, passwordResetTokenExpiresAt }),
            },
          },
        },
      },
    });

    const jwtPayload: RequestUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      sub: newUser.id,
    };

    const token = await this.jwtService.signAsync(jwtPayload, {
      secret: config.jwt.secret,
      expiresIn: config.jwt.expiresIn,
    });

    return { ...jwtPayload, token };
  }

  async registerEmail(registerEmailDto: RegisterEmailDto) {
    const { email } = registerEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        auth: true,
      },
    });

    if (user && user.auth?.isVerified && user.auth.password) {
      throw new BadRequestException('User already registered');
    }

    // If not verified then either new user or existing user
    const { verificationToken, verificationTokenExpiresAt, verificationLink } = await this.generateVerificationData();
    const { passwordResetToken, passwordResetTokenExpiresAt } = await this.generatePasswordResetData();
    const tempName = email.split('@')[0];

    await this.prisma.user.upsert({
      where: {
        email,
      },
      create: {
        email,
        name: tempName,
        auth: {
          create: {
            provider: AuthProvider.EMAIL,
            verificationToken,
            verificationTokenExpiresAt,
            passwordResetToken,
            passwordResetTokenExpiresAt,
            isVerified: false,
          },
        },
      },
      update: {
        auth: {
          update: {
            data: {
              provider: AuthProvider.EMAIL,
              verificationToken,
              verificationTokenExpiresAt,
              passwordResetToken,
              passwordResetTokenExpiresAt,
              isVerified: false,
            },
          },
        },
      },
    });

    this.mailService.sendMail({
      html: emailVerifyEmailTemplate({ verificationLink }),
      subject: 'Karmi - Email Verification',
      to: email,
    });

    return { message: 'Verification link sent successfully' };
  }

  async setPassword(setPasswordDto: SetPasswordDto) {
    const { password, confirmPassword, token } = setPasswordDto;

    if (password !== confirmPassword) throw new BadRequestException('Passwords do not match');

    const userAuth = await this.prisma.userAuth.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!userAuth) throw new BadRequestException('Invalid request. Either user not found or token is expired.');

    if (!userAuth.isVerified) throw new BadRequestException('Please verify your email before setting a password');

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    await this.prisma.userAuth.update({
      where: { id: userAuth.id },
      data: {
        password: hashedPassword,
        passwordResetTokenExpiresAt: new Date(),
      },
    });

    return { message: 'Password set successfully' };
  }

  async verifyEmail(token: string) {
    const userAuth = await this.prisma.userAuth.findFirst({
      where: { verificationToken: token, verificationTokenExpiresAt: { gt: new Date() } },
    });

    if (!userAuth) throw new BadRequestException('Invalid verification token');

    if (userAuth.isVerified) throw new BadRequestException('Email already verified');

    const { passwordResetToken, passwordResetTokenExpiresAt } = await this.generatePasswordResetData();

    const updatedUserAuth = await this.prisma.userAuth.update({
      where: { id: userAuth.id },
      data: { isVerified: true, verifiedAt: new Date(), passwordResetToken, passwordResetTokenExpiresAt },
    });

    let redirectUrl: string | null = null;
    if (!updatedUserAuth.password) {
      redirectUrl = `${config.urls.frontend}/auth/set-password?token=${encodeURIComponent(passwordResetToken)}`;
    }

    return { redirectUrl };
  }

  async checkPasswordResetStatus(passwordResetToken: string) {
    if (!passwordResetToken) throw new UnauthorizedException('Invalid token');
    const userAuth = await this.prisma.userAuth.findFirst({
      where: { passwordResetToken, passwordResetTokenExpiresAt: { gt: new Date() } },
    });
    if (!userAuth) throw new BadRequestException('Not allowed to set password');
    return true;
  }

  async me(user: RequestUser) {
    const userData = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        auth: true,
        profile: true,
      },
    });

    if (!userData) {
      throw new UnauthorizedException('User not found');
    }

    let redirectUrl: string | null = null;
    if (userData && !userData?.auth?.password && userData?.auth?.isVerified) {
      if (userData.auth.passwordResetTokenExpiresAt && userData.auth.passwordResetTokenExpiresAt < new Date()) {
        const { passwordResetToken, passwordResetTokenExpiresAt, passwordResetLink } =
          await this.generatePasswordResetData();
        await this.prisma.userAuth.update({
          where: { id: userData.auth.id },
          data: { passwordResetToken, passwordResetTokenExpiresAt },
        });
        redirectUrl = passwordResetLink;
      }
      redirectUrl = `${config.urls.frontend}/auth/set-password?token=${encodeURIComponent(userData.auth.passwordResetToken ?? '')}`;
    } else if (userData && !userData?.profile) {
      redirectUrl = `${config.urls.frontend}/auth/complete-profile`;
    }

    return {
      id: userData?.id,
      email: userData?.email,
      name: userData?.name,
      horoscopeDetails: userData?.profile?.horoscopeDetails,
      gender: userData?.profile?.gender,
      dateOfBirth: userData?.profile?.dateOfBirth,
      timeOfBirth: userData?.profile?.timeOfBirth,
      placeOfBirth: userData?.profile?.placeOfBirth,
      redirectUrl,
    };
  }
}
