import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '../jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtUser } from './jwt-user.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      secretOrKey: String(configService.get<string>('jwt.secret')), //should be in env file
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    const { email } = payload;

    //get session from cache
    const session = await this.cacheManager.get(`sessionEmail:${email}`);

    if (!session) throw new UnauthorizedException();

    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.mapUserToJwtUser(user);
  }

  private mapUserToJwtUser(user: any): JwtUser {
    return {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      isManager: user.isManager,
      isAdmin: user.isAdmin,
    };
  }
}
