import { Prisma, Role, TournamentStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { teamRepository } from "./team.repository.js";
import type {
  CreateTeamInput,
  TeamIdParams,
  TournamentTeamsParams,
  UpdateTeamInput,
} from "./team.types.js";

const AUDIT_ENTITY_TYPE = "Team";

function auditLog(userId: string, action: string, metadata?: Prisma.InputJsonValue) {
  return {
    userId,
    action,
    entityType: AUDIT_ENTITY_TYPE,
    entityId: "",
    ...(metadata ? { metadata } : {}),
  };
}

function assertOrganizer(user: Express.User) {
  if (user.role !== Role.ORGANIZER) {
    throw new AppError("Only organizers can manage teams", 403);
  }
}

function assertTournamentOwner(tournament: { organizerId: string }, user: Express.User) {
  if (tournament.organizerId !== user.id) {
    throw new AppError("You do not have access to this tournament", 403);
  }
}

function assertTournamentCanBeManaged(tournament: { status: TournamentStatus }) {
  if (tournament.status === TournamentStatus.COMPLETED) {
    throw new AppError("Completed tournaments cannot be modified", 400);
  }
}

function assertCaptainCanReadTeam(team: { captainId: string | null }, user: Express.User) {
  if (user.role === Role.TEAM_CAPTAIN && team.captainId !== user.id) {
    throw new AppError("You do not have access to this team", 403);
  }
}

async function validateCaptain(captainId: string | undefined | null, tournamentId: string, teamId?: string) {
  if (!captainId) {
    return;
  }

  const captain = await teamRepository.findCaptainById(captainId);

  if (!captain || captain.role !== Role.TEAM_CAPTAIN) {
    throw new AppError("Captain must be an existing team captain user", 400);
  }

  const existingCaptainTeam = await teamRepository.findCaptainTeamInTournament(
    captainId,
    tournamentId,
    teamId,
  );

  if (existingCaptainTeam) {
    throw new AppError("Captain is already assigned to a team in this tournament", 409);
  }
}

async function validateUniqueTeamName(tournamentId: string, name: string, teamId?: string) {
  const existingTeam = await teamRepository.findActiveTeamName(tournamentId, name, teamId);

  if (existingTeam) {
    throw new AppError("Team name already exists in this tournament", 409);
  }
}

export const teamService = {
  async create(params: TournamentTeamsParams, input: CreateTeamInput, user: Express.User) {
    assertOrganizer(user);

    const tournament = await teamRepository.findTournamentById(params.tournamentId);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    assertTournamentOwner(tournament, user);
    assertTournamentCanBeManaged(tournament);
    await validateUniqueTeamName(tournament.id, input.name);
    await validateCaptain(input.captainId, tournament.id);

    const team = await teamRepository.create(
      {
        name: input.name,
        tournamentId: tournament.id,
        ...(input.captainId ? { captainId: input.captainId } : {}),
      },
      auditLog(user.id, "TEAM_CREATED", {
        tournamentId: tournament.id,
      }),
    );

    return { team };
  },

  async getByTournament(params: TournamentTeamsParams, user: Express.User) {
    const tournament = await teamRepository.findTournamentById(params.tournamentId);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    if (user.role === Role.ORGANIZER) {
      assertTournamentOwner(tournament, user);
      return {
        teams: await teamRepository.findActiveByTournament(tournament.id),
      };
    }

    return {
      teams: await teamRepository.findActiveByTournament(tournament.id, user.id),
    };
  },

  async getById(params: TeamIdParams, user: Express.User) {
    const team = await teamRepository.findActiveById(params.teamId);

    if (!team || team.tournament.deletedAt) {
      throw new AppError("Team not found", 404);
    }

    if (user.role === Role.ORGANIZER) {
      assertTournamentOwner(team.tournament, user);
    } else {
      assertCaptainCanReadTeam(team, user);
    }

    return { team };
  },

  async update(params: TeamIdParams, input: UpdateTeamInput, user: Express.User) {
    assertOrganizer(user);

    const team = await teamRepository.findActiveById(params.teamId);

    if (!team || team.tournament.deletedAt) {
      throw new AppError("Team not found", 404);
    }

    assertTournamentOwner(team.tournament, user);
    assertTournamentCanBeManaged(team.tournament);

    if (input.name) {
      await validateUniqueTeamName(team.tournamentId, input.name, team.id);
    }

    if (input.captainId !== undefined) {
      await validateCaptain(input.captainId, team.tournamentId, team.id);
    }

    const data = {
      ...(input.name ? { name: input.name } : {}),
      ...(input.captainId !== undefined ? { captainId: input.captainId } : {}),
    };

    const updatedTeam = await teamRepository.update(
      team.id,
      data,
      auditLog(user.id, "TEAM_UPDATED", {
        fields: Object.keys(data),
        tournamentId: team.tournamentId,
      }),
    );

    return { team: updatedTeam };
  },

  async softDelete(params: TeamIdParams, user: Express.User) {
    assertOrganizer(user);

    const team = await teamRepository.findActiveById(params.teamId);

    if (!team || team.tournament.deletedAt) {
      throw new AppError("Team not found", 404);
    }

    assertTournamentOwner(team.tournament, user);
    assertTournamentCanBeManaged(team.tournament);

    const deletedTeam = await teamRepository.softDelete(
      team.id,
      auditLog(user.id, "TEAM_DELETED", {
        tournamentId: team.tournamentId,
      }),
    );

    return { team: deletedTeam };
  },
};
