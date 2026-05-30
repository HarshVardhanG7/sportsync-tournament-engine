import {
  MatchStage,
  MatchStatus,
  Prisma,
  Role,
  TournamentFormat,
  TournamentStatus,
} from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { fixtureRepository } from "./fixture.repository.js";
import type { ActiveFixtureTeam, FixtureTournamentParams } from "./fixture.types.js";

const AUDIT_ENTITY_TYPE = "Tournament";

function auditLog(userId: string, tournamentId: string, metadata?: Prisma.InputJsonValue) {
  return {
    userId,
    action: "FIXTURES_GENERATED",
    entityType: AUDIT_ENTITY_TYPE,
    entityId: tournamentId,
    ...(metadata ? { metadata } : {}),
  };
}

function assertOrganizer(user: Express.User) {
  if (user.role !== Role.ORGANIZER) {
    throw new AppError("Only organizers can generate fixtures", 403);
  }
}

function assertTournamentOwner(tournament: { organizerId: string }, user: Express.User) {
  if (tournament.organizerId !== user.id) {
    throw new AppError("You do not have access to this tournament", 403);
  }
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

function getKnockoutStage(teamCount: number) {
  if (teamCount === 2) {
    return MatchStage.FINAL;
  }

  if (teamCount === 4) {
    return MatchStage.SEMI_FINAL;
  }

  return MatchStage.QUARTER_FINAL;
}

function createRoundRobinMatches(tournamentId: string, teams: ActiveFixtureTeam[]) {
  const matches: Prisma.MatchCreateManyInput[] = [];
  let matchNumber = 1;

  for (let teamAIndex = 0; teamAIndex < teams.length; teamAIndex += 1) {
    for (let teamBIndex = teamAIndex + 1; teamBIndex < teams.length; teamBIndex += 1) {
      const teamA = teams[teamAIndex];
      const teamB = teams[teamBIndex];

      if (!teamA || !teamB) {
        continue;
      }

      matches.push({
        tournamentId,
        stage: MatchStage.LEAGUE,
        round: 1,
        matchNumber,
        teamAId: teamA.id,
        teamBId: teamB.id,
        status: MatchStatus.SCHEDULED,
      });
      matchNumber += 1;
    }
  }

  return matches;
}

function createKnockoutMatches(tournamentId: string, teams: ActiveFixtureTeam[]) {
  if (!isPowerOfTwo(teams.length) || teams.length < 2 || teams.length > 16) {
    throw new AppError("Knockout tournaments require 2, 4, 8, or 16 active teams", 400);
  }

  const stage = getKnockoutStage(teams.length);
  const matches: Prisma.MatchCreateManyInput[] = [];

  for (let index = 0; index < teams.length; index += 2) {
    const teamA = teams[index];
    const teamB = teams[index + 1];

    if (!teamA || !teamB) {
      continue;
    }

    matches.push({
      tournamentId,
      stage,
      round: 1,
      matchNumber: matches.length + 1,
      teamAId: teamA.id,
      teamBId: teamB.id,
      status: MatchStatus.SCHEDULED,
    });
  }

  return matches;
}

export const fixtureService = {
  async generate(params: FixtureTournamentParams, user: Express.User) {
    assertOrganizer(user);

    const tournament = await fixtureRepository.findTournamentById(params.tournamentId);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    assertTournamentOwner(tournament, user);

    if (tournament.status === TournamentStatus.COMPLETED) {
      throw new AppError("Completed tournaments cannot generate fixtures", 400);
    }

    const existingMatchCount = await fixtureRepository.countMatches(tournament.id);

    if (existingMatchCount > 0) {
      throw new AppError("Fixtures have already been generated for this tournament", 409);
    }

    const teams = await fixtureRepository.findActiveTeams(tournament.id);

    if (teams.length < 2) {
      throw new AppError("At least 2 active teams are required to generate fixtures", 400);
    }

    const matches =
      tournament.format === TournamentFormat.ROUND_ROBIN
        ? createRoundRobinMatches(tournament.id, teams)
        : createKnockoutMatches(tournament.id, teams);

    const fixtures = await fixtureRepository.createFixtures(
      tournament.id,
      matches,
      auditLog(user.id, tournament.id, {
        format: tournament.format,
        matchCount: matches.length,
      }),
    );

    return {
      fixtures,
    };
  },

  async getByTournament(params: FixtureTournamentParams, user: Express.User) {
    const tournament = await fixtureRepository.findTournamentById(params.tournamentId);

    if (!tournament) {
      throw new AppError("Tournament not found", 404);
    }

    if (user.role === Role.ORGANIZER) {
      assertTournamentOwner(tournament, user);
    }

    const fixtures = await fixtureRepository.findMatches(tournament.id);

    return {
      fixtures,
    };
  },
};
