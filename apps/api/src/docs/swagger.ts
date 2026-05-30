import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SportSync Tournament Engine API",
      version: "1.0.0",
      description:
        "Full-stack tournament management backend built with Node.js, Express, TypeScript, PostgreSQL and Prisma.",
    },
    servers: [
      {
        url: "http://localhost:4000/api/v1",
        description: "Local API server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Authorization: Bearer <token>",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Demo Organizer" },
            email: { type: "string", example: "organizer@sportsync.dev" },
            role: { type: "string", enum: ["ORGANIZER", "TEAM_CAPTAIN"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        Tournament: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Summer Cup" },
            slug: { type: "string", example: "summer-cup" },
            sportType: { type: "string", example: "Football" },
            description: { type: "string", nullable: true },
            format: { type: "string", enum: ["ROUND_ROBIN", "KNOCKOUT"] },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED"],
            },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            organizerId: { type: "string" },
            winnerTeamId: { type: "string", nullable: true },
            deletedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Team: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Lions" },
            tournamentId: { type: "string" },
            captainId: { type: "string", nullable: true },
            deletedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Player: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Alex Morgan" },
            jerseyNumber: { type: "integer", nullable: true, example: 10 },
            position: { type: "string", nullable: true, example: "Forward" },
            teamId: { type: "string" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Match: {
          type: "object",
          properties: {
            id: { type: "string" },
            tournamentId: { type: "string" },
            stage: {
              type: "string",
              enum: ["LEAGUE", "QUARTER_FINAL", "SEMI_FINAL", "FINAL"],
            },
            round: { type: "integer", example: 1 },
            matchNumber: { type: "integer", example: 1 },
            teamAId: { type: "string" },
            teamBId: { type: "string" },
            teamAScore: { type: "integer", nullable: true },
            teamBScore: { type: "integer", nullable: true },
            winnerTeamId: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"],
            },
            scheduledAt: { type: "string", format: "date-time", nullable: true },
            completedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Standing: {
          type: "object",
          properties: {
            id: { type: "string" },
            tournamentId: { type: "string" },
            teamId: { type: "string" },
            played: { type: "integer", example: 3 },
            won: { type: "integer", example: 2 },
            lost: { type: "integer", example: 1 },
            drawn: { type: "integer", example: 0 },
            points: { type: "integer", example: 6 },
            rank: { type: "integer", nullable: true, example: 1 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      { name: "Auth" },
      { name: "Tournaments" },
      { name: "Teams" },
      { name: "Players" },
      { name: "Fixtures" },
      { name: "Matches" },
      { name: "Standings" },
      { name: "Qualifications" },
      { name: "Public" },
    ],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", example: "Demo Organizer" },
                    email: { type: "string", example: "organizer@sportsync.dev" },
                    password: { type: "string", example: "Password@123" },
                    role: { type: "string", enum: ["ORGANIZER", "TEAM_CAPTAIN"] },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Registered", content: jsonRef("AuthResponse") },
            "409": errorResponse("Email is already registered"),
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          requestBody: jsonBody({
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", example: "organizer@sportsync.dev" },
              password: { type: "string", example: "Password@123" },
            },
          }),
          responses: {
            "200": { description: "Logged in", content: jsonRef("AuthResponse") },
            "401": errorResponse("Invalid email or password"),
          },
        },
      },
      "/auth/refresh": simplePost("Auth", "Refresh", {
        refreshToken: { type: "string" },
      }),
      "/auth/logout": simplePost("Auth", "Logout", {
        refreshToken: { type: "string" },
      }),
      "/auth/me": {
        get: protectedOperation("Auth", "Me", {
          "200": { description: "Current user", content: jsonDataRef("User", "user") },
        }),
      },
      "/tournaments": {
        post: protectedOperation("Tournaments", "Create Tournament", {
          "201": { description: "Created", content: jsonDataRef("Tournament", "tournament") },
        }, {
          requestBody: jsonBody({
            type: "object",
            required: ["name", "sportType", "format", "startDate", "endDate"],
            properties: {
              name: { type: "string", example: "Summer Cup" },
              sportType: { type: "string", example: "Football" },
              format: { type: "string", enum: ["ROUND_ROBIN", "KNOCKOUT"], example: "ROUND_ROBIN" },
              startDate: { type: "string", format: "date-time", example: "2026-06-01T00:00:00.000Z" },
              endDate: { type: "string", format: "date-time", example: "2026-06-10T00:00:00.000Z" },
              description: { type: "string", example: "Local summer tournament" },
            },
          }),
        }),
      },
      "/tournaments/my": {
        get: protectedOperation("Tournaments", "Get My", {
          "200": { description: "Organizer tournaments", content: jsonArrayDataRef("Tournament", "tournaments") },
        }),
      },
      "/tournaments/{id}": {
        get: protectedPathOperation("Tournaments", "Get By Id", "id", "Tournament id", {
          "200": { description: "Tournament", content: jsonDataRef("Tournament", "tournament") },
        }),
        patch: protectedPathOperation("Tournaments", "Update", "id", "Tournament id", {
          "200": { description: "Updated", content: jsonDataRef("Tournament", "tournament") },
        }, {
          requestBody: jsonBody({
            type: "object",
            properties: {
              name: { type: "string", example: "Updated Cup" },
              sportType: { type: "string", example: "Football" },
              format: { type: "string", enum: ["ROUND_ROBIN", "KNOCKOUT"] },
              startDate: { type: "string", format: "date-time" },
              endDate: { type: "string", format: "date-time" },
              description: { type: "string" },
            },
          }),
        }),
        delete: protectedPathOperation("Tournaments", "Delete", "id", "Tournament id", {
          "200": { description: "Soft deleted", content: jsonDataRef("Tournament", "tournament") },
        }),
      },
      "/tournaments/{id}/publish": statusOperation("Publish"),
      "/tournaments/{id}/complete": statusOperation("Complete"),
      "/tournaments/{tournamentId}/teams": {
        post: protectedPathOperation("Teams", "Create Team", "tournamentId", "Tournament id", {
          "201": { description: "Created", content: jsonDataRef("Team", "team") },
        }, {
          requestBody: jsonBody({
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", example: "Lions" },
              captainId: { type: "string", example: "captain-user-id" },
            },
          }),
        }),
        get: protectedPathOperation("Teams", "List", "tournamentId", "Tournament id", {
          "200": { description: "Teams", content: jsonArrayDataRef("Team", "teams") },
        }),
      },
      "/teams/{teamId}": {
        get: protectedPathOperation("Teams", "Get By Id", "teamId", "Team id", {
          "200": { description: "Team", content: jsonDataRef("Team", "team") },
        }),
        patch: protectedPathOperation("Teams", "Update", "teamId", "Team id", {
          "200": { description: "Updated", content: jsonDataRef("Team", "team") },
        }, {
          requestBody: jsonBody({
            type: "object",
            properties: {
              name: { type: "string", example: "Tigers" },
              captainId: { type: "string", nullable: true },
            },
          }),
        }),
        delete: protectedPathOperation("Teams", "Delete", "teamId", "Team id", {
          "200": { description: "Soft deleted", content: jsonDataRef("Team", "team") },
        }),
      },
      "/teams/{teamId}/players": {
        post: protectedPathOperation("Players", "Create Player", "teamId", "Team id", {
          "201": { description: "Created", content: jsonDataRef("Player", "player") },
        }, {
          requestBody: jsonBody({
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", example: "Alex Morgan" },
              jerseyNumber: { type: "integer", example: 10 },
              position: { type: "string", example: "Forward" },
            },
          }),
        }),
        get: protectedPathOperation("Players", "List", "teamId", "Team id", {
          "200": { description: "Players", content: jsonArrayDataRef("Player", "players") },
        }),
      },
      "/players/{playerId}": {
        get: protectedPathOperation("Players", "Get By Id", "playerId", "Player id", {
          "200": { description: "Player", content: jsonDataRef("Player", "player") },
        }),
        patch: protectedPathOperation("Players", "Update", "playerId", "Player id", {
          "200": { description: "Updated", content: jsonDataRef("Player", "player") },
        }),
        delete: protectedPathOperation("Players", "Delete", "playerId", "Player id", {
          "200": { description: "Soft deleted", content: jsonDataRef("Player", "player") },
        }),
      },
      "/tournaments/{tournamentId}/fixtures/generate": {
        post: protectedPathOperation("Fixtures", "Generate", "tournamentId", "Tournament id", {
          "201": { description: "Generated", content: jsonArrayDataRef("Match", "fixtures") },
        }),
      },
      "/tournaments/{tournamentId}/fixtures": {
        get: protectedPathOperation("Fixtures", "List", "tournamentId", "Tournament id", {
          "200": { description: "Fixtures", content: jsonArrayDataRef("Match", "fixtures") },
        }),
      },
      "/tournaments/{tournamentId}/matches": {
        get: protectedPathOperation("Matches", "List", "tournamentId", "Tournament id", {
          "200": { description: "Matches", content: jsonArrayDataRef("Match", "matches") },
        }),
      },
      "/matches/{matchId}": {
        get: protectedPathOperation("Matches", "Get By Id", "matchId", "Match id", {
          "200": { description: "Match", content: jsonDataRef("Match", "match") },
        }),
      },
      "/matches/{matchId}/score": {
        patch: protectedPathOperation("Matches", "Update Score", "matchId", "Match id", {
          "200": { description: "Updated", content: jsonDataRef("Match", "match") },
        }, {
          requestBody: jsonBody({
            type: "object",
            required: ["teamAScore", "teamBScore"],
            properties: {
              teamAScore: { type: "integer", example: 2 },
              teamBScore: { type: "integer", example: 1 },
            },
          }),
        }),
      },
      "/tournaments/{tournamentId}/standings": {
        get: protectedPathOperation("Standings", "Get", "tournamentId", "Tournament id", {
          "200": { description: "Standings", content: jsonArrayDataRef("Standing", "standings") },
        }),
      },
      "/tournaments/{tournamentId}/standings/recalculate": {
        post: protectedPathOperation("Standings", "Recalculate", "tournamentId", "Tournament id", {
          "200": { description: "Recalculated", content: jsonArrayDataRef("Standing", "standings") },
        }),
      },
      "/tournaments/{tournamentId}/qualifications/generate": {
        post: protectedPathOperation("Qualifications", "Generate", "tournamentId", "Tournament id", {
          "201": { description: "Generated", content: jsonArrayDataRef("Match", "qualifications") },
        }),
      },
      "/tournaments/{tournamentId}/qualifications": {
        get: protectedPathOperation("Qualifications", "Get", "tournamentId", "Tournament id", {
          "200": { description: "Qualifications", content: jsonArrayDataRef("Match", "qualifications") },
        }),
      },
      "/public/tournaments": {
        get: {
          tags: ["Public"],
          summary: "List Tournaments",
          parameters: [
            queryParam("page", "integer", "Page number"),
            queryParam("limit", "integer", "Page size"),
            queryParam("search", "string", "Search by name or sport type"),
          ],
          responses: {
            "200": { description: "Public tournaments", content: jsonArrayDataRef("Tournament", "tournaments") },
          },
        },
      },
      "/public/tournaments/{slug}": publicSlugOperation("Tournament Details", "Tournament", "tournament"),
      "/public/tournaments/{slug}/teams": publicSlugOperation("Teams", "Team", "teams", true),
      "/public/tournaments/{slug}/matches": publicSlugOperation("Matches", "Match", "matches", true),
      "/public/tournaments/{slug}/standings": publicSlugOperation("Standings", "Standing", "standings", true),
    },
  },
  apis: [],
};

function jsonBody(schema: object) {
  return {
    required: true,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

function jsonRef(schemaName: string) {
  return {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    },
  };
}

function jsonDataRef(schemaName: string, key: string) {
  return {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              [key]: { $ref: `#/components/schemas/${schemaName}` },
            },
          },
        },
      },
    },
  };
}

function jsonArrayDataRef(schemaName: string, key: string) {
  return {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              [key]: {
                type: "array",
                items: { $ref: `#/components/schemas/${schemaName}` },
              },
            },
          },
        },
      },
    },
  };
}

function errorResponse(message: string) {
  return {
    description: message,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { success: false, message },
      },
    },
  };
}

function simplePost(tag: string, summary: string, properties: Record<string, object>) {
  return {
    post: {
      tags: [tag],
      summary,
      requestBody: jsonBody({
        type: "object",
        required: Object.keys(properties),
        properties,
      }),
      responses: {
        "200": { description: summary, content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
      },
    },
  };
}

function protectedOperation(
  tag: string,
  summary: string,
  responses: object,
  extra: Record<string, unknown> = {},
) {
  return {
    tags: [tag],
    summary,
    security: [{ BearerAuth: [] }],
    responses: {
      ...responses,
      "401": errorResponse("Authentication required"),
    },
    ...extra,
  };
}

function pathParam(name: string, description: string) {
  return {
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
    description,
  };
}

function queryParam(name: string, type: string, description: string) {
  return {
    name,
    in: "query",
    required: false,
    schema: { type },
    description,
  };
}

function protectedPathOperation(
  tag: string,
  summary: string,
  paramName: string,
  paramDescription: string,
  responses: object,
  extra: Record<string, unknown> = {},
) {
  return protectedOperation(tag, summary, responses, {
    parameters: [pathParam(paramName, paramDescription)],
    ...extra,
  });
}

function statusOperation(summary: string) {
  return {
    patch: protectedPathOperation("Tournaments", summary, "id", "Tournament id", {
      "200": { description: summary, content: jsonDataRef("Tournament", "tournament") },
    }),
  };
}

function publicSlugOperation(summary: string, schemaName: string, key: string, isArray = false) {
  return {
    get: {
      tags: ["Public"],
      summary,
      parameters: [pathParam("slug", "Tournament slug")],
      responses: {
        "200": {
          description: summary,
          content: isArray ? jsonArrayDataRef(schemaName, key) : jsonDataRef(schemaName, key),
        },
        "404": errorResponse("Tournament not found"),
      },
    },
  };
}

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
