import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config.js";

const { Pool } = pg;
const adapter = new PrismaPg(
  new Pool({ connectionString: process.env.DATABASE_URL as string }) as any,
);
const prisma = new PrismaClient({ adapter });

const PROD_PASSWORD = "iliasthibaultinsa2026";

const SUPER_ADMINS = [
  {
    email: "ilias.rousseau2005@gmail.com",
    firstName: "Ilias",
    lastName: "ROUSSEAU",
    phone: "0771735786",
  },
  {
    email: "thibault.lefin@insa-lyon.fr",
    firstName: "Thibault",
    lastName: "LEFIN",
    phone: "0772387760",
  },
] as const;

async function clearDatabase() {
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
}

async function main() {
  console.log("🌱 Démarrage du prod_seed...");

  await clearDatabase();
  console.log("✅ Base nettoyée.");

  const bcrypt = await import("bcrypt");
  const hashedPwd = await bcrypt.hash(PROD_PASSWORD, 10);

  for (const admin of SUPER_ADMINS) {
    await prisma.user.create({
      data: {
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        password: hashedPwd,
        role: Role.SUPER_ADMIN,
      },
    });
  }

  console.log(`✅ ${SUPER_ADMINS.length} super-admins créés.`);
  console.log("\n🎉 prod_seed terminé avec succès !");
  for (const admin of SUPER_ADMINS) {
    console.log(`   👤 ${admin.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
