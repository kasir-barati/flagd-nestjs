# flagd-nestjs

A NestJS wrapper around [flagd](https://flagd.dev/) for feature flag management with persistent storage. It bundles a NestJS REST API for CRUD operations on feature flags with a co-located flagd process that serves evaluated flags over **gRPC** and **OFREP/HTTP** — all inside a single Docker image.

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                  Docker container                   │
│                                                     │
│   ┌───────────────────┐      ┌───────────────────┐  │
│   │   NestJS REST API │      │       flagd       │  │
│   │   (flag CRUD)     │◄─────│   (flag eval)     │  │
│   │   :3000           │ poll │   gRPC  :8013     │  │
│   └────────┬──────────┘      │   OFREP :8016     │  │
│            │                 └───────────────────┘  │
│            │                                        │
└────────────┼────────────────────────────────────────┘
             │
             ▼
        ┌──────────┐
        │ Database  │
        └──────────┘
```

1. **NestJS** exposes a REST API to create, read, update, and delete feature flags, persisting them to a database via TypeORM.
2. **NestJS** also serves a `/flagd/flags.json` sync endpoint that renders all stored flags in the [flagd flag definition format](https://flagd.dev/reference/flag-definitions/).
3. **flagd** polls that sync endpoint and serves evaluated flag values over gRPC (port `8013`) and OFREP/HTTP (port `8016`) to your backend and frontend applications using the [OpenFeature](https://openfeature.dev/) SDKs.

## Features

- **REST API** for feature flag management with full Swagger documentation
- **Multi-database support** — PostgreSQL, MySQL, MongoDB, MSSQL, and SQLite
- **Single container** — NestJS + flagd bundled together with a lightweight entrypoint script
- **OpenFeature compatible** — flagd provides gRPC and OFREP evaluation endpoints
- **Health check** — `GET /healthcheck`
- **Structured logging** with correlation IDs

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd flagd-nestjs
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` to match your setup. Key variables:

| Variable          | Description                                                  | Default                                      |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `PORT`            | NestJS server port                                           | `3000`                                       |
| `SWAGGER_PATH`    | Swagger UI path                                              | `api`                                        |
| `SERVICE_NAME`    | Application name                                             | `flagd-nestjs`                               |
| `DATABASE_ENGINE` | `postgres`, `mysql`, `mongodb`, `mssql`, or `sqlite`         | `postgres`                                   |
| `DATABASE_URL`    | Database connection string (or file path for SQLite)         | `postgres://flagd:flagd@postgres:5432/flagd` |
| `FLAGD_HOST`      | flagd host (used by OpenFeature provider)                    | `localhost`                                  |
| `FLAGD_PORT`      | flagd gRPC port                                              | `8013`                                       |
| `LOG_MODE`        | `PLAIN_TEXT` or `JSON`                                       | `PLAIN_TEXT`                                 |
| `LOG_LEVEL`       | `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly` | `debug`                                      |

### 3. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

This starts:

- **flagd-nestjs** on ports `3000` (REST), `8013` (gRPC), `8016` (OFREP)
- **PostgreSQL** as the backing database

### 4. Run locally (development)

Make sure a database is running and `DATABASE_URL` in `.env` points to it, then:

```bash
pnpm start:dev
```

> **Note:** Running locally only starts the NestJS server. To also run flagd, install the [flagd binary](https://flagd.dev/installation/) separately.

## API

Once the server is running, visit the Swagger UI:

```
http://localhost:3000/api
```

### Endpoints

| Method   | Path                 | Description              |
| -------- | -------------------- | ------------------------ |
| `GET`    | `/feature-flags`     | List all feature flags   |
| `GET`    | `/feature-flags/:id` | Get a feature flag by ID |
| `POST`   | `/feature-flags`     | Create a feature flag    |
| `PATCH`  | `/feature-flags/:id` | Update a feature flag    |
| `DELETE` | `/feature-flags/:id` | Delete a feature flag    |
| `GET`    | `/healthcheck`       | Health check             |

### Exposed Ports

| Port   | Protocol | Purpose                                 |
| ------ | -------- | --------------------------------------- |
| `3000` | HTTP     | NestJS REST API (flag management)       |
| `8013` | gRPC     | flagd flag evaluation (backends)        |
| `8016` | HTTP     | flagd OFREP flag evaluation (frontends) |

## Scripts

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `pnpm start:dev`   | Start in watch mode                    |
| `pnpm start:debug` | Start in debug + watch mode            |
| `pnpm start:prod`  | Start the production build             |
| `pnpm build`       | Compile TypeScript                     |
| `pnpm test`        | Run unit tests                         |
| `pnpm test:watch`  | Run unit tests in watch mode           |
| `pnpm test:cov`    | Run unit tests with coverage           |
| `pnpm test:e2e`    | Run end-to-end tests (requires Docker) |
| `pnpm lint`        | Lint and auto-fix                      |
| `pnpm format`      | Format code with Prettier              |

## Project Structure

```
src/
├── main.ts                         # Application bootstrap
├── app/
│   ├── app.module.ts               # Root module
│   ├── app.controller.ts           # Health check
│   └── configs/                    # App, database, and logger configuration
└── modules/
    └── storage/
        ├── controllers/            # REST + flagd sync controllers
        ├── dtos/                   # Request/response DTOs
        ├── entities/               # TypeORM entity
        ├── interfaces/             # Repository & model contracts
        ├── repositories/           # Database access layer
        └── services/               # Business logic & flag sync builder
```
