import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma.service.js";
import { LogType, Prisma, Role, User } from "@prisma/client";
import { LogService } from "../log/log.service.js";
import { CreateUserDto, UpdateMyProfileDto, UpdateUserDto } from "./dto/user.dto.js";

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
  constructor(
    private prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async publicUser(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<UserPublic | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      select: userPublicSelect,
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

  async createStaffUser(dto: CreateUserDto, actorUserId: number, actorRole: Role): Promise<UserPublic> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Un compte avec cet email existe déjà.");
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role ?? Role.BENEVOLE;
    if (role === Role.SUPER_ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Seul un super admin peut créer un super admin.");
    }
    const created = await this.prisma.user.create({
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
    try {
      await this.logService.createLog({
        type: LogType.ADD_USER,
        message: `Création du compte ${created.firstName} ${created.lastName} (${created.email}).`,
        user: { connect: { id: actorUserId } },
        details: { createdUserId: created.id },
      });
    } catch (e) {
      console.error("[UserService] ADD_USER log:", e);
    }
    return created;
  }

  async updateStaffUser(id: number, userData: UpdateUserDto, actorUserId: number, actorRole: Role): Promise<UserPublic> {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException(`Utilisateur #${id} introuvable.`);
    }
    if (target.role === Role.SUPER_ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Seul un super admin peut modifier un super admin.");
    }
    if (target.role === Role.ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Seul un super admin peut modifier un administrateur.");
    }
    if (userData.role === Role.SUPER_ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Seul un super admin peut attribuer le rôle super admin.");
    }
    if (
      target.id === actorUserId &&
      target.role === Role.SUPER_ADMIN &&
      userData.role !== undefined &&
      userData.role !== Role.SUPER_ADMIN
    ) {
      const remainingSuperAdmins = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN },
      });
      if (remainingSuperAdmins <= 1) {
        throw new ForbiddenException("Impossible de retirer le dernier super admin.");
      }
    }
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

  async updateOwnProfile(userId: number, role: Role, userData: UpdateMyProfileDto): Promise<UserPublic> {
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable.`);
    }

    const wantsPasswordChange = userData.newPassword !== undefined || userData.currentPassword !== undefined;
    if (role === Role.BENEVOLE && (userData.firstName !== undefined || userData.lastName !== undefined)) {
      throw new ForbiddenException("Un bénévole ne peut modifier que son mot de passe.");
    }

    const data: Prisma.UserUpdateInput = {};
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
      if (userData.firstName !== undefined) data.firstName = userData.firstName;
      if (userData.lastName !== undefined) data.lastName = userData.lastName;
    }

    if (wantsPasswordChange) {
      if (!userData.currentPassword || !userData.newPassword) {
        throw new BadRequestException("Le mot de passe actuel et le nouveau mot de passe sont requis.");
      }
      const passwordMatches = await bcrypt.compare(userData.currentPassword, currentUser.password);
      if (!passwordMatches) {
        throw new ForbiddenException("Le mot de passe actuel est incorrect.");
      }
      data.password = await bcrypt.hash(userData.newPassword, 10);
      data.tokenVersion = { increment: 1 };
    }

    if (!Object.keys(data).length) {
      throw new BadRequestException("Aucune modification valide n'a été fournie.");
    }

    return this.prisma.user.update({
      where: { id: userId },
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

  /** Suppression par un admin : interdit de supprimer son propre compte. */
  async deleteStaffUser(actorUserId: number, actorRole: Role, targetUserId: number): Promise<User> {
    if (actorUserId === targetUserId) {
      throw new BadRequestException("Vous ne pouvez pas supprimer votre propre compte.");
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException(`Utilisateur #${targetUserId} introuvable.`);
    }
    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException("Un compte super admin ne peut pas être supprimé.");
    }
    if (target.role === Role.ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Seul un super admin peut supprimer un administrateur.");
    }
    const deleted = await this.deleteUser({ id: targetUserId });
    try {
      await this.logService.createLog({
        type: LogType.DELETE_USER,
        message: `Suppression du compte ${target.firstName} ${target.lastName} (${target.email}).`,
        user: { connect: { id: actorUserId } },
        details: { deletedUserId: targetUserId },
      });
    } catch (e) {
      console.error("[UserService] DELETE_USER log:", e);
    }
    return deleted;
  }
}
