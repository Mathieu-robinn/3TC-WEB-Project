import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Course, Prisma, Runner, Team } from "@prisma/client";
import { PrismaService } from "../../prisma.service.js";
import {
  courseLookupKey,
  normalizeCustomCategoryName,
} from "../../common/course-category.util.js";
import { normalizeLabel } from "../../common/normalize-label.util.js";
import { ImportParticipantRowDto } from "./dto/import-participants.dto.js";

export type ImportLineIssue = { line: number; message: string };

export type ImportParticipantsResult = {
  dryRun: boolean;
  created: { courses: number; teams: number; runners: number };
  skipped: number;
  errors: ImportLineIssue[];
  warnings: ImportLineIssue[];
};

type EditionContext = {
  editionId: number;
  startDate: Date;
  coursesByKey: Map<string, Course>;
  teamsByKey: Map<string, Team>;
  runnersByEmail: Map<string, Runner & { teamId: number }>;
  runnersByNameTeam: Map<string, Runner>;
  maxTeamNum: number;
};

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importParticipants(
    editionId: number,
    rows: ImportParticipantRowDto[],
    dryRun = false,
  ): Promise<ImportParticipantsResult> {
    const edition = await this.prisma.edition.findUnique({ where: { id: editionId } });
    if (!edition) {
      throw new NotFoundException(`Édition #${editionId} introuvable.`);
    }

    const ctx = await this.buildContext(editionId, edition.startDate);
    const result: ImportParticipantsResult = {
      dryRun,
      created: { courses: 0, teams: 0, runners: 0 },
      skipped: 0,
      errors: [],
      warnings: [],
    };

    const captainByTeamId = new Map<number, { runnerId: number; line: number }>();

    for (const row of rows) {
      await this.processRow(row, ctx, result, captainByTeamId, dryRun);
    }

    if (!dryRun) {
      for (const [teamId, { runnerId }] of captainByTeamId) {
        if (runnerId > 0) {
          await this.prisma.team.update({
            where: { id: teamId },
            data: { respRunnerId: runnerId },
          });
        }
      }
    }

    return result;
  }

  private async buildContext(editionId: number, startDate: Date): Promise<EditionContext> {
    const courses = await this.prisma.course.findMany({ where: { editionId } });
    const teams = await this.prisma.team.findMany({ where: { editionId } });
    const runners = await this.prisma.runner.findMany({
      where: { team: { editionId } },
    });

    const coursesByKey = new Map<string, Course>();
    for (const c of courses) {
      coursesByKey.set(
        courseLookupKey(c.name, c.category, c.customCategoryName ?? ""),
        c,
      );
    }

    const teamsByKey = new Map<string, Team>();
    for (const t of teams) {
      teamsByKey.set(normalizeLabel(t.name), t);
    }

    const runnersByEmail = new Map<string, Runner & { teamId: number }>();
    const runnersByNameTeam = new Map<string, Runner>();
    for (const r of runners) {
      if (r.email) {
        runnersByEmail.set(normalizeLabel(r.email), r);
      }
      runnersByNameTeam.set(this.runnerNameTeamKey(r.firstName, r.lastName, r.teamId), r);
    }

    const maxAgg = await this.prisma.team.aggregate({
      where: { editionId },
      _max: { num: true },
    });

    return {
      editionId,
      startDate,
      coursesByKey,
      teamsByKey,
      runnersByEmail,
      runnersByNameTeam,
      maxTeamNum: maxAgg._max.num ?? 0,
    };
  }

  private runnerNameTeamKey(firstName: string, lastName: string, teamId: number): string {
    return `${normalizeLabel(firstName)}|${normalizeLabel(lastName)}|${teamId}`;
  }

  private async processRow(
    row: ImportParticipantRowDto,
    ctx: EditionContext,
    result: ImportParticipantsResult,
    captainByTeamId: Map<number, { runnerId: number; line: number }>,
    dryRun: boolean,
  ): Promise<void> {
    const line = row.lineNumber;
    const courseName = row.courseName?.trim() ?? "";
    const category = row.category;
    let customCategoryName = "";
    try {
      customCategoryName = normalizeCustomCategoryName(
        category,
        row.customCategoryName,
      );
    } catch (e) {
      result.errors.push({
        line,
        message: e instanceof Error ? e.message : "Catégorie personnalisée invalide.",
      });
      return;
    }
    let teamName = row.teamName?.trim() ?? "";
    const lastName = row.lastName?.trim() ?? "";
    const firstName = row.firstName?.trim() ?? "";
    const email = row.email?.trim() || undefined;
    const phone = row.phone?.trim() || undefined;

    if (!courseName || !lastName || !firstName) {
      result.errors.push({
        line,
        message: "Course, catégorie, nom et prénom sont obligatoires.",
      });
      return;
    }

    if (!teamName) {
      teamName = `Solo ${firstName} ${lastName}`.trim();
    }

    const courseKey = courseLookupKey(courseName, category, customCategoryName);
    let course = ctx.coursesByKey.get(courseKey);
    if (!course) {
      if (dryRun) {
        result.created.courses += 1;
        course = {
          id: -result.created.courses,
          name: courseName,
          category,
          customCategoryName,
          distanceTour: 0,
          dateAndTime: ctx.startDate,
          editionId: ctx.editionId,
        } as Course;
        ctx.coursesByKey.set(courseKey, course);
      } else {
        try {
          course = await this.prisma.course.create({
            data: {
              name: courseName,
              category,
              customCategoryName,
              distanceTour: 0,
              dateAndTime: ctx.startDate,
              editionId: ctx.editionId,
            },
          });
          ctx.coursesByKey.set(courseKey, course);
          result.created.courses += 1;
        } catch (e) {
          result.errors.push({ line, message: this.prismaErrorMessage(e, "course") });
          return;
        }
      }
    }

    const teamKey = normalizeLabel(teamName);
    let team = ctx.teamsByKey.get(teamKey);
    if (!team) {
      if (dryRun) {
        ctx.maxTeamNum += 1;
        result.created.teams += 1;
        team = {
          id: -result.created.teams,
          num: ctx.maxTeamNum,
          name: teamName,
          nbTour: 0,
          courseId: course.id,
          editionId: ctx.editionId,
          respRunnerId: null,
          transponderHolderRunnerId: null,
          courseFinished: false,
        } as Team;
        ctx.teamsByKey.set(teamKey, team);
      } else {
        ctx.maxTeamNum += 1;
        try {
          team = await this.prisma.team.create({
            data: {
              num: ctx.maxTeamNum,
              name: teamName,
              courseId: course.id,
              editionId: ctx.editionId,
            },
          });
          ctx.teamsByKey.set(teamKey, team);
          result.created.teams += 1;
        } catch (e) {
          result.errors.push({ line, message: this.prismaErrorMessage(e, "équipe") });
          return;
        }
      }
    } else if (team.courseId !== course.id) {
      result.errors.push({
        line,
        message: `L'équipe « ${teamName} » est déjà inscrite sur une autre course de cette édition.`,
      });
      return;
    }

    if (email) {
      const existingByEmail = ctx.runnersByEmail.get(normalizeLabel(email));
      if (existingByEmail) {
        if (existingByEmail.teamId === team.id) {
          result.skipped += 1;
          if (row.isCaptain) {
            this.setCaptain(captainByTeamId, team.id, existingByEmail.id, line, result);
          }
          return;
        }
        result.errors.push({
          line,
          message: `L'email « ${email} » est déjà utilisé par un autre participant de cette édition.`,
        });
        return;
      }
    } else {
      const nameKey = this.runnerNameTeamKey(firstName, lastName, team.id);
      const existingByName = ctx.runnersByNameTeam.get(nameKey);
      if (existingByName) {
        result.skipped += 1;
        if (row.isCaptain) {
          this.setCaptain(captainByTeamId, team.id, existingByName.id, line, result);
        }
        return;
      }
    }

    if (dryRun) {
      result.created.runners += 1;
      const fakeId = -(result.created.runners);
      const fakeRunner = {
        id: fakeId,
        teamId: team.id,
        firstName,
        lastName,
        email: email ?? null,
        phone: phone ?? null,
      } as Runner;
      if (email) {
        ctx.runnersByEmail.set(normalizeLabel(email), fakeRunner);
      }
      ctx.runnersByNameTeam.set(this.runnerNameTeamKey(firstName, lastName, team.id), fakeRunner);
      if (row.isCaptain) {
        this.setCaptain(captainByTeamId, team.id, fakeId, line, result);
      }
      return;
    }

    try {
      const runner = await this.prisma.runner.create({
        data: {
          firstName,
          lastName,
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          teamId: team.id,
        },
      });
      result.created.runners += 1;
      if (email) {
        ctx.runnersByEmail.set(normalizeLabel(email), runner);
      }
      ctx.runnersByNameTeam.set(this.runnerNameTeamKey(firstName, lastName, team.id), runner);
      if (row.isCaptain) {
        this.setCaptain(captainByTeamId, team.id, runner.id, line, result);
      }
    } catch (e) {
      result.errors.push({ line, message: this.prismaErrorMessage(e, "participant") });
    }
  }

  private setCaptain(
    map: Map<number, { runnerId: number; line: number }>,
    teamId: number,
    runnerId: number,
    line: number,
    result: ImportParticipantsResult,
  ): void {
    const prev = map.get(teamId);
    if (prev && prev.line !== line) {
      result.warnings.push({
        line,
        message: "Plusieurs capitaines indiqués pour cette équipe ; le dernier sera retenu.",
      });
    }
    map.set(teamId, { runnerId, line });
  }

  private prismaErrorMessage(e: unknown, entity: string): string {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return `Conflit d'unicité lors de la création du ${entity}.`;
    }
    if (e instanceof BadRequestException || e instanceof NotFoundException) {
      return (e as { message: string }).message;
    }
    return `Erreur lors de la création du ${entity}.`;
  }
}
