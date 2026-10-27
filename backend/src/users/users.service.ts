import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...result } = user;
    return result;
  }

  async updateProfile(id: string, updateData: { name?: string; profileImage?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    const { passwordHash, ...result } = user;
    return result;
  }
}
