import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDTO } from './dto';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwt: JwtService,
  ) {}
  async signup(dto: AuthDTO) {
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, password: dto.password },
        select: { email: true },
      });
      return { statusCode: 201, message: 'Regsistration succesfull', user };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email address is not available.');
      }
      throw error;
    }
  }
  async signin(dto: AuthDTO) {
    // Find user by email address
    const matchUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (matchUser) {
      // Match password
      const matchPwd = await argon.verify(matchUser.password, dto.password);
      if (matchPwd) {
        const jwtToken = await this.signToken({
          id: matchUser.id,
          email: matchUser.email,
        });
        throw new HttpException(
          {
            statusCode: HttpStatus.ACCEPTED,
            message: 'Login successfully',
            token: jwtToken,
          },
          HttpStatus.ACCEPTED,
        );
      } else {
        throw new BadRequestException('Incorrect password');
      }
    } else {
      throw new NotFoundException(
        'These credentials are not familiar to us, try again',
      );
    }
  }

  signToken(payload: { id: number; email: string }): Promise<string> {
    const secret = this.config.get('JWT_SECRET');
    const token = this.jwt.signAsync(payload, { secret, expiresIn: '1d' });
    return token;
  }
  decryptToken(token: string) {
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      return payload;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          message: 'Invalid Token Detected',
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
  }
}
