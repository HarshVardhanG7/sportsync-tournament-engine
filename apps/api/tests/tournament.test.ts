import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { TournamentStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { app } from "../src/app.js";
import request from "supertest";

const organizerEmail = "tournament-organizer@sportsync.dev";
const otherOrganizerEmail = "tournament-other-organizer@sportsync.dev";
const captainEmail = "tournament-captain@sportsync.dev";

const baseTournamentPayload = {
  name: "Summer Cup",
  sportType: "Football",
  format: "ROUND_ROBIN",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-10T00:00:00.000Z",
  description: "Local summer tournament",
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

  await prisma.auditLog.deleteMany({
    where: { userId: { in: userIds } },
  });
  await prisma.refreshToken.deleteMany({
    where: { userId: { in: userIds } },
  });
  await prisma.tournament.deleteMany({
    where: { organizerId: { in: userIds } },
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

  return response.body.data.accessToken as string;
}

async function createTournament(accessToken: string, name = baseTournamentPayload.name) {
  return request(app)
    .post("/api/v1/tournaments")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      ...baseTournamentPayload,
      name,
    });
}

describe("Tournament integration", () => {
  beforeEach(async () => {
    await cleanupUsers();
  });

  afterAll(async () => {
    await cleanupUsers();
    await prisma.$disconnect();
  });

  it("allows an organizer to create a tournament", async () => {
    const accessToken = await registerUser(organizerEmail);
    const response = await createTournament(accessToken);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tournament.name).toBe(baseTournamentPayload.name);
    expect(response.body.data.tournament.slug).toBe("summer-cup");
    expect(response.body.data.tournament.status).toBe(TournamentStatus.DRAFT);

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "TOURNAMENT_CREATED",
        entityId: response.body.data.tournament.id,
      },
    });

    expect(auditLog).not.toBeNull();
  });

  it("prevents a team captain from creating a tournament", async () => {
    const accessToken = await registerUser(captainEmail, "TEAM_CAPTAIN");
    const response = await createTournament(accessToken);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Forbidden",
    });
  });

  it("allows an organizer to get their own tournaments", async () => {
    const accessToken = await registerUser(organizerEmail);
    await createTournament(accessToken, "First Cup");
    await createTournament(accessToken, "Second Cup");

    const response = await request(app)
      .get("/api/v1/tournaments/my")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tournaments).toHaveLength(2);
    expect(response.body.data.tournaments[0].name).toBe("Second Cup");
  });

  it("allows an organizer to update their own tournament", async () => {
    const accessToken = await registerUser(organizerEmail);
    const createResponse = await createTournament(accessToken);

    const response = await request(app)
      .patch(`/api/v1/tournaments/${createResponse.body.data.tournament.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Updated Cup",
        endDate: "2026-06-12T00:00:00.000Z",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tournament.name).toBe("Updated Cup");
    expect(response.body.data.tournament.slug).toBe("updated-cup");
  });

  it("prevents another organizer from updating a tournament", async () => {
    const accessToken = await registerUser(organizerEmail);
    const otherAccessToken = await registerUser(otherOrganizerEmail);
    const createResponse = await createTournament(accessToken);

    const response = await request(app)
      .patch(`/api/v1/tournaments/${createResponse.body.data.tournament.id}`)
      .set("Authorization", `Bearer ${otherAccessToken}`)
      .send({
        name: "Hijacked Cup",
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "You do not have access to this tournament",
    });
  });

  it("allows an organizer to publish a draft tournament", async () => {
    const accessToken = await registerUser(organizerEmail);
    const createResponse = await createTournament(accessToken);

    const response = await request(app)
      .patch(`/api/v1/tournaments/${createResponse.body.data.tournament.id}/publish`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tournament.status).toBe(TournamentStatus.PUBLISHED);
  });

  it("allows an organizer to soft delete a tournament", async () => {
    const accessToken = await registerUser(organizerEmail);
    const createResponse = await createTournament(accessToken);

    const response = await request(app)
      .delete(`/api/v1/tournaments/${createResponse.body.data.tournament.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tournament.deletedAt).toEqual(expect.any(String));

    const myTournamentsResponse = await request(app)
      .get("/api/v1/tournaments/my")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(myTournamentsResponse.body.data.tournaments).toHaveLength(0);
  });

  it("prevents deleting a completed tournament", async () => {
    const accessToken = await registerUser(organizerEmail);
    const createResponse = await createTournament(accessToken);
    const tournamentId = createResponse.body.data.tournament.id as string;

    await request(app)
      .patch(`/api/v1/tournaments/${tournamentId}/publish`)
      .set("Authorization", `Bearer ${accessToken}`);

    await request(app)
      .patch(`/api/v1/tournaments/${tournamentId}/complete`)
      .set("Authorization", `Bearer ${accessToken}`);

    const response = await request(app)
      .delete(`/api/v1/tournaments/${tournamentId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Completed tournaments cannot be deleted",
    });
  });
});
