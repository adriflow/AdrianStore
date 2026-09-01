import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';

import { RolesGuard } from './roles.guard';
import { StoreOwnerGuard } from './store-owner.guard';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { StoreModule } from '../store/store.module';
import { JwtStrategy } from './jwt.strategy';
import { requireEnv } from '../security/env';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: requireEnv('JWT_SECRET'),
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
    forwardRef(() => StoreModule),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, StoreOwnerGuard],
  controllers: [AuthController],
  exports: [AuthService, StoreOwnerGuard],
})
export class AuthModule {}
