import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDTO } from './dto';

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

  async signin() {
    return { message: 'On sign in' };
  }
}
