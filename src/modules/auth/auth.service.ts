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

    const tokens = await this.signTokens(user.id, user.email, user.role);
    this.setAuthCookies(response, tokens, user.role);
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

    const tokens = await this.signTokens(user.id, user.email, user.role);
    this.setAuthCookies(response, tokens, user.role);

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

  private setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
    role: UserRole,
  ) {
    const secure = this.configService.get('NODE_ENV') === 'production';
    response.cookie('sg_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    response.cookie('sg_access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: 1000 * 60 * 15,
    });
    response.cookie('sg_user_role', role, {
      httpOnly: false,
      sameSite: 'lax',
      secure,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('sg_refresh_token');
    response.clearCookie('sg_access_token');
    response.clearCookie('sg_user_role');
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
