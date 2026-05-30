import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { TournamentFormat, TournamentStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { app } from "../src/app.js";
import request from "supertest";

const organizerEmail = "public-organizer@sportsync.dev";

async function cleanupUsers() {
  const users = await prisma.user.findMany({
    where: {
      email: organizerEmail,
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
    where: { tournamentId: { in: tournamentIds } },
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

async function registerOrganizer() {
  const response = await request(app).post("/api/v1/auth/register").send({
    name: "public-organizer",
    email: organizerEmail,
    password: "Password@123",
    role: "ORGANIZER",
  });

  return response.body.data.accessToken as string;
}

async function createTournament(accessToken: string, name: string, publish = true) {
  const response = await request(app)
    .post("/api/v1/tournaments")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name,
      sportType: "Football",
      format: TournamentFormat.ROUND_ROBIN,
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-10T00:00:00.000Z",
      description: `${name} description`,
    });

  const tournament = response.body.data.tournament as { id: string; slug: string };

  if (publish) {
    await request(app)
      .patch(`/api/v1/tournaments/${tournament.id}/publish`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  return tournament;
}

async function createTeam(accessToken: string, tournamentId: string, name: string) {
  const response = await request(app)
    .post(`/api/v1/tournaments/${tournamentId}/teams`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name });

  return response.body.data.team as { id: string; name: string };
}

async function createPublishedTournamentWithTeams(accessToken: string) {
  const tournament = await createTournament(accessToken, "Public Cup");
  const alpha = await createTeam(accessToken, tournament.id, "Alpha");
  const beta = await createTeam(accessToken, tournament.id, "Beta");

  return { tournament, alpha, beta };
}

describe("Public tournament integration", () => {
  beforeEach(async () => {
    await cleanupUsers();
  });

  afterAll(async () => {
    await cleanupUsers();
    await prisma.$disconnect();
  });

  it("lists public tournaments", async () => {
    const accessToken = await registerOrganizer();
    await createTournament(accessToken, "Visible Public Cup");

    const response = await request(app).get("/api/v1/public/tournaments?search=Visible%20Public");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tournaments).toHaveLength(1);
    expect(response.body.data.tournaments[0].name).toBe("Visible Public Cup");
    expect(response.body.data.pagination.total).toBe(1);
  });

  it("hides draft tournaments", async () => {
    const accessToken = await registerOrganizer();
    await createTournament(accessToken, "Visible Public Cup");
    await createTournament(accessToken, "Hidden Draft Cup", false);

    const response = await request(app).get("/api/v1/public/tournaments?search=Cup");

    expect(response.body.data.tournaments.map((tournament: { name: string }) => tournament.name)).toEqual([
      "Visible Public Cup",
    ]);
  });

  it("gets a tournament by slug", async () => {
    const accessToken = await registerOrganizer();
    const { tournament } = await createPublishedTournamentWithTeams(accessToken);

    const response = await request(app).get(`/api/v1/public/tournaments/${tournament.slug}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tournament.name).toBe("Public Cup");
    expect(response.body.data.tournament.teamsCount).toBe(2);
    expect(response.body.data.tournament.matchesCount).toBe(0);
  });

  it("gets active teams", async () => {
    const accessToken = await registerOrganizer();
    const { tournament } = await createPublishedTournamentWithTeams(accessToken);

    const response = await request(app).get(`/api/v1/public/tournaments/${tournament.slug}/teams`);

    expect(response.status).toBe(200);
    expect(response.body.data.teams.map((team: { name: string }) => team.name)).toEqual([
      "Alpha",
      "Beta",
    ]);
    expect(response.body.data.teams[0]._count.players).toBe(0);
  });

  it("gets matches", async () => {
    const accessToken = await registerOrganizer();
    const { tournament } = await createPublishedTournamentWithTeams(accessToken);
    await request(app)
      .post(`/api/v1/tournaments/${tournament.id}/fixtures/generate`)
      .set("Authorization", `Bearer ${accessToken}`);

    const response = await request(app).get(`/api/v1/public/tournaments/${tournament.slug}/matches`);

    expect(response.status).toBe(200);
    expect(response.body.data.matches).toHaveLength(1);
    expect(response.body.data.matches[0].matchNumber).toBe(1);
    expect(response.body.data.matches[0].teamA.name).toBe("Alpha");
    expect(response.body.data.matches[0].teamB.name).toBe("Beta");
  });

  it("gets standings", async () => {
    const accessToken = await registerOrganizer();
    const { tournament } = await createPublishedTournamentWithTeams(accessToken);
    await request(app)
      .post(`/api/v1/tournaments/${tournament.id}/fixtures/generate`)
      .set("Authorization", `Bearer ${accessToken}`);
    const matchesResponse = await request(app)
      .get(`/api/v1/tournaments/${tournament.id}/matches`)
      .set("Authorization", `Bearer ${accessToken}`);
    await request(app)
      .patch(`/api/v1/matches/${matchesResponse.body.data.matches[0].id}/score`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ teamAScore: 2, teamBScore: 1 });

    const response = await request(app).get(`/api/v1/public/tournaments/${tournament.slug}/standings`);

    expect(response.status).toBe(200);
    expect(response.body.data.standings).toHaveLength(2);
    expect(response.body.data.standings[0].rank).toBe(1);
    expect(response.body.data.standings[0].points).toBe(3);
  });

  it("hides soft-deleted data", async () => {
    const accessToken = await registerOrganizer();
    const visible = await createTournament(accessToken, "Visible Public Cup");
    const deleted = await createTournament(accessToken, "Deleted Public Cup");
    const deletedTeam = await createTeam(accessToken, visible.id, "Deleted Team");

    await request(app)
      .delete(`/api/v1/tournaments/${deleted.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    await request(app)
      .delete(`/api/v1/teams/${deletedTeam.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    const listResponse = await request(app).get("/api/v1/public/tournaments?search=Public%20Cup");
    const teamsResponse = await request(app).get(`/api/v1/public/tournaments/${visible.slug}/teams`);

    expect(listResponse.body.data.tournaments.map((tournament: { name: string }) => tournament.name)).toEqual([
      "Visible Public Cup",
    ]);
    expect(teamsResponse.body.data.teams).toHaveLength(0);
  });

  it("returns winner for completed tournaments", async () => {
    const accessToken = await registerOrganizer();
    const { tournament, alpha } = await createPublishedTournamentWithTeams(accessToken);

    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        status: TournamentStatus.COMPLETED,
        winnerTeamId: alpha.id,
      },
    });

    const response = await request(app).get(`/api/v1/public/tournaments/${tournament.slug}`);

    expect(response.status).toBe(200);
    expect(response.body.data.tournament.status).toBe(TournamentStatus.COMPLETED);
    expect(response.body.data.tournament.winnerTeam.name).toBe("Alpha");
  });

  it("supports pagination and search", async () => {
    const accessToken = await registerOrganizer();
    await createTournament(accessToken, "Football Alpha Cup");
    await createTournament(accessToken, "Cricket Beta Cup");

    const response = await request(app).get(
      "/api/v1/public/tournaments?page=1&limit=1&search=Cricket%20Beta",
    );

    expect(response.status).toBe(200);
    expect(response.body.data.tournaments).toHaveLength(1);
    expect(response.body.data.tournaments[0].name).toBe("Cricket Beta Cup");
    expect(response.body.data.pagination.total).toBe(1);
    expect(response.body.data.pagination.totalPages).toBe(1);
  });
});
