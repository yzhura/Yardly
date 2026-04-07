import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok" as const };
    } catch {
      return { status: "degraded" as const };
    }
  }
}
