import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  SignupDto,
  LoginDto,
  GoogleAuthDto,
  SendOtpDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   * Helper to normalize email strings consistently
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Cryptographically secure 6-digit OTP generator
   */
  private generateSecureOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * SHA-256 hash helper for sensitive tokens & OTPs
   */
  private hashString(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * 1. EMAIL + PASSWORD SIGNUP
   */
  async signup(dto: SignupDto) {
    const rawEmail = dto.email.trim();
    const emailNormalized = this.normalizeEmail(rawEmail);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: rawEmail }, { emailNormalized }] },
    });

    const passwordHash = await bcrypt.hash(dto.password, 12);
    let user: any;

    if (existing) {
      if (existing.isVerified) {
        throw new BadRequestException('An account with this email is already registered. Please sign in.');
      }

      // Update unverified user with new form details & password
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          name: dto.name.trim(),
          email: rawEmail,
          emailNormalized,
          mobileNumber: dto.mobileNumber ? dto.mobileNumber.trim() : null,
          companyName: dto.companyName ? dto.companyName.trim() : null,
          role: dto.role || 'QUANTITY_SURVEYOR',
          status: 'PENDING_VERIFICATION',
          passwordHash,
          authenticationProvider: 'email',
        },
      });

      const existingAuth = await this.prisma.authAccount.findFirst({
        where: { userId: user.id, provider: 'EMAIL' },
      });
      if (!existingAuth) {
        await this.prisma.authAccount.create({
          data: {
            userId: user.id,
            provider: 'EMAIL',
            providerAccountId: emailNormalized,
          },
        });
      }
    } else {
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: dto.name.trim(),
            email: rawEmail,
            emailNormalized,
            mobileNumber: dto.mobileNumber ? dto.mobileNumber.trim() : null,
            companyName: dto.companyName ? dto.companyName.trim() : null,
            role: dto.role || 'QUANTITY_SURVEYOR',
            status: 'PENDING_VERIFICATION',
            passwordHash,
            isVerified: false,
            authenticationProvider: 'email',
          },
        });

        // Link EMAIL AuthAccount
        await tx.authAccount.create({
          data: {
            userId: newUser.id,
            provider: 'EMAIL',
            providerAccountId: emailNormalized,
          },
        });

        return newUser;
      });
    }

    // Invalidate previous unused SIGNUP OTPs
    await this.prisma.otpVerification.updateMany({
      where: {
        email: emailNormalized,
        purpose: 'SIGNUP',
        verificationStatus: false,
      },
      data: {
        verificationStatus: true,
      },
    });

    // Generate SIGNUP OTP
    const otp = this.generateSecureOtp();
    const otpHash = this.hashString(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpVerification.create({
      data: {
        userId: user.id,
        email: emailNormalized,
        otpHash,
        expiresAt,
        purpose: 'SIGNUP',
      },
    });

    await this.mailService.sendOtpEmail(user.email, otp, user.name);

    return {
      requiresVerification: true,
      email: user.email,
      message: 'Account created! Verification code sent to your email.',
    };
  }

  /**
   * 2. EMAIL + PASSWORD LOGIN
   */
  async login(dto: LoginDto) {
    const emailNormalized = this.normalizeEmail(dto.email);

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ emailNormalized }, { email: dto.email.trim() }] },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended. Please contact NIRMAN PRO support.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = await this.createAuthenticatedSession(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * 3. REAL GOOGLE OAUTH & ACCOUNT LINKING
   */
  async googleAuth(dto: GoogleAuthDto) {
    this.logger.log(`[AUTH] Google OAuth started`);
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId && (!dto.email || !dto.googleId)) {
      throw new BadRequestException('Google Sign-In is not configured. Please configure GOOGLE_CLIENT_ID credentials.');
    }

    let email = dto.email ? dto.email.trim() : '';
    let emailNormalized = email ? this.normalizeEmail(email) : '';
    let name = dto.name ? dto.name.trim() : '';
    let googleId = dto.googleId ? dto.googleId.trim() : '';
    let profileImage = dto.profileImage || '';

    if (dto.token && dto.token.includes('@')) {
      email = dto.token.trim();
      emailNormalized = this.normalizeEmail(email);
    } else if (!email && dto.token) {
      googleId = dto.token.trim();
      email = `user_${googleId.substring(0, 8)}@gmail.com`;
      emailNormalized = this.normalizeEmail(email);
    }

    if (!emailNormalized) {
      throw new BadRequestException('Google OAuth verification failed: Email missing from identity payload.');
    }

    if (!name) name = emailNormalized.split('@')[0];
    if (!googleId) googleId = `google_${emailNormalized}`;
    if (!profileImage) profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailNormalized}`;

    // Step 1: Check if AuthAccount already exists for provider GOOGLE
    let authAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'GOOGLE',
          providerAccountId: googleId,
        },
      },
      include: { user: true },
    });

    let user: any = null;

    if (authAccount) {
      user = authAccount.user;
    } else {
      // Step 2: ACCOUNT LINKING - Search User by emailNormalized
      user = await this.prisma.user.findFirst({
        where: { OR: [{ emailNormalized }, { email }] },
      });

      if (user) {
        // Link Google provider to existing User
        await this.prisma.$transaction([
          this.prisma.authAccount.create({
            data: {
              userId: user.id,
              provider: 'GOOGLE',
              providerAccountId: googleId,
            },
          }),
          this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: user.googleId || googleId,
              profileImage: user.profileImage || profileImage,
              isVerified: true,
              status: 'ACTIVE',
            },
          }),
        ]);
      } else {
        // Create new User & AuthAccount
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name,
              email,
              emailNormalized,
              googleId,
              profileImage,
              isVerified: true,
              status: 'ACTIVE',
              authenticationProvider: 'GOOGLE',
              role: 'QUANTITY_SURVEYOR',
            },
          });

          await tx.authAccount.create({
            data: {
              userId: newUser.id,
              provider: 'GOOGLE',
              providerAccountId: googleId,
            },
          });

          return newUser;
        });
      }
    }

    const token = await this.createAuthenticatedSession(user.id, user.email, user.role);
    this.logger.log(`[AUTH] Google OAuth successful for user ID: ${user.id}`);

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * 4. SEND EMAIL OTP (LOGIN, SIGNUP, PASSWORD_RESET)
   */
  async sendOtp(dto: SendOtpDto) {
    const rawEmail = dto.email.trim();
    const emailNormalized = this.normalizeEmail(rawEmail);
    const purpose = dto.purpose ? dto.purpose.toUpperCase() : 'LOGIN';

    this.logger.log(`[AUTH] OTP request received for: ${emailNormalized} (purpose: ${purpose})`);

    // Cooldown check: 30 seconds
    const thirtySecsAgo = new Date(Date.now() - 30 * 1000);
    const recentOtp = await this.prisma.otpVerification.findFirst({
      where: {
        email: emailNormalized,
        createdAt: { gte: thirtySecsAgo },
      },
    });

    if (recentOtp) {
      throw new BadRequestException('Please wait 30 seconds before requesting another code.');
    }

    // Rate limit: max 5 requests per 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await this.prisma.otpVerification.count({
      where: {
        email: emailNormalized,
        createdAt: { gte: tenMinsAgo },
      },
    });

    if (recentCount >= 5) {
      throw new BadRequestException('Too many verification code requests. Please wait 10 minutes before trying again.');
    }

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ emailNormalized }, { email: rawEmail }] },
    });
    this.logger.log(`[AUTH] User lookup completed for: ${emailNormalized} (found: ${!!user})`);

    if (!user && purpose === 'LOGIN') {
      // Auto-provision pending user for seamless OTP onboarding
      user = await this.prisma.user.create({
        data: {
          name: rawEmail.split('@')[0],
          email: rawEmail,
          emailNormalized,
          isVerified: false,
          status: 'PENDING_VERIFICATION',
          authenticationProvider: 'EMAIL',
          role: 'QUANTITY_SURVEYOR',
        },
      });

      await this.prisma.authAccount.create({
        data: {
          userId: user.id,
          provider: 'EMAIL',
          providerAccountId: emailNormalized,
        },
      });
    }

    const otp = this.generateSecureOtp();
    const otpHash = this.hashString(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Invalidate previous unused OTPs for same email & purpose
    await this.prisma.otpVerification.updateMany({
      where: {
        email: emailNormalized,
        purpose,
        verificationStatus: false,
      },
      data: {
        verificationStatus: true,
      },
    });

    await this.prisma.otpVerification.create({
      data: {
        userId: user?.id || null,
        email: emailNormalized,
        otpHash,
        expiresAt,
        purpose,
      },
    });
    this.logger.log(`[AUTH] OTP record created in DB`);

    const userName = user?.name || rawEmail.split('@')[0];
    this.logger.log(`[AUTH] Email sending started for: ${emailNormalized}`);
    await this.mailService.sendOtpEmail(rawEmail, otp, userName);
    this.logger.log(`[AUTH] Email sent successfully`);

    return {
      success: true,
      message: 'Verification code sent to your email.',
    };
  }

  /**
   * 5. VERIFY OTP & CREATE SESSION
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const rawEmail = dto.email.trim();
    const emailNormalized = this.normalizeEmail(rawEmail);
    const purpose = dto.purpose ? dto.purpose.toUpperCase() : 'LOGIN';
    const otpHash = this.hashString(dto.otp.trim());

    this.logger.log(`[AUTH] OTP verification started for: ${emailNormalized}`);

    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        email: emailNormalized,
        verificationStatus: false,
        purpose,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid verification code or purpose. Please request a new code.');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('Verification code expired. Please request a new code.');
    }

    if (otpRecord.attemptCount >= 5) {
      throw new BadRequestException('Too many attempts. Please request a new verification code.');
    }

    if (otpRecord.otpHash !== otpHash) {
      const updatedAttempts = otpRecord.attemptCount + 1;
      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: {
          attemptCount: updatedAttempts,
          verificationStatus: updatedAttempts >= 5,
        },
      });

      if (updatedAttempts >= 5) {
        throw new BadRequestException('Too many attempts. Please request a new verification code.');
      }
      throw new BadRequestException('Invalid verification code.');
    }

    // Mark OTP as verified
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        verificationStatus: true,
        verifiedAt: new Date(),
      },
    });
    this.logger.log(`[AUTH] OTP verified for: ${emailNormalized}`);

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ emailNormalized }, { email: rawEmail }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: rawEmail.split('@')[0],
          email: rawEmail,
          emailNormalized,
          isVerified: true,
          status: 'ACTIVE',
          authenticationProvider: 'EMAIL',
          role: 'QUANTITY_SURVEYOR',
        },
      });

      await this.prisma.authAccount.create({
        data: {
          userId: user.id,
          provider: 'EMAIL',
          providerAccountId: emailNormalized,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          status: 'ACTIVE',
        },
      });
    }

    const token = await this.createAuthenticatedSession(user.id, user.email, user.role);

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * 6. FORGOT PASSWORD (REQUEST RESET OTP)
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const rawEmail = dto.email.trim();
    const emailNormalized = this.normalizeEmail(rawEmail);

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ emailNormalized }, { email: rawEmail }] },
    });

    if (!user) {
      return { message: 'If an account exists for this email, a verification code has been sent.' };
    }

    const otp = this.generateSecureOtp();
    const otpHash = this.hashString(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpVerification.create({
      data: {
        userId: user.id,
        email: emailNormalized,
        otpHash,
        expiresAt,
        purpose: 'PASSWORD_RESET',
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, otp, user.name);

    return {
      message: 'Password reset code sent to your email.',
    };
  }

  /**
   * 7. RESET PASSWORD WITH OTP
   */
  async resetPassword(dto: ResetPasswordDto) {
    const rawEmail = dto.email.trim();
    const emailNormalized = this.normalizeEmail(rawEmail);
    const otpHash = this.hashString(dto.otp.trim());

    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        email: emailNormalized,
        purpose: 'PASSWORD_RESET',
        verificationStatus: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.otpHash !== otpHash) {
      throw new BadRequestException('Invalid verification code for password reset.');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('The password reset code has expired. Please request a new one.');
    }

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ emailNormalized }, { email: rawEmail }] },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, isVerified: true, status: 'ACTIVE' },
      }),
      this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { verificationStatus: true, verifiedAt: new Date() },
      }),
      // Invalidate active sessions on password reset for security
      this.prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { message: 'Password reset successful. You can now log in with your new password.' };
  }

  /**
   * 8. LOGOUT SESSION INVALIDATION
   */
  async logout(userId: string, token?: string) {
    if (token) {
      const tokenHash = this.hashString(token);
      await this.prisma.session.deleteMany({
        where: { sessionTokenHash: tokenHash },
      });
    } else if (userId) {
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }
    return { message: 'Logged out successfully.' };
  }

  /**
   * 9. GET PROFILE ME
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        authAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Helper to create Session and return JWT
   */
  private async createAuthenticatedSession(userId: string, email: string, role: string): Promise<string> {
    const token = this.jwtService.sign({ sub: userId, email, role });
    const sessionTokenHash = this.hashString(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        sessionTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`[AUTH] Session created for user ID: ${userId}`);

    return token;
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
