# ---- Stage 0: enviornment ----
FROM ubuntu:20.04 AS enviornment
ENV DEBIAN_FRONTEND=noninteractive
RUN ldd --version
RUN apt-get update
RUN apt-get install -y build-essential python3-minimal curl
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
RUN apt-get install -y nodejs
RUN corepack enable pnpm
RUN pnpm -v


# ---- Stage 1: deps ----
FROM enviornment AS deps
WORKDIR /app
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/electron-app/package.json ./packages/electron-app/
COPY packages/cpp-addon/package.json ./packages/cpp-addon/
RUN corepack enable pnpm
RUN pnpm i --frozen-lockfile

# ---- Stage 2: build ----
FROM enviornment as build
ARG NODE_ENV=production
ARG DATABASE_URL
WORKDIR /app
COPY --from=deps /app .
COPY . .
RUN corepack enable pnpm
RUN pnpm -F cpp-addon build:electron

CMD ["sh", "-c", "pnpm -F electron-app build && cp -r dist /host_dist && echo '✅ Build complete!'"]