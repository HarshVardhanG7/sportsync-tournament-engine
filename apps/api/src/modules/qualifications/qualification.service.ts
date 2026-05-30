import {
  MatchStage,
  MatchStatus,
  Prisma,
  Role,
  TournamentFormat,
  TournamentStatus,
} from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { qualificationRepository } from "./qualification.repository.js";
import type { QualificationTournamentParams } from "./qualification.types.js";

const TOURNAMENT_ENTITY = "Tournament";

function auditLog(userId: string, action: string, tournamentId: string, metadata?: Prisma.InputJsonValue) {
  return {
    userId,
    action,
    entityType: TOURNAMENT_ENTITY,
    entityId: tournamentId,
    ...(metadata ? { metadata } : {}),
  };
}

function assertOrganizer(user: Express.User) {
  if (user.role !== Role.ORGANIZER) {
    throw new AppError("Only organizers can generate qualifications", 403);
  }
}

function assertTournamentOwner(tournament: { organizerId: string }, user: Express.User) {
  if (tournament.organizerId !== user.id) {
    throw new AppError("You do not have access to this tournament", 403);
  }
}

async function assertCanViewTournament(tournamentId: string, user: Express.User) {
  const tournament = await qualificationRepository.findTournamentById(tournamentId);

  if (!tournament) {
    throw new AppError("Tournament not found", 404);
  }

  if (user.role === Role.ORGANIZER) {
    assertTournamentOwner(tournament, user);
    return tournament;
  }

  const captainTeamCount = await qualificationRepository.countCaptainTeams(tournament.id, user.id);

  if (captainTeamCount === 0) {
    throw new AppError("You do not have access to this tournament", 403);
  }

  return tournament;
}

export const qualificationService = {
  async generate(params: QualificationTournamentParams, user: Express.User) {
    assertOrganizer(user);

    return qualificationRepository.transaction(async (tx) => {
      const tournament = await qualificationRepository.findTournamentById(params.tournamentId, tx);

      if (!tournament) {
        throw new AppError("Tournament not found", 404);
      }

      assertTournamentOwner(tournament, user);

      if (tournament.format !== TournamentFormat.ROUND_ROBIN) {
        throw new AppError("Qualifications can only be generated for round robin tournaments", 400);
      }

      if (tournament.status === TournamentStatus.COMPLETED) {
        throw new AppError("Tournament is already completed", 400);
      }

      const playoffMatches = await qualificationRepository.findPlayoffMatches(tournament.id, tx);
      const semiFinals = playoffMatches.filter((match) => match.stage === MatchStage.SEMI_FINAL);
      const finals = playoffMatches.filter((match) => match.stage === MatchStage.FINAL);

      if (semiFinals.length === 0) {
        const activeTeamCount = await qualificationRepository.countActiveTeams(tournament.id, tx);

        if (activeTeamCount < 4) {
          throw new AppError("At least 4 active teams are required to generate qualifications", 400);
        }

        const incompleteLeagueMatches = await qualificationRepository.countIncompleteLeagueMatches(
          tournament.id,
          tx,
        );

        if (incompleteLeagueMatches > 0) {
          throw new AppError("All league matches must be completed before generating qualifications", 400);
        }

        const standings = await qualificationRepository.findStandings(tournament.id, tx);
        const topFour = standings.slice(0, 4);

        if (topFour.length < 4) {
          throw new AppError("Top 4 standings are required to generate qualifications", 400);
        }

        const maxMatchNumber = await qualificationRepository.getMaxMatchNumber(tournament.id, tx);
        const nextMatchNumber = (maxMatchNumber._max.matchNumber ?? 0) + 1;
        const semiFinalMatches = [
          {
            tournamentId: tournament.id,
            stage: MatchStage.SEMI_FINAL,
            round: 2,
            matchNumber: nextMatchNumber,
            teamAId: topFour[0]!.teamId,
            teamBId: topFour[3]!.teamId,
            status: MatchStatus.SCHEDULED,
          },
          {
            tournamentId: tournament.id,
            stage: MatchStage.SEMI_FINAL,
            round: 2,
            matchNumber: nextMatchNumber + 1,
            teamAId: topFour[1]!.teamId,
            teamBId: topFour[2]!.teamId,
            status: MatchStatus.SCHEDULED,
          },
        ];

        await qualificationRepository.createMatches(
          semiFinalMatches,
          auditLog(user.id, "QUALIFICATION_GENERATED", tournament.id, {
            qualifiedTeamIds: topFour.map((standing) => standing.teamId),
          }),
          tx,
        );

        return {
          qualifications: await qualificationRepository.findPlayoffMatches(tournament.id, tx),
        };
      }

      if (semiFinals.length >= 2 && finals.length === 0) {
        const completedSemiFinals = semiFinals.filter(
          (match) => match.status === MatchStatus.COMPLETED && match.winnerTeamId,
        );

        if (completedSemiFinals.length < 2) {
          throw new AppError("Qualifications have already been generated", 409);
        }

        const maxMatchNumber = await qualificationRepository.getMaxMatchNumber(tournament.id, tx);
        const finalMatch = {
          tournamentId: tournament.id,
          stage: MatchStage.FINAL,
          round: 3,
          matchNumber: (maxMatchNumber._max.matchNumber ?? 0) + 1,
          teamAId: completedSemiFinals[0]!.winnerTeamId!,
          teamBId: completedSemiFinals[1]!.winnerTeamId!,
          status: MatchStatus.SCHEDULED,
        };

        await qualificationRepository.createMatches(
          [finalMatch],
          auditLog(user.id, "FINAL_GENERATED", tournament.id, {
            finalistTeamIds: [finalMatch.teamAId, finalMatch.teamBId],
          }),
          tx,
        );

        return {
          qualifications: await qualificationRepository.findPlayoffMatches(tournament.id, tx),
        };
      }

      const finalMatch = finals[0];

      if (finalMatch?.status === MatchStatus.COMPLETED && finalMatch.winnerTeamId) {
        const tournamentCompleted = await qualificationRepository.completeTournament(
          tournament.id,
          finalMatch.winnerTeamId,
          auditLog(user.id, "TOURNAMENT_COMPLETED", tournament.id, {
            winnerTeamId: finalMatch.winnerTeamId,
          }),
          tx,
        );

        return {
          tournament: tournamentCompleted,
          qualifications: await qualificationRepository.findPlayoffMatches(tournament.id, tx),
        };
      }

      throw new AppError("Qualifications have already been generated", 409);
    });
  },

  async getByTournament(params: QualificationTournamentParams, user: Express.User) {
    const tournament = await assertCanViewTournament(params.tournamentId, user);
    const qualifications = await qualificationRepository.findPlayoffMatches(tournament.id);

    return { qualifications };
  },
};
