import { PrismaClient, Role, TransponderStatus, ConversationType, MessageType, ParticipantRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config.js";
import { LogType } from "@prisma/client";
const { Pool } = pg;
const adapter = new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL as string }) as any);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Retourne un entier aléatoire entre min et max (inclus) */
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
/** Retourne un élément aléatoire d'un tableau */
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

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
  // 5. TRANSPONDEURS (40 puces) + cohérence avec les transactions (§6)
  //
  // Règles alignées sur l’API : ATTRIBUE ⇒ teamId défini ; RECUPERE / PERDU ⇒ teamId null.
  // L’équipe concernée par l’historique (transactions) est stockée dans historyTeamId pour
  // RECUPERE et PERDU afin que les lignes d’audit restent cohérentes sans ré-attacher la puce.
  // ───────────────────────────────────────────────────────────────────────────

  type TransponderSeed = {
    status: TransponderStatus;
    /** FK Transponder.teamId — null si la puce n’est plus chez une équipe (RECUPERE, PERDU, EN_ATTENTE). */
    teamId: number | null;
    /** Équipe pour les lignes TransponderTransaction (attrib / retour ou perte). */
    historyTeamId: number | null;
  };

  const transponderSeeds: TransponderSeed[] = [];

  for (let i = 0; i < 15; i++) {
    const team = pick(createdTeams);
    transponderSeeds.push({
      status: TransponderStatus.ATTRIBUE,
      teamId: team.id,
      historyTeamId: team.id,
    });
  }
  for (let i = 0; i < 10; i++) {
    const team = pick(createdTeams);
    transponderSeeds.push({
      status: TransponderStatus.RECUPERE,
      teamId: null,
      historyTeamId: team.id,
    });
  }
  for (let i = 0; i < 8; i++) {
    transponderSeeds.push({
      status: TransponderStatus.EN_ATTENTE,
      teamId: null,
      historyTeamId: null,
    });
  }
  for (let i = 0; i < 7; i++) {
    const team = pick(createdTeams);
    transponderSeeds.push({
      status: TransponderStatus.PERDU,
      teamId: null,
      historyTeamId: team.id,
    });
  }

  const transponders: { id: number; status: TransponderStatus }[] = [];

  for (const seed of transponderSeeds) {
    const t = await prisma.transponder.create({
      data: {
        status: seed.status,
        edition: { connect: { id: edition2026.id } },
        ...(seed.teamId != null ? { team: { connect: { id: seed.teamId } } } : {}),
      },
    });
    transponders.push({ id: t.id, status: t.status });
  }

  for (const seed of transponderSeeds) {
    if (seed.status === TransponderStatus.ATTRIBUE && seed.teamId != null) {
      const teamRow = await prisma.team.findUnique({
        where: { id: seed.teamId },
        select: { respRunnerId: true },
      });
      if (teamRow?.respRunnerId != null) {
        await prisma.team.update({
          where: { id: seed.teamId },
          data: { transponderHolderRunnerId: teamRow.respRunnerId },
        });
      }
    }
  }

  console.log("✅ Transpondeurs créés.");

  // ───────────────────────────────────────────────────────────────────────────
  // 6. TRANSACTIONS (historique de distribution par les bénévoles)
  // ───────────────────────────────────────────────────────────────────────────

  // Toutes les dateTime sont strictement avant le 15/03/2026 (UTC).
  const TX_BEFORE = new Date("2026-03-15T00:00:00.000Z");
  const baseDate = new Date("2026-03-01T10:00:00.000Z");

  const clampBeforeMarch15 = (d: Date) =>
    d.getTime() < TX_BEFORE.getTime() ? d : new Date(TX_BEFORE.getTime() - 60_000);

  for (let i = 0; i < transponders.length; i++) {
    const t = transponders[i];
    const seed = transponderSeeds[i];
    const benevole = pick(benevoles);
    const teamId = seed.historyTeamId;
    const txDate = clampBeforeMarch15(new Date(baseDate.getTime() + i * 3 * 60 * 1000)); // +3 min par puce

    if (seed.status === TransponderStatus.EN_ATTENTE) {
      continue;
    }

    if (teamId == null) {
      throw new Error(`Seed incohérente: transpondeur #${t.id} sans historyTeamId alors que status=${seed.status}`);
    }

    await prisma.transponderTransaction.create({
      data: {
        transponderId: t.id,
        teamId,
        userId: benevole.id,
        type: TransponderStatus.ATTRIBUE,
        dateTime: txDate,
      },
    });

    if (seed.status === TransponderStatus.ATTRIBUE) {
      continue;
    }

    const secondDate = clampBeforeMarch15(new Date(txDate.getTime() + rand(60, 300) * 60 * 1000));
    await prisma.transponderTransaction.create({
      data: {
        transponderId: t.id,
        teamId,
        userId: benevole.id,
        type: seed.status,
        dateTime: secondDate,
      },
    });
  }

  const teamsFinishedIds = [
    ...new Set(
      transponderSeeds.filter((s) => s.status === TransponderStatus.RECUPERE).map((s) => s.historyTeamId!),
    ),
  ];
  await Promise.all(
    teamsFinishedIds.map((id) => prisma.team.update({ where: { id }, data: { courseFinished: true } })),
  );

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

  // Ajouter des participants
  for (const user of [adminUser, benevoleUser, ...benevoles]) {
    await prisma.conversationParticipant.create({
      data: {
        conversationId: convOrga.id,
        userId: user.id,
        role: user.id === adminUser.id ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
        joinedAt: new Date("2026-05-15T09:00:00Z"),
      },
    });
  }

  // Messages dans la conversation orga
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
        createdAt: new Date(new Date("2026-05-16T13:00:00Z").getTime() + msg.delay * 60 * 1000),
        replyToMessageId: msg === orgaMessages[4] ? lastMessageId : null,
      },
    });
    lastMessageId = createdMsg.id;
  }

  // Mettre à jour `lastMessageAt` sur la conversation
  await prisma.conversation.update({
    where: { id: convOrga.id },
    data: { lastMessageAt: new Date("2026-05-16T19:00:00Z") },
  });

  // Conversation #2 : Discussion privée admin <-> bénévole
  const convPrivee = await prisma.conversation.create({
    data: {
      name: null,
      type: ConversationType.PRIVATE,
      createdByUserId: adminUser.id,
    },
  });
  for (const user of [adminUser, benevoles[1]]) {
    await prisma.conversationParticipant.create({
      data: { conversationId: convPrivee.id, userId: user.id, role: ParticipantRole.MEMBER, joinedAt: new Date() },
    });
  }
  await prisma.message.create({
    data: { conversationId: convPrivee.id, senderUserId: adminUser.id, content: "Emma, tu peux passer au poste 3 ce soir ?", messageType: MessageType.TEXT },
  });
  await prisma.message.create({
    data: { conversationId: convPrivee.id, senderUserId: benevoles[1].id, content: "Oui pas de souci, j'y serai à 22h.", messageType: MessageType.TEXT },
  });

  console.log("✅ Conversations et messages créés.");
  console.log("\n🎉 Seed terminé avec succès !");
  console.log(`   👤 ${5 + benevoles.length + participantUsers.length} utilisateurs`);
  console.log(`   🏆 ${teamDefinitions.length + 1} équipes`);
  console.log(`   🏃 ${createdRunners.length + 1} coureurs`);
  console.log(`   📡 ${transponders.length} transpondeurs`);
  console.log(`   🔄 Transactions registrées`);
  console.log(`   💬 2 conversations + ${orgaMessages.length + 2} messages`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
