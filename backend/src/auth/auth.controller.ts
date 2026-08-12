import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './auth.guard';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

@Controller('api/auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and set HttpOnly JWT cookie' })
  @ApiResponse({ status: 200, description: 'Login successful, cookie set' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.username, loginDto.password);
    res.cookie('jwt', result.token, { httpOnly: true, sameSite: 'lax' });
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
