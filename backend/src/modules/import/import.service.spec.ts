import { Test, TestingModule } from "@nestjs/testing";
import { Course, CourseCategory } from "@prisma/client";
import { ImportService } from "./import.service.js";
import { PrismaService } from "../../prisma.service.js";

describe("ImportService", () => {
  let service: ImportService;

  const edition = {
    id: 1,
    name: "24h 2026",
    active: true,
    startDate: new Date("2026-05-15T18:00:00Z"),
    endDate: new Date("2026-05-16T18:00:00Z"),
  };

  const course = {
    id: 10,
    name: "Marathon",
    category: CourseCategory.COMPETITION,
    distanceTour: 2.5,
    dateAndTime: edition.startDate,
    editionId: 1,
  };

  let teams: { id: number; num: number; name: string; courseId: number; editionId: number }[] = [];
  let runners: {
    id: number;
    teamId: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  }[] = [];
  let courses: Course[] = [course];
  let nextTeamId = 1;
  let nextRunnerId = 1;
  let nextCourseId = 11;

  const mockPrisma = {
    edition: { findUnique: jest.fn().mockResolvedValue(edition) },
    course: {
      findMany: jest.fn().mockImplementation(() => Promise.resolve(courses)),
      create: jest.fn().mockImplementation(
        ({
          data,
        }: {
          data: { name: string; category: CourseCategory; editionId: number };
        }) => {
          const c = {
            id: nextCourseId++,
            name: data.name,
            category: data.category,
            distanceTour: 0,
            dateAndTime: edition.startDate,
            editionId: 1,
          };
          courses.push(c);
          return Promise.resolve(c);
        },
      ),
    },
    team: {
      findMany: jest.fn().mockImplementation(() => Promise.resolve(teams)),
      aggregate: jest.fn().mockImplementation(() =>
        Promise.resolve({ _max: { num: teams.reduce((m, t) => Math.max(m, t.num), 0) } }),
      ),
      create: jest.fn().mockImplementation(
        ({ data }: { data: { num: number; name: string; courseId: number; editionId: number } }) => {
          const t = { id: nextTeamId++, ...data };
          teams.push(t);
          return Promise.resolve(t);
        },
      ),
      update: jest.fn().mockResolvedValue({}),
    },
    runner: {
      findMany: jest.fn().mockImplementation(() => Promise.resolve(runners)),
      create: jest.fn().mockImplementation(
        ({
          data,
        }: {
          data: {
            firstName: string;
            lastName: string;
            teamId: number;
            email?: string;
            phone?: string;
          };
        }) => {
          const r = { id: nextRunnerId++, email: data.email ?? null, phone: data.phone ?? null, ...data };
          runners.push(r);
          return Promise.resolve(r);
        },
      ),
    },
  };

  beforeEach(async () => {
    teams = [];
    runners = [];
    courses = [course];
    nextTeamId = 1;
    nextRunnerId = 1;
    nextCourseId = 11;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ImportService>(ImportService);
  });

  it("crée course, équipe et participant", async () => {
    courses = [];
    const result = await service.importParticipants(1, [
      {
        lineNumber: 2,
        courseName: "Trail",
        category: CourseCategory.LOISIR,
        teamName: "Neo",
        lastName: "Dupont",
        firstName: "Jean",
        email: "j@x.fr",
        isCaptain: true,
      },
    ]);

    expect(result.created).toEqual({ courses: 1, teams: 1, runners: 1 });
    expect(result.errors).toHaveLength(0);
  });

  it("crée Solo prénom nom si équipe vide", async () => {
    courses = [];
    const result = await service.importParticipants(1, [
      {
        lineNumber: 2,
        courseName: "Trail",
        category: CourseCategory.SOLO,
        teamName: "",
        lastName: "Dupont",
        firstName: "Jean",
      },
    ]);

    expect(result.created.teams).toBe(1);
    expect(teams[0].name).toBe("Solo Jean Dupont");
    expect(result.created.runners).toBe(1);
  });

  it("même nom de course OK si catégorie différente", async () => {
    courses = [];
    await service.importParticipants(1, [
      {
        lineNumber: 2,
        courseName: "Vélo",
        category: CourseCategory.SOLO,
        teamName: "A",
        lastName: "Un",
        firstName: "A",
      },
    ]);
    const result = await service.importParticipants(1, [
      {
        lineNumber: 3,
        courseName: "Vélo",
        category: CourseCategory.COMPETITION,
        teamName: "B",
        lastName: "Deux",
        firstName: "B",
      },
    ]);

    expect(result.created.courses).toBe(1);
    expect(result.created.teams).toBe(1);
    expect(courses).toHaveLength(2);
  });

  it("ignore un participant déjà présent (même email, même équipe)", async () => {
    teams = [{ id: 5, num: 1, name: "Neo", courseId: 10, editionId: 1 }];
    runners = [
      { id: 9, teamId: 5, firstName: "Jean", lastName: "Dupont", email: "j@x.fr", phone: null },
    ];

    const result = await service.importParticipants(1, [
      {
        lineNumber: 2,
        courseName: "Marathon",
        category: CourseCategory.COMPETITION,
        teamName: "Neo",
        lastName: "Dupont",
        firstName: "Jean",
        email: "j@x.fr",
      },
    ]);

    expect(result.skipped).toBe(1);
    expect(result.created.runners).toBe(0);
  });

  it("erreur si équipe existante sur une autre course", async () => {
    courses.push({
      id: 99,
      name: "Autre",
      category: CourseCategory.LOISIR,
      distanceTour: 0,
      dateAndTime: edition.startDate,
      editionId: 1,
    });
    teams = [{ id: 5, num: 1, name: "Neo", courseId: 99, editionId: 1 }];

    const result = await service.importParticipants(1, [
      {
        lineNumber: 2,
        courseName: "Marathon",
        category: CourseCategory.COMPETITION,
        teamName: "Neo",
        lastName: "Martin",
        firstName: "Paul",
      },
    ]);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("autre course");
  });

  it("dryRun ne crée rien en base", async () => {
    courses = [];
    const result = await service.importParticipants(
      1,
      [
        {
          lineNumber: 2,
          courseName: "Trail",
          category: CourseCategory.LOISIR,
          teamName: "Neo",
          lastName: "Dupont",
          firstName: "Jean",
        },
      ],
      true,
    );

    expect(result.dryRun).toBe(true);
    expect(result.created).toEqual({ courses: 1, teams: 1, runners: 1 });
    expect(mockPrisma.course.create).not.toHaveBeenCalled();
  });
});
