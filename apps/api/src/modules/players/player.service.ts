import { Prisma, Role, TournamentStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { playerRepository } from "./player.repository.js";
import type {
  CreatePlayerInput,
  PlayerIdParams,
  TeamPlayersParams,
  UpdatePlayerInput,
} from "./player.types.js";

const AUDIT_ENTITY_TYPE = "Player";

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
    throw new AppError("Only organizers can manage players", 403);
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

async function validateUniqueJerseyNumber(teamId: string, jerseyNumber?: number | null, playerId?: string) {
  if (!jerseyNumber) {
    return;
  }

  const existingPlayer = await playerRepository.findActiveJerseyNumber(teamId, jerseyNumber, playerId);

  if (existingPlayer) {
    throw new AppError("Jersey number already exists in this team", 409);
  }
}

export const playerService = {
  async create(params: TeamPlayersParams, input: CreatePlayerInput, user: Express.User) {
    assertOrganizer(user);

    const team = await playerRepository.findActiveTeamById(params.teamId);

    if (!team || team.tournament.deletedAt) {
      throw new AppError("Team not found", 404);
    }

    assertTournamentOwner(team.tournament, user);
    assertTournamentCanBeManaged(team.tournament);
    await validateUniqueJerseyNumber(team.id, input.jerseyNumber);

    const player = await playerRepository.create(
      {
        name: input.name,
        teamId: team.id,
        ...(input.jerseyNumber !== undefined ? { jerseyNumber: input.jerseyNumber } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
      auditLog(user.id, "PLAYER_CREATED", {
        teamId: team.id,
        tournamentId: team.tournamentId,
      }),
    );

    return { player };
  },

  async getByTeam(params: TeamPlayersParams, user: Express.User) {
    const team = await playerRepository.findActiveTeamById(params.teamId);

    if (!team || team.tournament.deletedAt) {
      throw new AppError("Team not found", 404);
    }

    if (user.role === Role.ORGANIZER) {
      assertTournamentOwner(team.tournament, user);
    } else {
      assertCaptainCanReadTeam(team, user);
    }

    return {
      players: await playerRepository.findActiveByTeam(team.id),
    };
  },

  async getById(params: PlayerIdParams, user: Express.User) {
    const player = await playerRepository.findActivePlayerById(params.playerId);

    if (!player || player.team.deletedAt || player.team.tournament.deletedAt) {
      throw new AppError("Player not found", 404);
    }

    if (user.role === Role.ORGANIZER) {
      assertTournamentOwner(player.team.tournament, user);
    } else {
      assertCaptainCanReadTeam(player.team, user);
    }

    return { player };
  },

  async update(params: PlayerIdParams, input: UpdatePlayerInput, user: Express.User) {
    assertOrganizer(user);

    const player = await playerRepository.findActivePlayerById(params.playerId);

    if (!player || player.team.deletedAt || player.team.tournament.deletedAt) {
      throw new AppError("Player not found", 404);
    }

    assertTournamentOwner(player.team.tournament, user);
    assertTournamentCanBeManaged(player.team.tournament);
    await validateUniqueJerseyNumber(player.teamId, input.jerseyNumber, player.id);

    const data = {
      ...(input.name ? { name: input.name } : {}),
      ...(input.jerseyNumber !== undefined ? { jerseyNumber: input.jerseyNumber } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    };

    const updatedPlayer = await playerRepository.update(
      player.id,
      data,
      auditLog(user.id, "PLAYER_UPDATED", {
        fields: Object.keys(data),
        teamId: player.teamId,
        tournamentId: player.team.tournamentId,
      }),
    );

    return { player: updatedPlayer };
  },

  async softDelete(params: PlayerIdParams, user: Express.User) {
    assertOrganizer(user);

    const player = await playerRepository.findActivePlayerById(params.playerId);

    if (!player || player.team.deletedAt || player.team.tournament.deletedAt) {
      throw new AppError("Player not found", 404);
    }

    assertTournamentOwner(player.team.tournament, user);
    assertTournamentCanBeManaged(player.team.tournament);

    const deletedPlayer = await playerRepository.softDelete(
      player.id,
      auditLog(user.id, "PLAYER_DELETED", {
        teamId: player.teamId,
        tournamentId: player.team.tournamentId,
      }),
    );

    return { player: deletedPlayer };
  },
};
