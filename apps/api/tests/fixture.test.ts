import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { MatchStage, TournamentFormat } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { app } from "../src/app.js";
import request from "supertest";

const organizerEmail = "fixture-organizer@sportsync.dev";
const otherOrganizerEmail = "fixture-other-organizer@sportsync.dev";
const captainEmail = "fixture-captain@sportsync.dev";

async function cleanupUsers() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [organizerEmail, otherOrganizerEmail, captainEmail],
      },
    },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) {
    return;
  }

  const tournaments = await prisma.tournament.findMany({
    where: { organizerId: { in: userIds } },
    select: { id: true },
  });
  const tournamentIds = tournaments.map((tournament) => tournament.id);
  const teams = await prisma.team.findMany({
    where: {
      OR: [{ tournamentId: { in: tournamentIds } }, { captainId: { in: userIds } }],
    },
    select: { id: true },
  });
  const teamIds = teams.map((team) => team.id);
  const matches = await prisma.match.findMany({
    where: { tournamentId: { in: tournamentIds } },
    select: { id: true },
  });
  const matchIds = matches.map((match) => match.id);

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { entityType: "Tournament", entityId: { in: tournamentIds } },
        { entityType: "Team", entityId: { in: teamIds } },
        { entityType: "Match", entityId: { in: matchIds } },
      ],
    },
  });
  await prisma.refreshToken.deleteMany({
    where: { userId: { in: userIds } },
  });
  await prisma.match.deleteMany({
    where: { tournamentId: { in: tournamentIds } },
  });
  await prisma.player.deleteMany({
    where: { teamId: { in: teamIds } },
  });
  await prisma.team.deleteMany({
    where: { id: { in: teamIds } },
  });
  await prisma.tournament.deleteMany({
    where: { id: { in: tournamentIds } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
}

async function registerUser(email: string, role = "ORGANIZER") {
  const response = await request(app).post("/api/v1/auth/register").send({
    name: email.split("@")[0],
    email,
    password: "Password@123",
    role,
  });

  return {
    accessToken: response.body.data.accessToken as string,
    userId: response.body.data.user.id as string,
  };
}

async function createTournament(accessToken: string, format: TournamentFormat) {
  const response = await request(app)
    .post("/api/v1/tournaments")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: `${format} Fixture Cup`,
      sportType: "Football",
      format,
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-10T00:00:00.000Z",
    });

  return response.body.data.tournament.id as string;
}

async function createTeams(accessToken: string, tournamentId: string, count: number) {
  for (let index = 1; index <= count; index += 1) {
    await request(app)
      .post(`/api/v1/tournaments/${tournamentId}/teams`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: `Team ${index}`,
      });
  }
}

function generateFixtures(accessToken: string, tournamentId: string) {
  return request(app)
    .post(`/api/v1/tournaments/${tournamentId}/fixtures/generate`)
    .set("Authorization", `Bearer ${accessToken}`);
}

describe("Fixture integration", () => {
  beforeEach(async () => {
    await cleanupUsers();
  });

  afterAll(async () => {
    await cleanupUsers();
    await prisma.$disconnect();
  });

  it("generates 3 round-robin matches for 3 teams", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.ROUND_ROBIN);
    await createTeams(organizer.accessToken, tournamentId, 3);

    const response = await generateFixtures(organizer.accessToken, tournamentId);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.fixtures).toHaveLength(3);
    expect(response.body.data.fixtures.map((fixture: { stage: string }) => fixture.stage)).toEqual([
      MatchStage.LEAGUE,
      MatchStage.LEAGUE,
      MatchStage.LEAGUE,
    ]);
  });

  it("generates 6 round-robin matches for 4 teams", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.ROUND_ROBIN);
    await createTeams(organizer.accessToken, tournamentId, 4);

    const response = await generateFixtures(organizer.accessToken, tournamentId);

    expect(response.status).toBe(201);
    expect(response.body.data.fixtures).toHaveLength(6);
    expect(response.body.data.fixtures[0].matchNumber).toBe(1);
    expect(response.body.data.fixtures[5].matchNumber).toBe(6);
  });

  it("rejects duplicate fixture generation", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.ROUND_ROBIN);
    await createTeams(organizer.accessToken, tournamentId, 3);
    await generateFixtures(organizer.accessToken, tournamentId);

    const response = await generateFixtures(organizer.accessToken, tournamentId);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "Fixtures have already been generated for this tournament",
    });
  });

  it("rejects fixture generation with less than 2 teams", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.ROUND_ROBIN);
    await createTeams(organizer.accessToken, tournamentId, 1);

    const response = await generateFixtures(organizer.accessToken, tournamentId);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "At least 2 active teams are required to generate fixtures",
    });
  });

  it("generates 2 semi-final matches for a 4-team knockout tournament", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.KNOCKOUT);
    await createTeams(organizer.accessToken, tournamentId, 4);

    const response = await generateFixtures(organizer.accessToken, tournamentId);

    expect(response.status).toBe(201);
    expect(response.body.data.fixtures).toHaveLength(2);
    expect(response.body.data.fixtures.map((fixture: { stage: string }) => fixture.stage)).toEqual([
      MatchStage.SEMI_FINAL,
      MatchStage.SEMI_FINAL,
    ]);
  });

  it("rejects invalid knockout team counts", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.KNOCKOUT);
    await createTeams(organizer.accessToken, tournamentId, 3);

    const response = await generateFixtures(organizer.accessToken, tournamentId);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Knockout tournaments require 2, 4, 8, or 16 active teams",
    });
  });

  it("prevents a non-owner from generating fixtures", async () => {
    const organizer = await registerUser(organizerEmail);
    const otherOrganizer = await registerUser(otherOrganizerEmail);
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.ROUND_ROBIN);
    await createTeams(organizer.accessToken, tournamentId, 3);

    const response = await generateFixtures(otherOrganizer.accessToken, tournamentId);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "You do not have access to this tournament",
    });
  });

  it("prevents a team captain from generating fixtures", async () => {
    const organizer = await registerUser(organizerEmail);
    const captain = await registerUser(captainEmail, "TEAM_CAPTAIN");
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.ROUND_ROBIN);
    await createTeams(organizer.accessToken, tournamentId, 3);

    const response = await generateFixtures(captain.accessToken, tournamentId);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Forbidden",
    });
  });

  it("creates a FIXTURES_GENERATED audit log", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken, TournamentFormat.ROUND_ROBIN);
    await createTeams(organizer.accessToken, tournamentId, 3);

    await generateFixtures(organizer.accessToken, tournamentId);

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "FIXTURES_GENERATED",
        entityType: "Tournament",
        entityId: tournamentId,
      },
    });

    expect(auditLog).not.toBeNull();
  });
});
