import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Edition, Prisma } from "@prisma/client";

@Injectable()
export class EditionService {
  constructor(private prisma: PrismaService) {}

  async edition(editionWhereUniqueInput: Prisma.EditionWhereUniqueInput): Promise<Edition | null> {
    return this.prisma.edition.findUnique({
      where: editionWhereUniqueInput,
    });
  }

  async editions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.EditionWhereUniqueInput;
    where?: Prisma.EditionWhereInput;
    orderBy?: Prisma.EditionOrderByWithRelationInput;
  }): Promise<Edition[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.edition.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createEdition(data: Prisma.EditionCreateInput): Promise<Edition> {
    return this.prisma.edition.create({
      data,
    });
  }

  async updateEdition(params: {
    where: Prisma.EditionWhereUniqueInput;
    data: Prisma.EditionUpdateInput;
  }): Promise<Edition> {
    const { where, data } = params;
    return this.prisma.edition.update({
      data,
      where,
    });
  }

  async deleteEdition(where: Prisma.EditionWhereUniqueInput): Promise<Edition> {
    return this.prisma.edition.delete({
      where,
    });
  }
}
