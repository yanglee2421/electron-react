# ---- Stage 0: enviornment ----
# FROM ubuntu:20.04 AS enviornment
# ENV DEBIAN_FRONTEND=noninteractive
# RUN apt-get update
# RUN apt-get install software-properties-common -y
# RUN add-apt-repository ppa:ubuntu-toolchain-r/test
# RUN apt-get update
# RUN apt-get install -y build-essential python3-minimal curl
# RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
# RUN apt-get install -y nodejs
# RUN corepack enable pnpm
# RUN corepack prepare pnpm@11.1.3 --activate
# RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-11 110
# RUN update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-11 110

# ---- Stage 1: deps ----
FROM electron:linux AS deps
WORKDIR /app
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/electron-app/package.json ./packages/electron-app/
COPY packages/cpp-addon/package.json ./packages/cpp-addon/
RUN pnpm i --frozen-lockfile

# ---- Stage 2: build ----
FROM electron:linux AS build
ARG NODE_ENV=production
ARG DATABASE_URL
WORKDIR /app
COPY --from=deps /app .
COPY . .
RUN pnpm -F cpp-addon build:electron
RUN pnpm -F app-ziyun build

# --- Stage 3: export
FROM ubuntu:20.04 AS export
WORKDIR /app
COPY --from=build /app/packages/electron-app/release .
CMD ["sh", "-c", "cp -r /app/. /output_dist"]