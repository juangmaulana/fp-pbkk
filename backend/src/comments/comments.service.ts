import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    productId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
    imageUrl?: string,
  ) {
    return this.prisma.comment.create({
      data: {
        text: createCommentDto.text,
        imageUrl,
        productId,
        userId,
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async findAllByProduct(productId: string) {
    return this.prisma.comment.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
    imageUrl?: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Unauthorized to update this comment');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        ...(updateCommentDto.text && { text: updateCommentDto.text }),
        ...(imageUrl && { imageUrl }),
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }
}
