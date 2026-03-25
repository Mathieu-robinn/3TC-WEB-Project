import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller.js";
import { UserService } from "./user.service.js";
import { EditionService } from "./edition.service.js";
import { CourseService } from "./course.service.js";
import { TeamService } from "./team.service.js";
import { RunnerService } from "./runner.service.js";
import { TransponderService } from "./transponder.service.js";
import { TransponderTransactionService } from "./transponder-transaction.service.js";
import { JwtAuthGuard } from "./auth/jwt-auth.guard.js";
import { ExecutionContext } from "@nestjs/common";

describe("AppController", () => {
  let controller: AppController;
  let teamService: TeamService;

  const mockService = {
    user: jest.fn(),
    editions: jest.fn(),
    courses: jest.fn(),
    teams: jest.fn(),
    runners: jest.fn(),
    transponders: jest.fn(),
    transactions: jest.fn(),
    createTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: UserService, useValue: mockService },
        { provide: EditionService, useValue: mockService },
        { provide: CourseService, useValue: mockService },
        { provide: TeamService, useValue: mockService },
        { provide: RunnerService, useValue: mockService },
        { provide: TransponderService, useValue: mockService },
        { provide: TransponderTransactionService, useValue: mockService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (context: ExecutionContext) => true })
      .compile();

    controller = module.get<AppController>(AppController);
    teamService = module.get<TeamService>(TeamService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getTeamRanking", () => {
    it("should return teams ordered by nbTour Desc", async () => {
      const mockTeams = [{ id: 1, name: "Team 1", nbTour: 10 }];
      (teamService.teams as jest.Mock).mockResolvedValue(mockTeams);

      const result = await controller.getTeamRanking();

      expect(teamService.teams).toHaveBeenCalledWith({
        where: { nbTour: { not: null } },
        orderBy: { nbTour: "desc" },
      });
      expect(result).toEqual(mockTeams);
    });
  });

  describe("getTransponderStats", () => {
    it("should calculate correct stats from transponders list", async () => {
      const mockTransponders = [
        { status: "NEW" },
        { status: "IN" },
        { status: "OUT" },
        { status: "OUT" },
      ];
      (mockService.transponders as jest.Mock).mockResolvedValue(mockTransponders);

      const result = await controller.getTransponderStats();

      expect(result).toEqual({ NEW: 1, IN: 1, OUT: 2, LOST: 0 });
    });
  });
});
