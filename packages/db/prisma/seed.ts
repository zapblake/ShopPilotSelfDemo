import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const job = await prisma.previewJob.upsert({
    where: { id: "seed-preview-job-001" },
    update: {},
    create: {
      id: "seed-preview-job-001",
      submittedUrl: "https://example-store.myshopify.com",
      normalizedDomain: "example-store.myshopify.com",
      status: "PENDING",
      email: "demo@zapsight.us",
    },
  });

  console.log("Seeded preview job:", job.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
