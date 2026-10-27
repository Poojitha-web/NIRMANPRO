import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'nirmanpro-secret-jwt-key'),
    });
  }

  async validate(payload: { sub: string; email: string; role?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User session expired or invalid user');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mobileNumber: user.mobileNumber,
      companyName: user.companyName,
      isVerified: user.isVerified,
    };
  }
}
