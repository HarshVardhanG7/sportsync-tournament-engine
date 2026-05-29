import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { prisma } from "../src/config/prisma.js";
import { app } from "../src/app.js";
import request from "supertest";

const testEmail = "auth-test@sportsync.dev";

async function cleanupTestUser() {
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
    select: { id: true },
  });

  if (!user) {
    return;
  }

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });
  await prisma.user.delete({
    where: { id: user.id },
  });
}

describe("Auth integration", () => {
  beforeEach(async () => {
    await cleanupTestUser();
  });

  afterAll(async () => {
    await cleanupTestUser();
    await prisma.$disconnect();
  });

  it("registers a user successfully", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "Auth Test",
      email: testEmail,
      password: "Password@123",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testEmail);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("rejects duplicate emails", async () => {
    await request(app).post("/api/v1/auth/register").send({
      name: "Auth Test",
      email: testEmail,
      password: "Password@123",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      name: "Auth Test Again",
      email: testEmail,
      password: "Password@123",
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "Email is already registered",
    });
  });

  it("logs in successfully", async () => {
    await request(app).post("/api/v1/auth/register").send({
      name: "Auth Test",
      email: testEmail,
      password: "Password@123",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: testEmail,
      password: "Password@123",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testEmail);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("rejects a wrong password", async () => {
    await request(app).post("/api/v1/auth/register").send({
      name: "Auth Test",
      email: testEmail,
      password: "Password@123",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: testEmail,
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("returns the current user with a valid access token", async () => {
    const registerResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Auth Test",
      email: testEmail,
      password: "Password@123",
    });

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${registerResponse.body.data.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testEmail);
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });
});
