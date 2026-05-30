import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { MatchStatus, TournamentFormat } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { app } from "../src/app.js";
import request from "supertest";

const organizerEmail = "match-standing-organizer@sportsync.dev";
const otherOrganizerEmail = "match-standing-other-organizer@sportsync.dev";
const captainEmail = "match-standing-captain@sportsync.dev";

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
  await prisma.standing.deleteMany({
    where: { tournamentId: { in: tournamentIds } },
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
      name: `${format} Match Cup`,
      sportType: "Football",
      format,
      startDate: "2026-09-01T00:00:00.000Z",
      endDate: "2026-09-10T00:00:00.000Z",
    });

  return response.body.data.tournament.id as string;
}

async function createTeams(accessToken: string, tournamentId: string, names: string[]) {
  for (const name of names) {
    await request(app)
      .post(`/api/v1/tournaments/${tournamentId}/teams`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name });
  }
}

async function createTournamentWithFixtures(format = TournamentFormat.ROUND_ROBIN, names = ["Alpha", "Beta"]) {
  const organizer = await registerUser(organizerEmail);
  const tournamentId = await createTournament(organizer.accessToken, format);
  await createTeams(organizer.accessToken, tournamentId, names);
  await request(app)
    .post(`/api/v1/tournaments/${tournamentId}/fixtures/generate`)
    .set("Authorization", `Bearer ${organizer.accessToken}`);

  const matchesResponse = await request(app)
    .get(`/api/v1/tournaments/${tournamentId}/matches`)
    .set("Authorization", `Bearer ${organizer.accessToken}`);

  return {
    organizer,
    tournamentId,
    matches: matchesResponse.body.data.matches as {
      id: string;
      teamA: { id: string; name: string };
      teamB: { id: string; name: string };
    }[],
  };
}

function updateScore(accessToken: string, matchId: string, teamAScore: number, teamBScore: number) {
  return request(app)
    .patch(`/api/v1/matches/${matchId}/score`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      teamAScore,
      teamBScore,
    });
}

describe("Match and standing integration", () => {
  beforeEach(async () => {
    await cleanupUsers();
  });

  afterAll(async () => {
    await cleanupUsers();
    await prisma.$disconnect();
  });

  it("gets tournament matches", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures();

    const response = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}/matches`)
      .set("Authorization", `Bearer ${organizer.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.matches).toHaveLength(1);
    expect(response.body.data.matches[0].teamA.name).toBe("Alpha");
    expect(response.body.data.matches[0].teamB.name).toBe("Beta");
  });

  it("updates a score successfully", async () => {
    const { organizer, matches } = await createTournamentWithFixtures();

    const response = await updateScore(organizer.accessToken, matches[0]!.id, 2, 1);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.match.teamAScore).toBe(2);
    expect(response.body.data.match.teamBScore).toBe(1);
    expect(response.body.data.match.status).toBe(MatchStatus.COMPLETED);
    expect(response.body.data.match.winnerTeam.id).toBe(matches[0]!.teamA.id);
  });

  it("rejects negative scores", async () => {
    const { organizer, matches } = await createTournamentWithFixtures();

    const response = await updateScore(organizer.accessToken, matches[0]!.id, -1, 1);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Team A score must be a non-negative integer");
  });

  it("rejects knockout draws", async () => {
    const { organizer, matches } = await createTournamentWithFixtures(TournamentFormat.KNOCKOUT);

    const response = await updateScore(organizer.accessToken, matches[0]!.id, 1, 1);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Knockout matches cannot end in a draw",
    });
  });

  it("prevents a non-owner from updating a score", async () => {
    const { matches } = await createTournamentWithFixtures();
    const otherOrganizer = await registerUser(otherOrganizerEmail);

    const response = await updateScore(otherOrganizer.accessToken, matches[0]!.id, 2, 1);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "You do not have access to this tournament",
    });
  });

  it("updates standings after a score update", async () => {
    const { organizer, tournamentId, matches } = await createTournamentWithFixtures();

    await updateScore(organizer.accessToken, matches[0]!.id, 2, 1);

    const response = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}/standings`)
      .set("Authorization", `Bearer ${organizer.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.standings).toHaveLength(2);
    expect(response.body.data.standings[0].team.name).toBe("Alpha");
    expect(response.body.data.standings[0].points).toBe(3);
    expect(response.body.data.standings[1].team.name).toBe("Beta");
    expect(response.body.data.standings[1].points).toBe(0);
  });

  it("ranks standings by points, wins, then team name", async () => {
    const { organizer, tournamentId, matches } = await createTournamentWithFixtures(
      TournamentFormat.ROUND_ROBIN,
      ["Alpha", "Beta", "Gamma"],
    );

    const alphaBeta = matches.find(
      (match) => match.teamA.name === "Alpha" && match.teamB.name === "Beta",
    )!;
    const alphaGamma = matches.find(
      (match) => match.teamA.name === "Alpha" && match.teamB.name === "Gamma",
    )!;
    const betaGamma = matches.find(
      (match) => match.teamA.name === "Beta" && match.teamB.name === "Gamma",
    )!;

    await updateScore(organizer.accessToken, alphaBeta.id, 1, 0);
    await updateScore(organizer.accessToken, alphaGamma.id, 0, 0);
    await updateScore(organizer.accessToken, betaGamma.id, 2, 0);

    const response = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}/standings`)
      .set("Authorization", `Bearer ${organizer.accessToken}`);

    expect(response.body.data.standings.map((standing: { team: { name: string } }) => standing.team.name)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    expect(response.body.data.standings.map((standing: { points: number }) => standing.points)).toEqual([
      4,
      3,
      1,
    ]);
  });

  it("manually recalculates standings", async () => {
    const { organizer, tournamentId, matches } = await createTournamentWithFixtures();
    await updateScore(organizer.accessToken, matches[0]!.id, 1, 1);

    const response = await request(app)
      .post(`/api/v1/tournaments/${tournamentId}/standings/recalculate`)
      .set("Authorization", `Bearer ${organizer.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.standings).toHaveLength(2);
    expect(response.body.data.standings[0].points).toBe(1);

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "STANDINGS_RECALCULATED",
        entityType: "Tournament",
        entityId: tournamentId,
      },
    });

    expect(auditLog).not.toBeNull();
  });
});
