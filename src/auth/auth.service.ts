import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signup(dto: AuthDto) {
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          hash,
        },
      });

      return this.signToken(user.id, user.email, user.username);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Siema byku zajęte');
        }
      }
    }
  }

  async login(dto: AuthDto) {
    const findUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
        username: dto.username,
      },
    });

    if (!findUser) {
      throw new ForbiddenException('siema nie ma kogos takiego');
    }

    const matchPW = await argon.verify(findUser.hash, dto.password);

    if (!matchPW) {
      throw new ForbiddenException('siema błędne hasło');
    }

    return this.signToken(findUser.id, findUser.email, findUser.username);
  }

  async signToken(
    userId: number,
    email: string,
    username: string,
  ): Promise<{access_token: string}> {
    const payload = {
      sub: userId,
      email,
      username,
    };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}
