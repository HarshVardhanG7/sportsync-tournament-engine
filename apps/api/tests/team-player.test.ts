import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { prisma } from "../src/config/prisma.js";
import { app } from "../src/app.js";
import request from "supertest";

const organizerEmail = "team-player-organizer@sportsync.dev";
const otherOrganizerEmail = "team-player-other-organizer@sportsync.dev";
const captainEmail = "team-player-captain@sportsync.dev";

const tournamentPayload = {
  name: "Team Player Cup",
  sportType: "Football",
  format: "ROUND_ROBIN",
  startDate: "2026-07-01T00:00:00.000Z",
  endDate: "2026-07-10T00:00:00.000Z",
};

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

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { entityType: "Tournament", entityId: { in: tournamentIds } },
        { entityType: "Team", entityId: { in: teamIds } },
      ],
    },
  });
  await prisma.refreshToken.deleteMany({
    where: { userId: { in: userIds } },
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

async function createTournament(accessToken: string) {
  const response = await request(app)
    .post("/api/v1/tournaments")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(tournamentPayload);

  return response.body.data.tournament.id as string;
}

async function createTeam(accessToken: string, tournamentId: string, name = "Lions", captainId?: string) {
  return request(app)
    .post(`/api/v1/tournaments/${tournamentId}/teams`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name,
      ...(captainId ? { captainId } : {}),
    });
}

async function createPlayer(accessToken: string, teamId: string, jerseyNumber = 10) {
  return request(app)
    .post(`/api/v1/teams/${teamId}/players`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Alex Morgan",
      jerseyNumber,
      position: "Forward",
    });
}

describe("Team and player integration", () => {
  beforeEach(async () => {
    await cleanupUsers();
  });

  afterAll(async () => {
    await cleanupUsers();
    await prisma.$disconnect();
  });

  it("creates a team", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    const response = await createTeam(organizer.accessToken, tournamentId);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.team.name).toBe("Lions");

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "TEAM_CREATED",
        entityId: response.body.data.team.id,
      },
    });

    expect(auditLog).not.toBeNull();
  });

  it("rejects duplicate team names within a tournament", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    await createTeam(organizer.accessToken, tournamentId, "Lions");

    const response = await createTeam(organizer.accessToken, tournamentId, "Lions");

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "Team name already exists in this tournament",
    });
  });

  it("creates a team with a captain", async () => {
    const organizer = await registerUser(organizerEmail);
    const captain = await registerUser(captainEmail, "TEAM_CAPTAIN");
    const tournamentId = await createTournament(organizer.accessToken);
    const response = await createTeam(organizer.accessToken, tournamentId, "Lions", captain.userId);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.team.captain.id).toBe(captain.userId);
  });

  it("allows the owner to update a team", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    const createResponse = await createTeam(organizer.accessToken, tournamentId);

    const response = await request(app)
      .patch(`/api/v1/teams/${createResponse.body.data.team.id}`)
      .set("Authorization", `Bearer ${organizer.accessToken}`)
      .send({ name: "Tigers" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.team.name).toBe("Tigers");
  });

  it("prevents a non-owner from updating a team", async () => {
    const organizer = await registerUser(organizerEmail);
    const otherOrganizer = await registerUser(otherOrganizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    const createResponse = await createTeam(organizer.accessToken, tournamentId);

    const response = await request(app)
      .patch(`/api/v1/teams/${createResponse.body.data.team.id}`)
      .set("Authorization", `Bearer ${otherOrganizer.accessToken}`)
      .send({ name: "Tigers" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "You do not have access to this tournament",
    });
  });

  it("soft deletes a team", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    const createResponse = await createTeam(organizer.accessToken, tournamentId);

    const response = await request(app)
      .delete(`/api/v1/teams/${createResponse.body.data.team.id}`)
      .set("Authorization", `Bearer ${organizer.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.team.deletedAt).toEqual(expect.any(String));

    const teamsResponse = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}/teams`)
      .set("Authorization", `Bearer ${organizer.accessToken}`);

    expect(teamsResponse.body.data.teams).toHaveLength(0);
  });

  it("creates a player", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    const teamResponse = await createTeam(organizer.accessToken, tournamentId);
    const response = await createPlayer(organizer.accessToken, teamResponse.body.data.team.id);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.player.name).toBe("Alex Morgan");

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "PLAYER_CREATED",
        entityId: response.body.data.player.id,
      },
    });

    expect(auditLog).not.toBeNull();
  });

  it("rejects duplicate jersey numbers within a team", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    const teamResponse = await createTeam(organizer.accessToken, tournamentId);
    const teamId = teamResponse.body.data.team.id as string;
    await createPlayer(organizer.accessToken, teamId, 10);

    const response = await createPlayer(organizer.accessToken, teamId, 10);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "Jersey number already exists in this team",
    });
  });

  it("updates a player", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    const teamResponse = await createTeam(organizer.accessToken, tournamentId);
    const playerResponse = await createPlayer(organizer.accessToken, teamResponse.body.data.team.id);

    const response = await request(app)
      .patch(`/api/v1/players/${playerResponse.body.data.player.id}`)
      .set("Authorization", `Bearer ${organizer.accessToken}`)
      .send({
        name: "Updated Player",
        jerseyNumber: 11,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.player.name).toBe("Updated Player");
    expect(response.body.data.player.jerseyNumber).toBe(11);
  });

  it("soft deletes a player", async () => {
    const organizer = await registerUser(organizerEmail);
    const tournamentId = await createTournament(organizer.accessToken);
    const teamResponse = await createTeam(organizer.accessToken, tournamentId);
    const teamId = teamResponse.body.data.team.id as string;
    const playerResponse = await createPlayer(organizer.accessToken, teamId);

    const response = await request(app)
      .delete(`/api/v1/players/${playerResponse.body.data.player.id}`)
      .set("Authorization", `Bearer ${organizer.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.player.deletedAt).toEqual(expect.any(String));

    const playersResponse = await request(app)
      .get(`/api/v1/teams/${teamId}/players`)
      .set("Authorization", `Bearer ${organizer.accessToken}`);

    expect(playersResponse.body.data.players).toHaveLength(0);
  });
});
