import { Prisma, Role, TournamentFormat } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { standingRepository, type PrismaTransaction } from "./standing.repository.js";
import type { StandingTournamentParams } from "./standing.types.js";

const AUDIT_ENTITY_TYPE = "Tournament";

function auditLog(userId: string, tournamentId: string, metadata?: Prisma.InputJsonValue) {
  return {
    userId,
    action: "STANDINGS_RECALCULATED",
    entityType: AUDIT_ENTITY_TYPE,
    entityId: tournamentId,
    ...(metadata ? { metadata } : {}),
  };
}

function assertOrganizer(user: Express.User) {
  if (user.role !== Role.ORGANIZER) {
    throw new AppError("Only organizers can recalculate standings", 403);
  }
}

function assertTournamentOwner(tournament: { organizerId: string }, user: Express.User) {
  if (tournament.organizerId !== user.id) {
    throw new AppError("You do not have access to this tournament", 403);
  }
}

async function assertCanViewTournament(tournamentId: string, user: Express.User, tx?: PrismaTransaction) {
  const tournament = await standingRepository.findTournamentById(tournamentId, tx);

  if (!tournament) {
    throw new AppError("Tournament not found", 404);
  }

  if (user.role === Role.ORGANIZER) {
    assertTournamentOwner(tournament, user);
    return tournament;
  }

  const captainTeamCount = await standingRepository.countCaptainTeams(tournament.id, user.id, tx);

  if (captainTeamCount === 0) {
    throw new AppError("You do not have access to this tournament", 403);
  }

  return tournament;
}

export async function recalculateStandingsForTournament(
  tournamentId: string,
  tx?: PrismaTransaction,
) {
  const tournament = await standingRepository.findTournamentById(tournamentId, tx);

  if (!tournament) {
    throw new AppError("Tournament not found", 404);
  }

  const activeTeams = await standingRepository.findActiveTeams(tournament.id, tx);
  const completedMatches = await standingRepository.findCompletedMatches(tournament.id, tx);

  const standingRows = activeTeams.map((team) => {
    const teamMatches = completedMatches.filter(
      (match) => match.teamAId === team.id || match.teamBId === team.id,
    );
    const won = teamMatches.filter((match) => match.winnerTeamId === team.id).length;
    const drawn =
      tournament.format === TournamentFormat.ROUND_ROBIN
        ? teamMatches.filter((match) => match.winnerTeamId === null).length
        : 0;
    const played = teamMatches.length;
    const lost = played - won - drawn;
    const points = won * 3 + drawn;

    return {
      tournamentId: tournament.id,
      teamId: team.id,
      teamName: team.name,
      played,
      won,
      lost,
      drawn,
      points,
    };
  });

  standingRows.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.won !== a.won) {
      return b.won - a.won;
    }

    return a.teamName.localeCompare(b.teamName);
  });

  const rankedStandings = standingRows.map((standing, index) => ({
    tournamentId: standing.tournamentId,
    teamId: standing.teamId,
    played: standing.played,
    won: standing.won,
    lost: standing.lost,
    drawn: standing.drawn,
    points: standing.points,
    rank: index + 1,
  }));

  await standingRepository.upsertStandings(rankedStandings, tx);

  return standingRepository.findStandings(tournament.id, tx);
}

export const standingService = {
  async getByTournament(params: StandingTournamentParams, user: Express.User) {
    const tournament = await assertCanViewTournament(params.tournamentId, user);
    const standings = await standingRepository.findStandings(tournament.id);

    return { standings };
  },

  async recalculate(params: StandingTournamentParams, user: Express.User) {
    assertOrganizer(user);

    return standingRepository.transaction(async (tx) => {
      const tournament = await assertCanViewTournament(params.tournamentId, user, tx);
      const standings = await recalculateStandingsForTournament(tournament.id, tx);

      await standingRepository.createAuditLog(
        auditLog(user.id, tournament.id, {
          standingCount: standings.length,
        }),
        tx,
      );

      return { standings };
    });
  },
};
