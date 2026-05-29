import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "organizer@sportsync.dev";
  const existingOrganizer = await prisma.user.findUnique({
    where: { email },
  });

  if (existingOrganizer) {
    console.log(`Seed skipped: ${email} already exists.`);
    return;
  }

  const passwordHash = await bcrypt.hash("Password@123", 12);

  await prisma.user.create({
    data: {
      name: "Demo Organizer",
      email,
      passwordHash,
      role: Role.ORGANIZER,
    },
  });

  console.log(`Seeded demo organizer: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
