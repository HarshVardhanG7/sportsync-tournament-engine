import type { Prisma, Tournament } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export const tournamentRepository = {
  create(data: Prisma.TournamentUncheckedCreateInput, auditLog: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.create({
        data,
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: tournament.id,
        },
      });

      return tournament;
    });
  },

  findActiveById(id: string) {
    return prisma.tournament.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    });
  },

  findSlug(slug: string) {
    return prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    });
  },

  findSlugForOtherTournament(slug: string, tournamentId: string) {
    return prisma.tournament.findFirst({
      where: {
        slug,
        id: {
          not: tournamentId,
        },
      },
      select: { id: true },
    });
  },

  findMyTournaments(organizerId: string) {
    return prisma.tournament.findMany({
      where: {
        organizerId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  update(
    id: string,
    data: Prisma.TournamentUncheckedUpdateInput,
    auditLog: Prisma.AuditLogUncheckedCreateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: id,
        },
      });

      return tournament;
    });
  },

  softDelete(id: string, auditLog: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: id,
        },
      });

      return tournament;
    });
  },

  transitionStatus(
    id: string,
    status: Tournament["status"],
    auditLog: Prisma.AuditLogUncheckedCreateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.update({
        where: { id },
        data: { status },
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: id,
        },
      });

      return tournament;
    });
  },
};
