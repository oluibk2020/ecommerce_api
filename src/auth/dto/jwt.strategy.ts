import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '../jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtUser } from './jwt-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      secretOrKey: String(configService.get<string>('jwt.secret')), //should be in env file
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    const { email } = payload;
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.mapUserToJwtUser(user);
  }

  private async findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        isManager: true,
        isAdmin: true,
      },
    });
  }

  private mapUserToJwtUser(user: any): JwtUser {
    return {
      sub : user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      isManager: user.isManager,
      isAdmin: user.isAdmin,
    };
  }
}
