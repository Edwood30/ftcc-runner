import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
  // Confirm the MongoDB server is actually reachable after connecting.
  await pingPrisma();
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export async function pingPrisma(): Promise<void> {
  await prisma.$runCommandRaw({ ping: 1 });
}
