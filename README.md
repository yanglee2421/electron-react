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

Else

- HMIS:从`usprofile.ini`文件读取`InputSkip`，确保自动填充不会引起闪退
- password: `Joney`
