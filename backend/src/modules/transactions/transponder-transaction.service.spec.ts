import { Test, TestingModule } from "@nestjs/testing";
import { TransponderTransactionService } from "./transponder-transaction.service.js";
import { PrismaService } from "../../prisma.service.js";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { TransponderStatus, Role } from "@prisma/client";

describe("TransponderTransactionService", () => {
  let service: TransponderTransactionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    transponder: { findUnique: jest.fn(), update: jest.fn() },
    transponderTransaction: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransponderTransactionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TransponderTransactionService>(TransponderTransactionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTransaction", () => {
    const mockUser = { id: 1, role: Role.BENEVOLE };
    const mockTransponder = { id: 10, status: "DISPONIBLE" as any };
    const mockData = {
      transponder: { connect: { id: 10 } },
      runner: { connect: { id: 5 } },
      user: { connect: { id: 1 } },
      type: "OUT",
    };

    it("should create a transaction successfully for a BENEVOLE", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.transponder.findUnique as jest.Mock).mockResolvedValue(mockTransponder);
      (prisma.$transaction as jest.Mock).mockResolvedValue([{ id: 100, ...mockData }]);

      const result = await service.createTransaction(mockData as any, 1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.transponder.findUnique).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.id).toBe(100);
    });

    it("should throw ForbiddenException if user is not authorized (invalid role)", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: "INVALID" as any });

      await expect(service.createTransaction(mockData as any, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw BadRequestException if transponder is already OUT", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.transponder.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        status: "ATTRIBUE" as any,
      });

      await expect(service.createTransaction(mockData as any, 1)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if transponder is LOST", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.transponder.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        status: "PERDU" as any,
      });

      await expect(service.createTransaction(mockData as any, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
