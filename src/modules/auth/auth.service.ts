import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { UserRole } from '../../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      ...dto,
      role: UserRole.Student,
    });

    return this.sanitizeUser(user);
  }

  async login(dto: LoginDto, response: Response) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This user account is inactive');
    }

    const tokens = await this.signTokens(user.id, user.email, user.role);
    response.cookie('sg_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    response.cookie('sg_access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: 1000 * 60 * 15,
    });
    response.cookie('sg_user_role', user.role, {
      httpOnly: false,
      sameSite: 'lax',
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    await this.usersService.touchLastLogin(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
    };
  }

  logout(response: Response) {
    response.clearCookie('sg_refresh_token');
    response.clearCookie('sg_access_token');
    response.clearCookie('sg_user_role');
    return { message: 'Logged out successfully' };
  }

  private async signTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    const accessExpiresIn = (this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
    ) ?? '15m') as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = (this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) ?? '7d') as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ??
          'dev-access-secret',
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          'dev-refresh-secret',
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser<T extends { password?: string }>(user: T) {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}
