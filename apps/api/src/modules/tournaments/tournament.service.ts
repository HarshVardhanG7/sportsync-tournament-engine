import { Prisma, Role, TournamentStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { tournamentRepository } from "./tournament.repository.js";
import type {
  CreateTournamentInput,
  TournamentIdParams,
  UpdateTournamentInput,
} from "./tournament.types.js";

const AUDIT_ENTITY_TYPE = "Tournament";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

async function createUniqueSlug(name: string, tournamentId?: string) {
  const baseSlug = slugify(name) || "tournament";
  let slug = baseSlug;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = tournamentId
      ? await tournamentRepository.findSlugForOtherTournament(slug, tournamentId)
      : await tournamentRepository.findSlug(slug);

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${createSuffix()}`;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

function assertOrganizer(user: Express.User) {
  if (user.role !== Role.ORGANIZER) {
    throw new AppError("Only organizers can manage tournaments", 403);
  }
}

function assertOwner(tournament: { organizerId: string }, user: Express.User) {
  if (tournament.organizerId !== user.id) {
    throw new AppError("You do not have access to this tournament", 403);
  }
}

function assertValidDates(startDate: Date, endDate: Date) {
  if (startDate >= endDate) {
    throw new AppError("Start date must be before end date", 400);
  }
}

function auditLog(userId: string, action: string, metadata?: Prisma.InputJsonValue) {
  return {
    userId,
    action,
    entityType: AUDIT_ENTITY_TYPE,
    entityId: "",
    ...(metadata ? { metadata } : {}),
  };
}

export const tournamentService = {
  async create(input: CreateTournamentInput, user: Express.User) {
    assertOrganizer(user);
    assertValidDates(input.startDate, input.endDate);

    const slug = await createUniqueSlug(input.name);

    const createData = {
      name: input.name,
      slug,
      sportType: input.sportType,
      ...(input.description !== undefined ? { description: input.description } : {}),
      format: input.format,
      status: TournamentStatus.DRAFT,
      startDate: input.startDate,
      endDate: input.endDate,
      organizerId: user.id,
    };

    const tournament = await tournamentRepository.create(
      createData,
      auditLog(user.id, "TOURNAMENT_CREATED"),
    );

    return { tournament };
  },

  async getMyTournaments(user: Express.User) {
    assertOrganizer(user);
    const tournaments = await tournamentRepository.findMyTournaments(user.id);

    return { tournaments };
  },

  async getById(params: TournamentIdParams, user: Express.User) {
    const tournament = await tournamentRepository.findActiveById(params.id);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    assertOwner(tournament, user);

    return { tournament };
  },

  async update(params: TournamentIdParams, input: UpdateTournamentInput, user: Express.User) {
    assertOrganizer(user);

    const tournament = await tournamentRepository.findActiveById(params.id);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    assertOwner(tournament, user);

    if (tournament.status === TournamentStatus.COMPLETED) {
      throw new AppError("Completed tournaments cannot be updated", 400);
    }

    const startDate = input.startDate ?? tournament.startDate;
    const endDate = input.endDate ?? tournament.endDate;
    assertValidDates(startDate, endDate);

    const data = {
      ...(input.name ? { name: input.name, slug: await createUniqueSlug(input.name, tournament.id) } : {}),
      ...(input.sportType ? { sportType: input.sportType } : {}),
      ...(input.format ? { format: input.format } : {}),
      ...(input.startDate ? { startDate: input.startDate } : {}),
      ...(input.endDate ? { endDate: input.endDate } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    };

    const updatedTournament = await tournamentRepository.update(
      tournament.id,
      data,
      auditLog(user.id, "TOURNAMENT_UPDATED", {
        fields: Object.keys(data),
      }),
    );

    return { tournament: updatedTournament };
  },

  async softDelete(params: TournamentIdParams, user: Express.User) {
    assertOrganizer(user);

    const tournament = await tournamentRepository.findActiveById(params.id);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    assertOwner(tournament, user);

    if (tournament.status === TournamentStatus.COMPLETED) {
      throw new AppError("Completed tournaments cannot be deleted", 400);
    }

    const deletedTournament = await tournamentRepository.softDelete(
      tournament.id,
      auditLog(user.id, "TOURNAMENT_DELETED"),
    );

    return { tournament: deletedTournament };
  },

  async publish(params: TournamentIdParams, user: Express.User) {
    assertOrganizer(user);

    const tournament = await tournamentRepository.findActiveById(params.id);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    assertOwner(tournament, user);

    if (tournament.status !== TournamentStatus.DRAFT) {
      throw new AppError("Only draft tournaments can be published", 400);
    }

    const publishedTournament = await tournamentRepository.transitionStatus(
      tournament.id,
      TournamentStatus.PUBLISHED,
      auditLog(user.id, "TOURNAMENT_PUBLISHED"),
    );

    return { tournament: publishedTournament };
  },

  async complete(params: TournamentIdParams, user: Express.User) {
    assertOrganizer(user);

    const tournament = await tournamentRepository.findActiveById(params.id);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    assertOwner(tournament, user);

    if (
      tournament.status !== TournamentStatus.PUBLISHED &&
      tournament.status !== TournamentStatus.ONGOING
    ) {
      throw new AppError("Only published or ongoing tournaments can be completed", 400);
    }

    const completedTournament = await tournamentRepository.transitionStatus(
      tournament.id,
      TournamentStatus.COMPLETED,
      auditLog(user.id, "TOURNAMENT_COMPLETED"),
    );

    return { tournament: completedTournament };
  },
};
