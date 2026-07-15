import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { UserRole } from '../../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  rememberMe?: boolean;
  purpose?: 'password_reset';
};

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

    const rememberMe = Boolean(dto.rememberMe);
    const tokens = await this.signTokens(user.id, user.email, user.role, rememberMe);
    this.setAuthCookies(response, tokens, user.role, rememberMe);
    await this.usersService.touchLastLogin(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
    };
  }

  logout(response: Response) {
    this.clearAuthCookies(response);
    return { message: 'Logged out successfully' };
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.sg_refresh_token;
    if (!refreshToken) {
      this.clearAuthCookies(response);
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: AuthTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          'dev-refresh-secret',
      });
    } catch {
      this.clearAuthCookies(response);
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      this.clearAuthCookies(response);
      throw new UnauthorizedException('This user account is inactive');
    }

    const tokens = await this.signTokens(user.id, user.email, user.role, Boolean(payload.rememberMe));
    this.setAuthCookies(response, tokens, user.role, Boolean(payload.rememberMe));

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const response = {
      message:
        'If an account exists for this email, password reset instructions will be sent shortly.',
    };

    if (!user || !user.isActive) return response;

    const resetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        purpose: 'password_reset',
      } satisfies AuthTokenPayload,
      {
        secret: this.getResetSecret(),
        expiresIn: (this.configService.get<string>('JWT_RESET_EXPIRES_IN') ??
          '15m') as JwtSignOptions['expiresIn'],
      },
    );

    if (this.configService.get('NODE_ENV') !== 'production') {
      return { ...response, resetToken };
    }

    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: AuthTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(dto.token, {
        secret: this.getResetSecret(),
      });
    } catch {
      throw new BadRequestException('Password reset token is invalid or expired');
    }

    if (payload.purpose !== 'password_reset') {
      throw new BadRequestException('Password reset token is invalid');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new BadRequestException('Password reset token is invalid');
    }

    await this.usersService.updatePassword(user.id, dto.password);
    return { message: 'Password has been reset successfully.' };
  }

  private async signTokens(userId: string, email: string, role: UserRole, rememberMe = true) {
    const payload = { sub: userId, email, role, rememberMe };
    const accessExpiresIn = (this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
    ) ?? '15m') as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = (rememberMe
      ? (this.configService.get<string>('JWT_REMEMBER_EXPIRES_IN') ?? '30d')
      : (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d')) as JwtSignOptions['expiresIn'];

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

  private setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
    role: UserRole,
    rememberMe = true,
  ) {
    const secure = this.configService.get('NODE_ENV') === 'production';
    const domain = this.cookieDomain();
    const persistentCookie = rememberMe ? { maxAge: 1000 * 60 * 60 * 24 * 30 } : {};
    const accessCookie = rememberMe ? { maxAge: 1000 * 60 * 15 } : {};
    response.cookie('sg_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      ...(domain ? { domain } : {}),
      ...persistentCookie,
    });
    response.cookie('sg_access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      ...(domain ? { domain } : {}),
      ...accessCookie,
    });
    response.cookie('sg_user_role', role, {
      httpOnly: false,
      sameSite: 'lax',
      secure,
      ...(domain ? { domain } : {}),
      ...persistentCookie,
    });
  }

  private clearAuthCookies(response: Response) {
    const secure = this.configService.get('NODE_ENV') === 'production';
    const baseOptions = {
      path: '/',
      sameSite: 'lax' as const,
      secure,
    };
    const domain = this.cookieDomain();
    for (const name of ['sg_refresh_token', 'sg_access_token', 'sg_user_role']) {
      response.clearCookie(name, baseOptions);
      if (domain) {
        response.clearCookie(name, { ...baseOptions, domain });
      }
    }
  }

  private cookieDomain() {
    const domain = this.configService.get<string>('COOKIE_DOMAIN')?.trim();
    if (!domain || domain === 'localhost') return undefined;
    return domain;
  }

  private getResetSecret() {
    return (
      this.configService.get<string>('JWT_RESET_SECRET') ??
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'dev-reset-secret'
    );
  }

  private sanitizeUser<T extends { password?: string }>(user: T) {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}
