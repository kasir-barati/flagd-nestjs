# flagd-nestjs

| `PORT` | NestJS server port | `3000` |
| `SWAGGER_PATH` | Swagger UI path | `api` |
A NestJS wrapper around [flagd](https://flagd.dev/) for feature flag management with persistent storage. It bundles a NestJS REST API for CRUD operations on feature flags with a co-located flagd process that serves evaluated flags over **gRPC** and **[OFREP](https://github.com/open-feature/protocol)/HTTP** — all inside a single Docker image.

## How It Works

```
╭───────────────────────────────────────────────────────────╮
│                   🐳  Docker Container                    │
│  ╭───────────────────────╮      ╭─────────────────────╮   │
│  │  🐈 NestJS REST API   │      │  🚩 flagd           │   │
│  │  (CRUD operations)    │◄─────│  (Flag evaluation)  │   │
│  │  - Port: 3000         │ poll │  - gRPC:  8013      │   │
│  ╰──────────┬────────────╯      │  - OFREP: 8016      │   │
│             │         ▲         ╰──────────┬──────────╯   │
╰─────────────┼─────────┼────────────────────┼──────────────╯
              ▼         │                    ▼
       ╭─────────────╮  │            ╭──────────────╮
       │ 💾 Database │  │            │ 👤 Client    │
       ╰─────────────╯  │            │ (Frontend or │
                        │            │  Backend)    │
                        │            │  via SDK     │
                        │            ╰──────┬───────╯
                        └───────────────────┘
                          Flag Definitions
```

1. **NestJS** exposes a REST API to create, read, update, and delete feature flags, persisting them to a database via TypeORM.
2. **NestJS** also serves a `/flagd/flags.json` sync endpoint that renders all stored flags in the [flagd flag definition format](https://flagd.dev/reference/flag-definitions/).
3. **flagd** polls that sync endpoint and serves evaluated flag values over gRPC (port `8013`) and OFREP/HTTP (port `8016`) to your backend and frontend applications using the [OpenFeature](https://openfeature.dev/) SDKs.

## Features

- 🚀 **RESTful API** for feature flag management with full **Swagger** documentation.
- 🗄️ **Multi‑database support**:
  - 🐘 PostgreSQL.
  - 🐬 MySQL.
  - 🍃 MongoDB.
  - 🪟 MSSQL.
  - 🧊 SQLite.
- 📦 **Single container** — NestJS + flagd bundled together through a lightweight entrypoint script.
- 🔌 **OpenFeature compatible** — flagd supports gRPC and OFREP evaluation endpoints.
- ❤️ **Health check** — `GET /healthcheck`.
- 📜 **Structured logging** with correlation IDs for traceability.

## Environment Variable

| Variable          | Description                                                  | Default                                      |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `SERVICE_NAME`    | Application name                                             | `flagd-nestjs`                               |
| `DATABASE_ENGINE` | `postgres`, `mysql`, `mongodb`, `mssql`, or `sqlite`         | `postgres`                                   |
| `DATABASE_URL`    | Database connection string (or file path for SQLite)         | `postgres://flagd:flagd@postgres:5432/flagd` |
| `LOG_MODE`        | `PLAIN_TEXT` or `JSON`                                       | `PLAIN_TEXT`                                 |
| `LOG_LEVEL`       | `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly` | `debug`                                      |
