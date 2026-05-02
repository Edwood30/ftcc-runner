"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectPrisma = connectPrisma;
exports.disconnectPrisma = disconnectPrisma;
exports.pingPrisma = pingPrisma;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
async function connectPrisma() {
    await exports.prisma.$connect();
    // Confirm the MongoDB server is actually reachable after connecting.
    await pingPrisma();
}
async function disconnectPrisma() {
    await exports.prisma.$disconnect();
}
async function pingPrisma() {
    await exports.prisma.$runCommandRaw({ ping: 1 });
}
