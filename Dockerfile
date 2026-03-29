# --- Build stage: compile TypeScript ---
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN pnpm build

# --- Production deps stage ---
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- Final stage: Node.js Alpine + flagd binary ---
FROM node:24-alpine AS production

# Copy the flagd binary from the official image
COPY --from=ghcr.io/open-feature/flagd:v0.14.4 /flagd-build /usr/local/bin/flagd

# Install curl for the health check in the entrypoint
RUN apk add --no-cache curl

WORKDIR /app
COPY --from=deps /deps/node_modules/ ./node_modules/
COPY --from=build /build/dist/ ./dist/
COPY package.json ./
COPY flagd-nestjs-entrypoint.sh /flagd-nestjs-entrypoint.sh
RUN chmod +x /flagd-nestjs-entrypoint.sh

EXPOSE 3000 8013 8016
ENTRYPOINT ["/flagd-nestjs-entrypoint.sh"]
