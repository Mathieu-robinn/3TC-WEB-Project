import { Test, TestingModule } from "@nestjs/testing";
import { TransponderService } from "./transponder.service.js";
import { PrismaService } from "../../prisma.service.js";
import { TransponderStatus } from "@prisma/client";
import { NotificationDispatchService } from "../notification/notification-dispatch.service.js";

describe("TransponderService", () => {
  let service: TransponderService;

  const mockUpdatedTransponder = {
    id: 7,
    editionId: 1,
    status: TransponderStatus.ATTRIBUE,
    teamId: 3,
    team: null,
    edition: null,
  };

  const mockTx = {
    transponder: {
      update: jest.fn().mockResolvedValue(mockUpdatedTransponder),
    },
    transponderTransaction: {
      create: jest.fn().mockResolvedValue({ id: 100 }),
    },
    team: {
      update: jest.fn().mockResolvedValue({ id: 3, courseFinished: true }),
    },
  };

  const mockPrismaService = {
    transponder: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    team: { findMany: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  };

  const mockNotificationDispatch = {
    notifyAutomaticTransponderEvent: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransponderService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationDispatchService, useValue: mockNotificationDispatch },
      ],
    }).compile();

    service = module.get<TransponderService>(TransponderService);
  });

  describe("updateTransponderFieldsWithAudit", () => {
    it("met à jour la puce et crée une ligne TransponderTransaction dans la même transaction", async () => {
      const result = await service.updateTransponderFieldsWithAudit(
        7,
        { status: "ATTRIBUE", teamId: 3 },
        42,
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.transponder.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { status: TransponderStatus.ATTRIBUE, teamId: 3 },
        include: { team: true, edition: true },
      });
      expect(mockTx.transponderTransaction.create).toHaveBeenCalledWith({
        data: {
          transponderId: 7,
          teamId: mockUpdatedTransponder.teamId,
          userId: 42,
          type: mockUpdatedTransponder.status,
          dateTime: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUpdatedTransponder);
    });

    it("marque l'équipe courseFinished lorsque markTeamCourseFinishedForTeamId est fourni", async () => {
      const recovered = { ...mockUpdatedTransponder, status: TransponderStatus.RECUPERE, teamId: null };
      mockTx.transponder.update.mockResolvedValueOnce(recovered);

      await service.updateTransponderFieldsWithAudit(
        7,
        { status: "RECUPERE", teamId: null },
        42,
        {
          teamIdForTransaction: 3,
          markTeamCourseFinishedForTeamId: 3,
          setTransponderHolderOnTeam: { teamId: 3, runnerId: null },
        },
      );

      expect(mockTx.team.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { transponderHolderRunnerId: null },
      });
      expect(mockTx.team.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { courseFinished: true },
      });
    });

    it("met à jour le responsable transpondeur sur l'équipe lorsque setTransponderHolderOnTeam est fourni", async () => {
      await service.updateTransponderFieldsWithAudit(
        7,
        { status: "ATTRIBUE", teamId: 3 },
        42,
        { setTransponderHolderOnTeam: { teamId: 3, runnerId: 12 } },
      );

      expect(mockTx.team.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { transponderHolderRunnerId: 12 },
      });
    });
  });

  describe("updateTransponderWithAudit", () => {
    it("applique un TransponderUpdateInput et journalise le statut résultant", async () => {
      const updatedLost = {
        id: 7,
        editionId: 1,
        status: TransponderStatus.PERDU,
        teamId: null,
        team: null,
        edition: null,
      };
      mockTx.transponder.update.mockResolvedValueOnce(updatedLost);

      const result = await service.updateTransponderWithAudit({
        where: { id: 7 },
        data: { status: TransponderStatus.PERDU } as any,
        actorUserId: 99,
        teamIdForTransaction: 3,
        setTransponderHolderOnTeam: { teamId: 3, runnerId: null },
      });

      expect(mockTx.team.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { transponderHolderRunnerId: null },
      });
      expect(mockTx.transponderTransaction.create).toHaveBeenCalledWith({
        data: {
          transponderId: 7,
          teamId: 3,
          userId: 99,
          type: TransponderStatus.PERDU,
          dateTime: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedLost);
    });
  });
});
