import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: any) {
    let DataToSend = {
      content: data.content,
      is_admin: Boolean(data.is_admin),
    };
    console.log('DataToSend', DataToSend);
    if (Boolean(data.is_admin)) {
      // @ts-expect-error kjhn jkh
      DataToSend.admin_id = data.sender_id;
    } else {
      // @ts-expect-error kjhn jkh
      DataToSend.sender_id = data.sender_id;
    }
    let res = await this.prisma.community_messages.create({
      data: DataToSend,
      include: {
        users: {
          select: {
            username: true,
            profile: true,
          },
        },
      },
    });
    console.log(res);
    return res;
  }

    async getMessages({  beforeId }: { beforeId?: number }) {

    let res = await this.prisma.community_messages.findMany({
      where: beforeId ? { id: { lt: beforeId } } : undefined,
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        users: {
          select: {
            profile: true,
            username: true,
          },
        },
      },
    });
    res = res.reverse();
    // console.log(res);
    return res;
  }
}
