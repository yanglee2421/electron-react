# Electron React App

## Setup Environment

### Windows

```bash
# Install chocolatey cli
powershell -c "irm https://community.chocolatey.org/install.ps1|iex"

# Install dependencies for node-gyp
choco install python visualstudio2022-workload-vctools -y

# Install nodejs & pnpm
choco install nodejs --version='24.19.0'
corepack prepare pnpm --activate
```

### Linux

```bash
# Install dependencies for node-gyp
sudo apt update
sudo apt install -y build-essential python3-minimal

# Install nodejs & pnpm by nodesource
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v
corepack prepare pnpm --activate
```

## Build

### Linux

Use docker to build deb for Linux

```bash
docker compose up --build
```

## Note

```bash
# If you need react dev tools
npx react-devtools
```

```bash
# Setup terminal encode to UTF8 in Powershell
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8
```

### Docker

```bash
docker build ./your_directory
docker build -t imageName:imageTag ./your_directory


docker run --rm my-ubuntu-gcc11 gcc --version
docker run -it --rm my-ubuntu-gcc11 bash

docker ps
docker exec -it <container_id_or_name> bash


docker system prune
docker system prune -a --volumes

docker builder prune
docker builder prune -a
```

### Docker Compose

```bash
docker compose up
docker compose up --build
docker compose up --build -d
docker compose down

docker compose start
docker compose stop
docker compose restart

docker compose ps
docker compose stats
```

### Diskpart

```bash
docker system df
wsl --shutdown
diskpart
select vdisk file="C:\Users\lee\AppData\Local\Docker\wsl\disk\docker_data.vhdx"
compact vdisk
detach vdisk
exit
```
