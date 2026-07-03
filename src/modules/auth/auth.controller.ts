import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(dto, response);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  @Post('refresh')
  refresh() {
    return { message: 'Refresh token rotation will be implemented in the next auth hardening pass' };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword() {
    return { message: 'Password reset confirmation flow is queued for the email integration phase' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: Request) {
    return request.user;
  }
}
