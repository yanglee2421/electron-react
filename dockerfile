ARG NODE_VERSION=24-alpine

# ---- Stage 1: deps ----
# FROM node:${NODE_VERSION} AS deps
FROM setup:1 AS deps
WORKDIR /app
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/electron-app/package.json ./packages/electron-app/
COPY packages/cpp-addon/package.json ./packages/cpp-addon/
RUN corepack enable pnpm
RUN pnpm i --frozen-lockfile

# ---- Stage 2: build ----
# FROM node:${NODE_VERSION} AS build
FROM setup:1 as build
ARG NODE_ENV=production
ARG DATABASE_URL
WORKDIR /app
COPY --from=deps /app .
COPY . .
RUN corepack enable pnpm
RUN pnpm -F cpp-addon build:electron

CMD ["sh", "-c", "pnpm -F electron-app build && cp -r dist /host_dist && echo '✅ Build complete!'"]