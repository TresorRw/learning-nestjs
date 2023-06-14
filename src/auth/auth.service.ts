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
import * as argon from 'argon2';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
        throw new HttpException(
          {
            statusCode: HttpStatus.ACCEPTED,
            message: 'Login successfully',
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
}
