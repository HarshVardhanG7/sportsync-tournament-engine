import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { MatchStage, TournamentFormat, TournamentStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { app } from "../src/app.js";
import request from "supertest";

const organizerEmail = "qualification-organizer@sportsync.dev";
const otherOrganizerEmail = "qualification-other-organizer@sportsync.dev";
const captainEmail = "qualification-captain@sportsync.dev";

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
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.standing.deleteMany({ where: { tournamentId: { in: tournamentIds } } });
  await prisma.match.deleteMany({ where: { tournamentId: { in: tournamentIds } } });
  await prisma.player.deleteMany({ where: { teamId: { in: teamIds } } });
  await prisma.team.deleteMany({ where: { id: { in: teamIds } } });
  await prisma.tournament.deleteMany({ where: { id: { in: tournamentIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
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

async function createTournament(accessToken: string) {
  const response = await request(app)
    .post("/api/v1/tournaments")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Qualification Cup",
      sportType: "Football",
      format: TournamentFormat.ROUND_ROBIN,
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-10T00:00:00.000Z",
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

async function createTournamentWithFixtures(teamNames = ["Alpha", "Beta", "Gamma", "Delta"]) {
  const organizer = await registerUser(organizerEmail);
  const tournamentId = await createTournament(organizer.accessToken);
  await createTeams(organizer.accessToken, tournamentId, teamNames);
  await request(app)
    .post(`/api/v1/tournaments/${tournamentId}/fixtures/generate`)
    .set("Authorization", `Bearer ${organizer.accessToken}`);

  return { organizer, tournamentId };
}

async function getMatches(accessToken: string, tournamentId: string) {
  const response = await request(app)
    .get(`/api/v1/tournaments/${tournamentId}/matches`)
    .set("Authorization", `Bearer ${accessToken}`);

  return response.body.data.matches as {
    id: string;
    stage: MatchStage;
    teamA: { name: string };
    teamB: { name: string };
  }[];
}

async function updateScore(accessToken: string, matchId: string, teamAScore: number, teamBScore: number) {
  await request(app)
    .patch(`/api/v1/matches/${matchId}/score`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ teamAScore, teamBScore });
}

async function completeLeague(accessToken: string, tournamentId: string) {
  const matches = await getMatches(accessToken, tournamentId);

  for (const match of matches.filter((item) => item.stage === MatchStage.LEAGUE)) {
    if (match.teamA.name === "Alpha") {
      await updateScore(accessToken, match.id, 3, 0);
    } else if (match.teamB.name === "Alpha") {
      await updateScore(accessToken, match.id, 0, 3);
    } else if (match.teamA.name === "Beta") {
      await updateScore(accessToken, match.id, 2, 0);
    } else if (match.teamB.name === "Beta") {
      await updateScore(accessToken, match.id, 0, 2);
    } else if (match.teamA.name === "Gamma") {
      await updateScore(accessToken, match.id, 1, 0);
    } else {
      await updateScore(accessToken, match.id, 0, 1);
    }
  }
}

function generateQualifications(accessToken: string, tournamentId: string) {
  return request(app)
    .post(`/api/v1/tournaments/${tournamentId}/qualifications/generate`)
    .set("Authorization", `Bearer ${accessToken}`);
}

describe("Qualification integration", () => {
  beforeEach(async () => {
    await cleanupUsers();
  });

  afterAll(async () => {
    await cleanupUsers();
    await prisma.$disconnect();
  });

  it("rejects qualification generation before all league matches are completed", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures();

    const response = await generateQualifications(organizer.accessToken, tournamentId);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("All league matches must be completed before generating qualifications");
  });

  it("rejects qualification generation with less than 4 teams", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures(["Alpha", "Beta", "Gamma"]);
    await completeLeague(organizer.accessToken, tournamentId);

    const response = await generateQualifications(organizer.accessToken, tournamentId);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("At least 4 active teams are required to generate qualifications");
  });

  it("generates two semi-final matches from top 4 standings", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures();
    await completeLeague(organizer.accessToken, tournamentId);

    const response = await generateQualifications(organizer.accessToken, tournamentId);

    expect(response.status).toBe(201);
    expect(response.body.data.qualifications).toHaveLength(2);
    expect(response.body.data.qualifications.map((match: { stage: string }) => match.stage)).toEqual([
      MatchStage.SEMI_FINAL,
      MatchStage.SEMI_FINAL,
    ]);
    expect(response.body.data.qualifications[0].teamA.name).toBe("Alpha");
    expect(response.body.data.qualifications[0].teamB.name).toBe("Delta");
    expect(response.body.data.qualifications[1].teamA.name).toBe("Beta");
    expect(response.body.data.qualifications[1].teamB.name).toBe("Gamma");
  });

  it("rejects duplicate semi-final generation", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures();
    await completeLeague(organizer.accessToken, tournamentId);
    await generateQualifications(organizer.accessToken, tournamentId);

    const response = await generateQualifications(organizer.accessToken, tournamentId);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Qualifications have already been generated");
  });

  it("generates the final after semi-finals are completed", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures();
    await completeLeague(organizer.accessToken, tournamentId);
    await generateQualifications(organizer.accessToken, tournamentId);
    const semiFinals = (await getMatches(organizer.accessToken, tournamentId)).filter(
      (match) => match.stage === MatchStage.SEMI_FINAL,
    );
    await updateScore(organizer.accessToken, semiFinals[0]!.id, 1, 0);
    await updateScore(organizer.accessToken, semiFinals[1]!.id, 1, 0);

    const response = await generateQualifications(organizer.accessToken, tournamentId);

    expect(response.status).toBe(201);
    const finals = response.body.data.qualifications.filter(
      (match: { stage: string }) => match.stage === MatchStage.FINAL,
    );
    expect(finals).toHaveLength(1);
    expect(finals[0].teamA.name).toBe("Alpha");
    expect(finals[0].teamB.name).toBe("Beta");
  });

  it("marks the tournament completed after the final is completed", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures();
    await completeLeague(organizer.accessToken, tournamentId);
    await generateQualifications(organizer.accessToken, tournamentId);
    const semiFinals = (await getMatches(organizer.accessToken, tournamentId)).filter(
      (match) => match.stage === MatchStage.SEMI_FINAL,
    );
    await updateScore(organizer.accessToken, semiFinals[0]!.id, 1, 0);
    await updateScore(organizer.accessToken, semiFinals[1]!.id, 1, 0);
    await generateQualifications(organizer.accessToken, tournamentId);
    const final = (await getMatches(organizer.accessToken, tournamentId)).find(
      (match) => match.stage === MatchStage.FINAL,
    )!;
    await updateScore(organizer.accessToken, final.id, 2, 0);

    const response = await generateQualifications(organizer.accessToken, tournamentId);

    expect(response.status).toBe(201);
    expect(response.body.data.tournament.status).toBe(TournamentStatus.COMPLETED);
    expect(response.body.data.tournament.winnerTeamId).toEqual(expect.any(String));

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "TOURNAMENT_COMPLETED",
        entityType: "Tournament",
        entityId: tournamentId,
      },
    });

    expect(auditLog).not.toBeNull();
  });

  it("prevents a non-owner from generating qualifications", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures();
    const otherOrganizer = await registerUser(otherOrganizerEmail);
    await completeLeague(organizer.accessToken, tournamentId);

    const response = await generateQualifications(otherOrganizer.accessToken, tournamentId);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You do not have access to this tournament");
  });

  it("prevents a team captain from generating qualifications", async () => {
    const { organizer, tournamentId } = await createTournamentWithFixtures();
    const captain = await registerUser(captainEmail, "TEAM_CAPTAIN");
    await completeLeague(organizer.accessToken, tournamentId);

    const response = await generateQualifications(captain.accessToken, tournamentId);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden");
  });
});
