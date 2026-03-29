import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma.service.js";
import { Prisma, Role, User } from "@prisma/client";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto.js";

const userPublicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
} as const;

export type UserPublic = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
};

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async listStaffAccounts(): Promise<UserPublic[]> {
    return this.prisma.user.findMany({
      orderBy: { id: "asc" },
      select: userPublicSelect,
    });
  }

  async createStaffUser(dto: CreateUserDto): Promise<UserPublic> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Un compte avec cet email existe déjà.");
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role ?? Role.BENEVOLE;
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role,
      },
      select: userPublicSelect,
    });
  }

  async updateStaffUser(id: number, userData: UpdateUserDto): Promise<UserPublic> {
    const data: Prisma.UserUpdateInput = {
      ...(userData.email !== undefined ? { email: userData.email } : {}),
      ...(userData.firstName !== undefined ? { firstName: userData.firstName } : {}),
      ...(userData.lastName !== undefined ? { lastName: userData.lastName } : {}),
      ...(userData.phone !== undefined ? { phone: userData.phone } : {}),
      ...(userData.role !== undefined ? { role: userData.role } : {}),
    };
    if (userData.password !== undefined) {
      data.password = await bcrypt.hash(userData.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
