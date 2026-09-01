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
# RUN corepack prepare pnpm@11.21.0 --activate
# RUN apt-get install -y g++-11 gcc-11
# RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-11 110
# RUN update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-11 110

# ---- Stage 1: build ----
FROM electron:linux AS build
ARG NODE_ENV=production
WORKDIR /app
COPY .npmrc .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
RUN --mount=type=cache,id=pnpm-store-cache,target=/root/.local/share/pnpm/store/v11 \
	pnpm fetch
COPY . .
RUN --mount=type=cache,id=pnpm-store-cache,target=/root/.local/share/pnpm/store/v11 \
 	--mount=type=cache,id=electron-cache,target=/root/.cache/electron \
 	--mount=type=cache,id=electron-builder-cache,target=/root/.cache/electron-builder \
	pnpm i --frozen-lockfile --offline && pnpm build
# CMD ["tail", "-f", "/dev/null"]

# --- Stage 2: export
FROM alpine:latest AS export
WORKDIR /app
COPY --from=build /app/apps/ziyun/release .
CMD ["sh", "-c", "cp -r /app/. /output_dist"]