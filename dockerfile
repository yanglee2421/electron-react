# syntax=docker/dockerfile:1

# ---- Stage 0: enviornment ----
# FROM ubuntu:20.04 AS enviornment
# ENV DEBIAN_FRONTEND=noninteractive
# RUN apt-get update
# RUN apt-get install -y software-properties-common
# RUN add-apt-repository ppa:ubuntu-toolchain-r/test
# RUN apt-get update
# RUN apt-get install -y build-essential python3-minimal curl
# RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
# RUN apt-get install -y nodejs
# RUN corepack enable pnpm
# RUN apt-get install -y g++-11 gcc-11
# RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-11 110
# RUN update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-11 110

# ---- Stage 1: deps ----
FROM electron:linux AS deps
WORKDIR /app
COPY apps/dsb/package.json ./apps/dsb/
COPY apps/ziyun/package.json ./apps/ziyun/
COPY packages/cpp-addon/package.json ./packages/cpp-addon/
COPY packages/external-db/package.json ./packages/external-db/
COPY .node-version .
COPY .npmrc .
COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
RUN --mount=type=cache,id=electron-react-local,target=/root/.local \
 	--mount=type=cache,id=electron-react-cache,target=/root/.cache \
	pnpm i --frozen-lockfile

# ---- Stage 2: build ----
FROM electron:linux AS build
ARG NODE_ENV=production
WORKDIR /app
COPY --from=deps /app .
COPY . .
RUN --mount=type=cache,id=electron-react-local,target=/root/.local \
 	--mount=type=cache,id=electron-react-cache,target=/root/.cache \
	pnpm build

# --- Stage 3: export
FROM alpine:latest AS export
WORKDIR /app
COPY --from=build /app/apps/ziyun/release .
CMD ["sh", "-c", "cp -r /app/. /output_dist"]