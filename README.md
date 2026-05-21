# Electron React App

## Setup Environment

### Windows

```bash
# Install chocolatey cli
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies for node-gyp
choco install python visualstudio2022-workload-vctools -y

# Install nodejs & pnpm
choco install nodejs --version='24.15.0'
corepack enable pnpm
```

### Linux

```bash
# Install dependencies for node-gyp
sudo apt update
sudo apt install -y build-essential python3-minimal

# Install nodejs & pnpm by fnm
curl -o- https://fnm.vercel.app/install | bash
fnm install 24
corepack enable pnpm

# OR install vite plus
curl -fsSL https://vite.plus | bash

# Install nodejs & pnpm by vite plus
vp env setup
vp env on
vp env pin lts

# Install npm dependencies & run script by vite plus
vp i
vpr dev
vpr build
```

## Build

### Linux

Use docker to build deb for Linux

```bash
docker compose up --build
```

## Note

Before development and packaging, generate SQL files for database migration using the following command:

Generating SQL depends on the contents of `schema.ts`. After modifying `schema.ts`, you need to regenerate the SQL files.

```bash
npx drizzle-kit generate
```

If you need react dev tools

```bash
npx react-devtools
```

Setup terminal encode to UTF8 in Powershell

```bash
# windows powershell
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8
```

### Docker

```bash
docker build ./your_directory
docker build -t imageName:imageTag ./your_directory

# 直接用 docker run 执行命令
docker run --rm my-ubuntu-gcc11 gcc --version

# 进入容器交互式检查
docker run -it --rm my-ubuntu-gcc11 bash

# 如果容器已经在运行
docker ps
docker exec -it <container_id_or_name> bash

# 清理掉所有停止的容器、未使用的网络、悬空镜像（dangling images）以及构建缓存
docker system prune
# 默认的 prune 不会删掉“正在被某个容器使用”或者“有标签（Tag）”的镜像。如果你想连同未使用的镜像一起删掉，加上 -a
docker system prune -a --volumes
# 如果你只是想清空构建缓存，可以用
docker builder prune
# 如果要强制删除所有构建缓存（包括最近使用的）：
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
diskpart
# 1. 挂载并选中这个虚拟磁盘文件（注意加双引号）
select vdisk file="C:\Users\<你的用户名>\AppData\Local\Docker\wsl\data\ext4.vhdx"

# 2. 以只读模式紧缩磁盘（这一步是核心）
compact vdisk

# 3. 压缩完成后，分离磁盘并退出
detach vdisk
exit
```

Else

- HMIS:从`usprofile.ini`文件读取`InputSkip`，确保自动填充不会引起闪退
- password: `Joney`
