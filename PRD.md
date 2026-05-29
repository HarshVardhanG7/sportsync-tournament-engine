# PRD.md

# SportSync – Tournament Engine

Version: 1.0
Status: Approved for Development
Owner: Harsh Vardhan
Product Type: Full-Stack Web Application
Primary Focus: Backend Engineering + Tournament Automation

---

# 1. Product Overview

## Product Name

SportSync – Tournament Engine

## Vision

SportSync is a backend-focused full-stack tournament management platform that enables sports organizers to create, manage, automate, and publish sports tournaments.

The platform eliminates manual tournament operations such as fixture creation, score tracking, standings calculation, and qualification management.

The goal is to build a professional-grade project that demonstrates backend engineering, database design, authentication, authorization, business logic implementation, API architecture, and full-stack development skills.

---

# 2. Problem Statement

Sports tournaments are commonly managed using spreadsheets, manual calculations, and disconnected tools.

This creates several issues:

* Manual fixture creation
* Human errors in standings
* Difficult score management
* Lack of centralized management
* No public visibility for tournament updates

SportSync solves these problems through automation and centralized management.

---

# 3. Goals

## Primary Goals

* Build a production-style backend system
* Demonstrate strong database relationships
* Implement secure authentication and authorization
* Implement tournament automation logic
* Build scalable REST APIs
* Provide public tournament visibility

## Secondary Goals

* Learn industry-standard backend architecture
* Practice PostgreSQL and Prisma
* Learn deployment workflows
* Create a strong resume project

---

# 4. User Roles

## Admin

Responsibilities:

* Manage platform
* View all users
* View all tournaments
* Remove inappropriate tournaments

Permissions:

* Full access

---

## Organizer

Responsibilities:

* Create tournaments
* Manage teams
* Manage players
* Generate fixtures
* Update scores
* Publish tournaments

Permissions:

* Access only owned tournaments

---

## Team Captain

Responsibilities:

* View assigned team
* View tournament information

Permissions:

* Read-only access for MVP

---

## Viewer

Responsibilities:

* View public tournament data

Permissions:

* No authentication required

---

# 5. Core Features

## Authentication Module

Features:

* User Registration
* User Login
* JWT Authentication
* Password Hashing
* Role-Based Access Control
* Protected Routes

Roles:

* ADMIN
* ORGANIZER
* TEAM_CAPTAIN

---

## Tournament Management Module

Organizer can:

* Create Tournament
* Update Tournament
* Delete Tournament
* Publish Tournament

Tournament Fields:

* Name
* Slug
* Sport Type
* Description
* Format
* Start Date
* End Date
* Status

Tournament Status:

* DRAFT
* PUBLISHED
* ONGOING
* COMPLETED

---

## Team Management Module

Organizer can:

* Create Team
* Update Team
* Delete Team
* Assign Captain

Team Fields:

* Name
* Tournament Reference
* Captain Reference

---

## Player Management Module

Organizer can:

* Add Players
* Edit Players
* Remove Players

Player Fields:

* Name
* Jersey Number
* Position
* Team Reference

---

## Fixture Generation Module

Supported Formats:

### Round Robin

Every team plays every other team once.

### Knockout

Teams are eliminated after losing.

Capabilities:

* Automatic fixture creation
* Duplicate prevention
* Match scheduling support

---

## Match Management Module

Organizer can:

* Enter Scores
* Update Scores
* Mark Match Completed

System automatically:

* Validates scores
* Determines winner
* Updates standings

---

## Standings Module

Automatically calculate:

* Played
* Won
* Lost
* Drawn
* Points
* Rank

Scoring Rules:

Win = 3 Points

Draw = 1 Point

Loss = 0 Points

---

## Qualification Module

Example Rule:

Top 4 Teams Qualify

System automatically generates:

* Semi Finals
* Final

Based on standings.

---

## Public Tournament Module

Public users can view:

* Tournament Details
* Teams
* Fixtures
* Results
* Points Table
* Winner

No authentication required.

---

# 6. User Flows

## Organizer Flow

Register
→ Login
→ Create Tournament
→ Add Teams
→ Add Players
→ Generate Fixtures
→ Publish Tournament
→ Update Scores
→ Manage Standings
→ Complete Tournament

---

## Viewer Flow

Open Tournament URL
→ View Fixtures
→ View Results
→ View Standings
→ View Winner

---

# 7. Technical Architecture

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* TanStack Query
* Axios
* React Hook Form
* Zod

---

## Backend

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Prisma ORM
* JWT
* bcrypt
* Zod

---

## Testing

* Jest
* Supertest

---

## Documentation

* Swagger / OpenAPI
* Postman Collection

---

## DevOps

* Docker
* Docker Compose
* GitHub Actions

---

## Deployment

Frontend:

* Vercel

Backend:

* Render

Database:

* Neon PostgreSQL

---

# 8. Database Entities

## User

Fields:

* id
* name
* email
* passwordHash
* role
* createdAt
* updatedAt

---

## Tournament

Fields:

* id
* name
* slug
* sportType
* description
* format
* status
* startDate
* endDate
* organizerId

---

## Team

Fields:

* id
* name
* tournamentId
* captainId

---

## Player

Fields:

* id
* name
* jerseyNumber
* position
* teamId

---

## Match

Fields:

* id
* tournamentId
* round
* teamAId
* teamBId
* teamAScore
* teamBScore
* winnerTeamId
* status

---

## Standing

Fields:

* id
* tournamentId
* teamId
* played
* won
* lost
* drawn
* points
* rank

---

# 9. Backend Architecture

Architecture Style:

Layered Architecture

Structure:

src/

* modules/
* controllers/
* services/
* repositories/
* validations/
* middlewares/
* routes/
* utils/
* config/
* types/
* constants/

Example Module Structure:

tournaments/

* tournament.routes.ts
* tournament.controller.ts
* tournament.service.ts
* tournament.repository.ts
* tournament.validation.ts

---

# 10. API Design Principles

Standards:

* RESTful APIs
* Resource-based URLs
* Consistent response structure
* Centralized error handling
* Validation before controller execution

Example:

GET /api/v1/tournaments

POST /api/v1/tournaments

PATCH /api/v1/tournaments/:id

DELETE /api/v1/tournaments/:id

---

# 11. Security Requirements

Authentication:

* JWT Access Tokens

Password Security:

* bcrypt hashing

Authorization:

* Role-Based Access Control

Validation:

* Zod schemas

Security Rules:

* Protected routes
* Input validation
* Ownership checks
* Secure environment variables

---

# 12. Non-Functional Requirements

Performance:

* API response under 500ms for normal operations

Scalability:

* Modular architecture

Maintainability:

* TypeScript everywhere
* Clean code practices

Reliability:

* Database constraints
* Validation layer

Documentation:

* Swagger documentation required

---

# 13. Milestones

## Milestone 1

Project Setup

* Backend initialization
* Frontend initialization
* PostgreSQL
* Prisma

---

## Milestone 2

Authentication

* Register
* Login
* JWT
* RBAC

---

## Milestone 3

Tournament Module

* CRUD
* Publish

---

## Milestone 4

Teams & Players

* Team CRUD
* Player CRUD

---

## Milestone 5

Fixture Engine

* Round Robin
* Knockout

---

## Milestone 6

Match Engine

* Scores
* Winners

---

## Milestone 7

Standings Engine

* Points
* Rankings

---

## Milestone 8

Qualification Engine

* Semi Finals
* Finals

---

## Milestone 9

Frontend Dashboard

* Organizer Dashboard
* Tournament Pages

---

## Milestone 10

Production Readiness

* Swagger
* Tests
* Docker
* Deployment

---

# 14. Success Criteria

The project is considered complete when:

* Users can authenticate securely
* Organizers can manage tournaments
* Teams and players can be managed
* Fixtures can be generated automatically
* Scores can be updated
* Standings update automatically
* Qualification logic works correctly
* Public users can view tournaments
* APIs are documented
* Application is deployed successfully

---

# 15. Resume Positioning

SportSync should demonstrate:

* Backend Engineering
* REST API Design
* PostgreSQL Database Design
* Authentication & Authorization
* Business Logic Automation
* Full-Stack Development
* Testing
* Deployment
* DevOps Fundamentals
