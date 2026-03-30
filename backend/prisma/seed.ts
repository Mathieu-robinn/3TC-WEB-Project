import { PrismaClient, Role, TransponderStatus, ConversationType, MessageType, ParticipantRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config.js";
import { LogType } from "@prisma/client";
const { Pool } = pg;
const adapter = new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL as string }) as any);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────

/** PRNG déterministe (mulberry32) pour obtenir une seed 100% reproductible. */
const createSeededRandom = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const seededRandom = createSeededRandom(0x24_68_20_26);
/** Retourne un entier pseudo-aléatoire déterministe entre min et max (inclus). */
const rand = (min: number, max: number) => Math.floor(seededRandom() * (max - min + 1)) + min;
/** Retourne un élément aléatoire d'un tableau */
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];
/** Mélange déterministe de tableau (Fisher-Yates). */
const shuffle = <T>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

async function main() {
  console.log("🌱 Démarrage du seed...");

  // ─── Nettoyage préalable (ordre respectant les FK) ──────────────────────
  await prisma.conversationParticipant.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.log.deleteMany();
  await prisma.transponderTransaction.deleteMany();
  await prisma.transponder.deleteMany();
  await prisma.runner.deleteMany();
  await prisma.team.deleteMany();
  await prisma.course.deleteMany();
  await prisma.edition.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Base nettoyée.");

  // ───────────────────────────────────────────────────────────────────────────
  // 1. UTILISATEURS
  // ───────────────────────────────────────────────────────────────────────────

  // Hasher un mot de passe par défaut
  const bcrypt = await import("bcrypt");
  const hashedPwd = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: { email: "admin@24h-insa.fr", firstName: "Sophie", lastName: "Admin", password: hashedPwd, role: Role.ADMIN, phone: "0600000001" },
  });

  const benevoleUser = await prisma.user.create({
    data: { email: "benevole@24h-insa.fr", firstName: "Théo", lastName: "Bénévole", password: hashedPwd, role: Role.BENEVOLE, phone: "0600000002" },
  });

  const benevoles = await Promise.all([
    prisma.user.create({ data: { email: "ben1@24h-insa.fr", firstName: "Lucas", lastName: "Martin", password: hashedPwd, role: Role.BENEVOLE, phone: "0600000010" } }),
    prisma.user.create({ data: { email: "ben2@24h-insa.fr", firstName: "Emma", lastName: "Dupont", password: hashedPwd, role: Role.BENEVOLE, phone: "0600000011" } }),
    prisma.user.create({ data: { email: "ben3@24h-insa.fr", firstName: "Jules", lastName: "Bernard", password: hashedPwd, role: Role.BENEVOLE, phone: "0600000012" } }),
  ]);

  const participantUsers = await Promise.all([
    // USER => BENEVOLE (fusion des rôles)
    prisma.user.create({ data: { email: "user1@insa-lyon.fr", firstName: "Alice", lastName: "Moreau", password: hashedPwd, role: Role.BENEVOLE } }),
    prisma.user.create({ data: { email: "user2@insa-lyon.fr", firstName: "Bob", lastName: "Simon", password: hashedPwd, role: Role.BENEVOLE } }),
    prisma.user.create({ data: { email: "user3@insa-lyon.fr", firstName: "Clara", lastName: "Laurent", password: hashedPwd, role: Role.BENEVOLE } }),
  ]);

  console.log("✅ Utilisateurs créés avec mot de passe 'password123'.");

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ÉDITIONS
  // ───────────────────────────────────────────────────────────────────────────

  const edition2025 = await prisma.edition.create({
    data: { name: "24h INSA 2025", active: false, startDate: new Date("2025-05-16T18:00:00Z"), endDate: new Date("2025-05-18T18:00:00Z") },
  });

  const edition2026 = await prisma.edition.create({
    data: { name: "24h INSA 2026", active: true, startDate: new Date("2026-05-15T18:00:00Z"), endDate: new Date("2026-05-17T18:00:00Z") },
  });

  console.log("✅ Éditions créées.");

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PARCOURS
  // ───────────────────────────────────────────────────────────────────────────

  const course2025_24h = await prisma.course.create({
    data: { name: "24 Heures 2025", distanceTour: 2.5, dateAndTime: new Date("2025-05-17T14:00:00Z"), editionId: edition2025.id },
  });

  const course2026_24h = await prisma.course.create({
    data: { name: "24 Heures", distanceTour: 2.5, dateAndTime: new Date("2026-05-16T14:00:00Z"), editionId: edition2026.id },
  });

  const course2026_12h = await prisma.course.create({
    data: { name: "12 Heures", distanceTour: 2.5, dateAndTime: new Date("2026-05-16T20:00:00Z"), editionId: edition2026.id },
  });

  const course2026_6h = await prisma.course.create({
    data: { name: "6 Heures Handisport", distanceTour: 1.8, dateAndTime: new Date("2026-05-17T08:00:00Z"), editionId: edition2026.id },
  });

  console.log("✅ Parcours créés.");

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ÉQUIPES ET COUREURS (2026 — 24h)
  // ───────────────────────────────────────────────────────────────────────────

  const teamDefinitions = [
    { num: 1, name: "Les Fous du Volant", nbTour: 187, course: course2026_24h },
    { num: 2, name: "Flash et ses copains", nbTour: 201, course: course2026_24h },
    { num: 3, name: "INSA Running Club", nbTour: 215, course: course2026_24h },
    { num: 4, name: "Le Peloton Fantôme", nbTour: 178, course: course2026_24h },
    { num: 5, name: "Kilomètre Zéro", nbTour: 192, course: course2026_24h },
    { num: 6, name: "Les Tortues Ninjas", nbTour: 164, course: course2026_24h },
    { num: 7, name: "Sprinteurs en Herbe", nbTour: 220, course: course2026_24h },
    { num: 8, name: "Courir ou Mourir", nbTour: 145, course: course2026_24h },
    { num: 9, name: "Jambes de feu", nbTour: 198, course: course2026_24h },
    { num: 10, name: "DNA Running", nbTour: 230, course: course2026_24h },
    { num: 11, name: "Les Éperviers", nbTour: 155, course: course2026_24h },
    { num: 12, name: "Nuits Debout", nbTour: 109, course: course2026_24h },
    { num: 13, name: "Team Café Crème", nbTour: 88, course: course2026_24h },
    { num: 14, name: "Courant d'Air", nbTour: 175, course: course2026_24h },
    { num: 15, name: "Les Mollets Saillants", nbTour: 211, course: course2026_24h },
    // Équipes sur 12h
    { num: 50, name: "Demi-fondeurs", nbTour: 102, course: course2026_12h },
    { num: 51, name: "Midnight Runners Lyon", nbTour: 118, course: course2026_12h },
    { num: 52, name: "GéniCourse", nbTour: 97, course: course2026_12h },
    // Équipes Handisport 6h
    { num: 80, name: "Handis en route", nbTour: 42, course: course2026_6h },
    { num: 81, name: "Rolleurs Invincibles", nbTour: 51, course: course2026_6h },
  ];

  // Prénoms et noms réalistes pour seed
  const firstNames = ["Paul", "Marie", "Thomas", "Julie", "Nicolas", "Emma", "Pierre", "Lucie", "Antoine", "Camille", "Romain", "Sarah", "Maxime", "Léa", "Hugo", "Inès", "Axel", "Zoé", "Clément", "Manon", "Baptiste", "Laura", "Kevin", "Alice", "Quentin", "Chloé", "Matthieu", "Elisa", "Julien", "Amélie"];
  const lastNames = ["Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Simon", "Laurent", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Lefebvre", "Leroy", "Dupont", "Moreau", "Rousseau", "Lambert", "Blanc", "Guerin", "Faure", "Leclerc", "Mayer"];

  const createdTeams: { id: number; courseId: number }[] = [];
  const createdRunners: { id: number; teamId: number }[] = [];

  for (const def of teamDefinitions) {
    // Créer l'équipe sans respRunnerId pour l'instant
    const team = await prisma.team.create({
      data: { num: def.num, name: def.name, nbTour: def.nbTour, courseId: def.course.id },
    });

    // Créer 3 à 6 coureurs par équipe
    const nbRunners = rand(3, 6);
    const teamRunners: { id: number }[] = [];
    for (let i = 0; i < nbRunners; i++) {
      const runner = await prisma.runner.create({
        data: {
          firstName: pick(firstNames),
          lastName: pick(lastNames),
          email: `runner${team.id}_${i}@24h.fr`,
          phone: `06${String(rand(10000000, 99999999))}`,
          teamId: team.id,
        },
      });
      teamRunners.push(runner);
      createdRunners.push({ id: runner.id, teamId: team.id });
    }

    // Désigner le premier coureur comme responsable
    await prisma.team.update({ where: { id: team.id }, data: { respRunnerId: teamRunners[0].id } });
    createdTeams.push({ id: team.id, courseId: def.course.id });
  }

  // Une équipe historique de 2025 (au moins un coureur requis)
  const oldTeam = await prisma.team.create({
    data: { num: 1, name: "Anciens 2025", nbTour: 190, courseId: course2025_24h.id },
  });
  const oldTeamRunner = await prisma.runner.create({
    data: {
      firstName: "Vintage",
      lastName: "Coureur",
      email: "runner_anciens2025@24h.fr",
      phone: "0699000000",
      teamId: oldTeam.id,
    },
  });
  await prisma.team.update({ where: { id: oldTeam.id }, data: { respRunnerId: oldTeamRunner.id } });

  console.log("✅ Équipes et coureurs créés.");

  // ───────────────────────────────────────────────────────────────────────────
  // 5. TRANSPONDEURS + TRANSACTIONS (scénario déterministe centré équipe)
  // ───────────────────────────────────────────────────────────────────────────

  type TeamFinalState = "FINISHED" | "ACTIVE_STABLE" | "ACTIVE_AFTER_ISSUE";
  type TeamScenario = {
    teamId: number;
    finalState: TeamFinalState;
    issueType?: "PERDU" | "DEFAILLANT";
  };

  type SeededTransponder = {
    status: TransponderStatus;
    teamId: number | null;
    events: { type: TransponderStatus; teamId: number }[];
  };

  const RECOVERED_COUNT = 8;
  const ISSUE_COUNT = 4;
  const TOTAL_TRANSPONDERS = 40;

  if (RECOVERED_COUNT > createdTeams.length) {
    throw new Error("Seed incohérente: RECOVERED_COUNT dépasse le nombre d'équipes.");
  }

  const shuffledTeams = shuffle(createdTeams);
  const finishedTeams = shuffledTeams.slice(0, RECOVERED_COUNT);
  const nonFinishedTeams = shuffledTeams.slice(RECOVERED_COUNT);
  if (ISSUE_COUNT > nonFinishedTeams.length) {
    throw new Error("Seed incohérente: ISSUE_COUNT dépasse le nombre d'équipes non terminées.");
  }

  const issueTeams = nonFinishedTeams.slice(0, ISSUE_COUNT);
  const stableActiveTeams = nonFinishedTeams.slice(ISSUE_COUNT);
  const issueTypes: ("PERDU" | "DEFAILLANT")[] = [
    TransponderStatus.PERDU,
    TransponderStatus.PERDU,
    TransponderStatus.DEFAILLANT,
    TransponderStatus.DEFAILLANT,
  ];
  if (issueTypes.length !== ISSUE_COUNT) {
    throw new Error("Seed incohérente: issueTypes doit avoir ISSUE_COUNT éléments.");
  }

  const scenarios: TeamScenario[] = [
    ...finishedTeams.map((team) => ({ teamId: team.id, finalState: "FINISHED" as const })),
    ...issueTeams.map((team, i) => ({
      teamId: team.id,
      finalState: "ACTIVE_AFTER_ISSUE" as const,
      issueType: issueTypes[i],
    })),
    ...stableActiveTeams.map((team) => ({ teamId: team.id, finalState: "ACTIVE_STABLE" as const })),
  ];

  const seededTransponders: SeededTransponder[] = [];

  for (const scenario of scenarios) {
    if (scenario.finalState === "FINISHED") {
      seededTransponders.push({
        status: TransponderStatus.RECUPERE,
        teamId: null,
        events: [
          { type: TransponderStatus.ATTRIBUE, teamId: scenario.teamId },
          { type: TransponderStatus.RECUPERE, teamId: scenario.teamId },
        ],
      });
      continue;
    }

    if (scenario.finalState === "ACTIVE_AFTER_ISSUE") {
      const issueType = scenario.issueType;
      if (!issueType) {
        throw new Error(`Seed incohérente: issueType manquant pour l'équipe #${scenario.teamId}.`);
      }
      seededTransponders.push({
        status: issueType,
        teamId: null,
        events: [
          { type: TransponderStatus.ATTRIBUE, teamId: scenario.teamId },
          { type: issueType, teamId: scenario.teamId },
        ],
      });
      seededTransponders.push({
        status: TransponderStatus.ATTRIBUE,
        teamId: scenario.teamId,
        events: [{ type: TransponderStatus.ATTRIBUE, teamId: scenario.teamId }],
      });
      continue;
    }

    seededTransponders.push({
      status: TransponderStatus.ATTRIBUE,
      teamId: scenario.teamId,
      events: [{ type: TransponderStatus.ATTRIBUE, teamId: scenario.teamId }],
    });
  }

  while (seededTransponders.length < TOTAL_TRANSPONDERS) {
    seededTransponders.push({
      status: TransponderStatus.EN_ATTENTE,
      teamId: null,
      events: [],
    });
  }
  if (seededTransponders.length !== TOTAL_TRANSPONDERS) {
    throw new Error(
      `Seed incohérente: ${seededTransponders.length} transpondeurs générés au lieu de ${TOTAL_TRANSPONDERS}.`,
    );
  }

  const transponderRows: { id: number; status: TransponderStatus; teamId: number | null }[] = [];
  for (const seed of seededTransponders) {
    const t = await prisma.transponder.create({
      data: {
        status: seed.status,
        edition: { connect: { id: edition2026.id } },
        ...(seed.teamId != null ? { team: { connect: { id: seed.teamId } } } : {}),
      },
    });
    transponderRows.push({ id: t.id, status: t.status, teamId: t.teamId });
  }

  const activeTeamIds = [
    ...new Set(
      transponderRows
        .filter((t) => t.status === TransponderStatus.ATTRIBUE && t.teamId != null)
        .map((t) => t.teamId as number),
    ),
  ];
  for (const teamId of activeTeamIds) {
    const teamRow = await prisma.team.findUnique({
      where: { id: teamId },
      select: { respRunnerId: true },
    });
    if (teamRow?.respRunnerId != null) {
      await prisma.team.update({
        where: { id: teamId },
        data: { transponderHolderRunnerId: teamRow.respRunnerId },
      });
    }
  }

  console.log("✅ Transpondeurs créés.");

  // Toutes les dateTime sont strictement avant le 15/03/2026 (UTC).
  const TX_BEFORE = new Date("2026-03-15T00:00:00.000Z");
  const TEAM_TX_BASE = new Date("2026-03-01T10:00:00.000Z");
  const TEAM_SLOT_MS = 3 * 60 * 60 * 1000; // 3h par équipe pour garder l’ordre local explicite.
  const EVENT_STEP_MS = 20 * 60 * 1000; // +20 min entre événements d'une même équipe.
  const clampBeforeMarch15 = (d: Date) =>
    d.getTime() < TX_BEFORE.getTime() ? d : new Date(TX_BEFORE.getTime() - 60_000);

  const transpondersByTeam = new Map<number, { transponderId: number; events: { type: TransponderStatus }[] }[]>();
  for (let i = 0; i < seededTransponders.length; i++) {
    const def = seededTransponders[i];
    if (def.events.length === 0 || def.events[0]?.teamId == null) {
      continue;
    }
    const teamId = def.events[0].teamId;
    const list = transpondersByTeam.get(teamId) ?? [];
    list.push({
      transponderId: transponderRows[i].id,
      events: def.events.map((ev) => ({ type: ev.type })),
    });
    transpondersByTeam.set(teamId, list);
  }

  const scenarioOrder = new Map<number, number>();
  scenarios.forEach((s, idx) => scenarioOrder.set(s.teamId, idx));
  for (const [teamId, teamTransponders] of transpondersByTeam.entries()) {
    const orderedTeamTransponders = teamTransponders.sort((a, b) => {
      const aLast = a.events[a.events.length - 1]?.type;
      const bLast = b.events[b.events.length - 1]?.type;
      const score = (s?: TransponderStatus) => (s === TransponderStatus.ATTRIBUE ? 2 : 1);
      return score(aLast) - score(bLast);
    });
    const base = new Date(
      TEAM_TX_BASE.getTime() + ((scenarioOrder.get(teamId) ?? 0) * TEAM_SLOT_MS),
    );
    let cursorMs = base.getTime();
    for (const teamTransponder of orderedTeamTransponders) {
      for (const event of teamTransponder.events) {
        await prisma.transponderTransaction.create({
          data: {
            transponderId: teamTransponder.transponderId,
            teamId,
            userId: pick(benevoles).id,
            type: event.type,
            dateTime: clampBeforeMarch15(new Date(cursorMs)),
          },
        });
        cursorMs += EVENT_STEP_MS;
      }
    }
  }

  const finishedTeamIds = finishedTeams.map((team) => team.id);
  await Promise.all(
    finishedTeamIds.map((id) => prisma.team.update({ where: { id }, data: { courseFinished: true } })),
  );

  // Assertions d'invariants métier post-seed.
  const activeTransponders = await prisma.transponder.findMany({
    where: { status: TransponderStatus.ATTRIBUE, editionId: edition2026.id },
    select: { id: true, teamId: true },
  });
  const activeCountByTeam = new Map<number, number>();
  for (const tp of activeTransponders) {
    if (tp.teamId == null) {
      throw new Error(`Seed incohérente: transpondeur actif #${tp.id} sans teamId.`);
    }
    activeCountByTeam.set(tp.teamId, (activeCountByTeam.get(tp.teamId) ?? 0) + 1);
  }
  for (const [teamId, count] of activeCountByTeam.entries()) {
    if (count > 1) {
      throw new Error(`Seed incohérente: équipe #${teamId} a ${count} transpondeurs actifs.`);
    }
  }

  const finishedTeamsWithActive = await prisma.team.findMany({
    where: {
      courseFinished: true,
      transponders: { some: { status: TransponderStatus.ATTRIBUE } },
    },
    select: { id: true },
  });
  if (finishedTeamsWithActive.length > 0) {
    throw new Error(
      `Seed incohérente: équipes terminées avec puce active: ${finishedTeamsWithActive.map((t) => t.id).join(", ")}`,
    );
  }

  for (const scenario of scenarios) {
    const tx = await prisma.transponderTransaction.findMany({
      where: { teamId: scenario.teamId },
      orderBy: { dateTime: "asc" },
      select: { type: true },
    });
    for (let i = 1; i < tx.length; i++) {
      if (tx[i - 1].type === TransponderStatus.ATTRIBUE && tx[i].type === TransponderStatus.ATTRIBUE) {
        throw new Error(
          `Seed incohérente: équipe #${scenario.teamId} a deux ATTRIBUE consécutifs dans l'historique.`,
        );
      }
    }
    const lastType = tx[tx.length - 1]?.type;
    if (scenario.finalState === "FINISHED" && lastType !== TransponderStatus.RECUPERE) {
      throw new Error(
        `Seed incohérente: équipe #${scenario.teamId} terminée mais dernier event=${String(lastType)}.`,
      );
    }
    if (
      scenario.finalState !== "FINISHED" &&
      lastType !== TransponderStatus.ATTRIBUE &&
      lastType !== TransponderStatus.PERDU &&
      lastType !== TransponderStatus.DEFAILLANT
    ) {
      throw new Error(
        `Seed incohérente: équipe #${scenario.teamId} non terminée avec dernier event inattendu=${String(lastType)}.`,
      );
    }
  }

  console.log("✅ Transactions créées.");

  // ───────────────────────────────────────────────────────────────────────────
  // 7. LOGS SYSTÈME
  // ───────────────────────────────────────────────────────────────────────────

  const logTypes = [
    LogType.ADD_USER,
    LogType.GIVE_TRANSPONDER, // Remplace ASSIGN_TRANSPONDER par GIVE_TRANSPONDER
    LogType.ADD_TRANSPONDER,
    LogType.RETURN_TRANSPONDER
  ];

  const logMessages = [
    "Nouveau bénévole ajouté au système.",
    "Équipe mise à jour avec le nombre de tours.",
    "Puce transpondeur assignée au coureur.",
    "Nouvelle édition créée pour 2026.",
  ];

  for (let i = 0; i < 25; i++) {
    await prisma.log.create({
      data: {
        userId: adminUser.id, // Utilise l'ID de l'admin créé plus haut
        type: pick(logTypes),  // Utilise les types corrigés
        message: pick(logMessages),
        dateTime: new Date(new Date("2026-05-15T10:00:00Z").getTime() + i * 20 * 60 * 1000),
      },
    });
  }

  console.log("✅ Logs créés.");

  // ───────────────────────────────────────────────────────────────────────────
  // 8. NOTIFICATIONS
  // ───────────────────────────────────────────────────────────────────────────

  const notifMessages = [
    "Votre équipe a dépassé 100 tours !",
    "Une puce a été signalée perdue dans votre zone.",
    "Le classement a été mis à jour.",
    "Ravitaillement disponible au stand central.",
    "Merci pour votre aide en tant que bénévole !",
  ];

  for (const user of [...benevoles, ...participantUsers]) {
    for (let i = 0; i < rand(1, 3); i++) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          message: pick(notifMessages),
          date: new Date(new Date("2026-05-16T14:00:00Z").getTime() + rand(0, 600) * 60 * 1000),
          state: rand(0, 1) === 0 ? "SEEN" as any : "UNSEEN" as any,
        },
      });
    }
  }

  console.log("✅ Notifications créées.");

  // ───────────────────────────────────────────────────────────────────────────
  // 9. CONVERSATIONS ET MESSAGES (Chat organisateurs)
  // ───────────────────────────────────────────────────────────────────────────

  // Conversation #1 : Canal général orga
  const convOrga = await prisma.conversation.create({
    data: {
      name: "Canal Général Orga",
      type: ConversationType.GROUP,
      createdByUserId: adminUser.id,
    },
  });

  // Ajouter des participants (dates cohérentes avec les messages : tout ≤ 28/03/2026 UTC)
  for (const user of [adminUser, benevoleUser, ...benevoles]) {
    await prisma.conversationParticipant.create({
      data: {
        conversationId: convOrga.id,
        userId: user.id,
        role: user.id === adminUser.id ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
        joinedAt: new Date("2026-03-28T08:00:00Z"),
      },
    });
  }

  // Messages dans la conversation orga
  const orgaChatDayStart = new Date("2026-03-28T13:00:00.000Z");
  const orgaMessages = [
    { user: adminUser, content: "Bonjour tout le monde ! Début de l'événement dans quelques heures.", delay: 0 },
    { user: benevoleUser, content: "Tout est prêt côté timing ! Les puces sont chargées.", delay: 10 },
    { user: benevoles[0], content: "Zone de distribution prête. On commence à 13h30.", delay: 20 },
    { user: benevoles[1], content: "Alerte : puce #7 n'a pas été retrouvée après le relais.", delay: 35 },
    { user: adminUser, content: "OK, on va la marquer LOST dans le système. Merci Emma.", delay: 37 },
    { user: benevoleUser, content: "Classement mis à jour ! DNA Running prend la tête !", delay: 120 },
    { user: benevoles[2], content: "Le stand 5 est saturé, besoin de renfort SVP.", delay: 185 },
    { user: adminUser, content: "Jules, je t'envoie quelqu'un.", delay: 186 },
    { user: benevoles[0], content: "Je peux venir, j'ai 30 minutes libres.", delay: 188 },
    { user: benevoleUser, content: "Super ambiance ce soir ! Courage à tous !", delay: 360 },
  ];

  let lastMessageId: number | null = null;
  for (const msg of orgaMessages) {
    const createdMsg = await prisma.message.create({
      data: {
        conversationId: convOrga.id,
        senderUserId: msg.user.id,
        content: msg.content,
        messageType: MessageType.TEXT,
        createdAt: new Date(orgaChatDayStart.getTime() + msg.delay * 60 * 1000),
        replyToMessageId: msg === orgaMessages[4] ? lastMessageId : null,
      },
    });
    lastMessageId = createdMsg.id;
  }

  // Dernier message : 13h + 360 min = 19h le même jour (28/03/2026 UTC)
  await prisma.conversation.update({
    where: { id: convOrga.id },
    data: { lastMessageAt: new Date(orgaChatDayStart.getTime() + 360 * 60 * 1000) },
  });

  const lastOrgaMessage = await prisma.message.findFirst({
    where: { conversationId: convOrga.id },
    orderBy: { id: "desc" },
  });
  if (lastOrgaMessage) {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: convOrga.id },
      data: { lastReadMessageId: lastOrgaMessage.id },
    });
  }

  console.log("✅ Conversations et messages créés.");
  console.log("\n🎉 Seed terminé avec succès !");
  console.log(`   👤 ${5 + benevoles.length + participantUsers.length} utilisateurs`);
  console.log(`   🏆 ${teamDefinitions.length + 1} équipes`);
  console.log(`   🏃 ${createdRunners.length + 1} coureurs`);
  console.log(`   📡 ${transponderRows.length} transpondeurs`);
  console.log(`   🔄 Transactions registrées`);
  console.log(`   💬 1 conversation + ${orgaMessages.length} messages`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
