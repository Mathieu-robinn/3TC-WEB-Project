import { Test, TestingModule } from "@nestjs/testing";
import { EditionService } from "./edition.service.js";
import { PrismaService } from "../../prisma.service.js";
import { TeamService } from "../teams/team.service.js";

describe("EditionService", () => {
  let service: EditionService;

  const mockPrismaService = {
    edition: {
      findMany: jest.fn(),
    },
  };

  const mockTeamService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TeamService, useValue: mockTeamService },
      ],
    }).compile();

    service = module.get<EditionService>(EditionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getActiveEditionId", () => {
    it("returns active edition id even when it has no courses", async () => {
      mockPrismaService.edition.findMany.mockResolvedValue([
        { id: 10, active: true, _count: { courses: 0 } },
        { id: 2, active: false, _count: { courses: 3 } },
      ]);

      await expect(service.getActiveEditionId()).resolves.toBe(10);
    });

    it("falls back to most recent edition with courses when none is active", async () => {
      mockPrismaService.edition.findMany.mockResolvedValue([
        { id: 3, active: false, _count: { courses: 2 } },
        { id: 1, active: false, _count: { courses: 0 } },
      ]);

      await expect(service.getActiveEditionId()).resolves.toBe(3);
    });

    it("returns null when there are no editions", async () => {
      mockPrismaService.edition.findMany.mockResolvedValue([]);

      await expect(service.getActiveEditionId()).resolves.toBeNull();
    });

    it("returns null when no edition is active and none has courses", async () => {
      mockPrismaService.edition.findMany.mockResolvedValue([
        { id: 1, active: false, _count: { courses: 0 } },
      ]);

      await expect(service.getActiveEditionId()).resolves.toBeNull();
    });
  });
});
