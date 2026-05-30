import { MatchStatus, Prisma, Role, TournamentFormat, TournamentStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { recalculateStandingsForTournament } from "../standings/standing.service.js";
import { matchRepository } from "./match.repository.js";
import type { MatchIdParams, MatchTournamentParams, UpdateMatchScoreInput } from "./match.types.js";

const AUDIT_ENTITY_TYPE = "Match";

function auditLog(userId: string, matchId: string, metadata?: Prisma.InputJsonValue) {
  return {
    userId,
    action: "MATCH_SCORE_UPDATED",
    entityType: AUDIT_ENTITY_TYPE,
    entityId: matchId,
    ...(metadata ? { metadata } : {}),
  };
}

function assertOrganizer(user: Express.User) {
  if (user.role !== Role.ORGANIZER) {
    throw new AppError("Only organizers can update match scores", 403);
  }
}

function assertTournamentOwner(tournament: { organizerId: string }, user: Express.User) {
  if (tournament.organizerId !== user.id) {
    throw new AppError("You do not have access to this tournament", 403);
  }
}

async function assertCanViewTournament(tournamentId: string, user: Express.User) {
  const tournament = await matchRepository.findTournamentById(tournamentId);

  if (!tournament) {
    throw new AppError("Tournament not found", 404);
  }

  if (user.role === Role.ORGANIZER) {
    assertTournamentOwner(tournament, user);
    return tournament;
  }

  const captainTeamCount = await matchRepository.countCaptainTeams(tournament.id, user.id);

  if (captainTeamCount === 0) {
    throw new AppError("You do not have access to this tournament", 403);
  }

  return tournament;
}

function getWinnerTeamId(match: { teamAId: string; teamBId: string }, input: UpdateMatchScoreInput) {
  if (input.teamAScore > input.teamBScore) {
    return match.teamAId;
  }

  if (input.teamBScore > input.teamAScore) {
    return match.teamBId;
  }

  return null;
}

export const matchService = {
  async getByTournament(params: MatchTournamentParams, user: Express.User) {
    const tournament = await assertCanViewTournament(params.tournamentId, user);
    const matches = await matchRepository.findMatchesByTournament(tournament.id);

    return { matches };
  },

  async getById(params: MatchIdParams, user: Express.User) {
    const match = await matchRepository.findMatchById(params.matchId);

    if (!match || match.tournament.deletedAt) {
      throw new AppError("Match not found", 404);
    }

    await assertCanViewTournament(match.tournamentId, user);

    return { match };
  },

  async updateScore(params: MatchIdParams, input: UpdateMatchScoreInput, user: Express.User) {
    assertOrganizer(user);

    const match = await matchRepository.findMatchById(params.matchId);

    if (!match || match.tournament.deletedAt) {
      throw new AppError("Match not found", 404);
    }

    assertTournamentOwner(match.tournament, user);

    if (match.tournament.status === TournamentStatus.COMPLETED) {
      throw new AppError("Completed tournaments cannot update match scores", 400);
    }

    if (
      match.tournament.format === TournamentFormat.KNOCKOUT &&
      input.teamAScore === input.teamBScore
    ) {
      throw new AppError("Knockout matches cannot end in a draw", 400);
    }

    const winnerTeamId = getWinnerTeamId(match, input);

    return matchRepository.transaction(async (tx) => {
      const updatedMatch = await matchRepository.updateScore(
        match.id,
        {
          teamAScore: input.teamAScore,
          teamBScore: input.teamBScore,
          winnerTeamId,
          status: MatchStatus.COMPLETED,
          completedAt: new Date(),
        },
        tx,
      );

      await matchRepository.createAuditLog(
        auditLog(user.id, match.id, {
          tournamentId: match.tournamentId,
          teamAScore: input.teamAScore,
          teamBScore: input.teamBScore,
          winnerTeamId,
        }),
        tx,
      );

      const standings = await recalculateStandingsForTournament(match.tournamentId, tx);

      return {
        match: updatedMatch,
        standings,
      };
    });
  },
};
