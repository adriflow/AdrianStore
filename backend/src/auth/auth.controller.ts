import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './auth.guard';

const isProduction = process.env.NODE_ENV === 'production';
const loginLimit = parseInt(process.env.LOGIN_THROTTLE_LIMIT || '5', 10);
const loginTtl = parseInt(process.env.LOGIN_THROTTLE_TTL || '60000', 10);

class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_@.-]+$/, { message: 'Usuario inválido' })
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}

@Controller('api/auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: loginLimit, ttl: loginTtl } })
  @ApiOperation({ summary: 'Login and set HttpOnly JWT cookie' })
  @ApiResponse({ status: 200, description: 'Login successful, cookie set' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.username, loginDto.password);
    res.cookie('jwt', result.token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 60 * 60 * 1000,
    });
    return { message: 'Login successful', token: result.token };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear HttpOnly JWT cookie' })
  @ApiResponse({ status: 200, description: 'Logout successful, cookie cleared' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    return { message: 'Logout successful' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Usuario autenticado', schema: { example: { sub: '1', username: 'admin123', role: 'admin' } } })
  me(@Req() req: any): any {
    return { user: req.user };
  }
}
