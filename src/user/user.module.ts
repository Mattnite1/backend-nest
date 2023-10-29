import { Module } from '@nestjs/common';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { UserController } from './user.controller';

@Module({

  controllers: [UserController]
})
export class UserModule {}
