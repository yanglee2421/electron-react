# 

## Database

- password: `Joney`

## Development

```powershell
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8
```

Commonjs modules must be imported using require

```ts
//
const require = createRequire(import.meta.url);
// odbc only support commonjs
const odbc: typeof import("odbc") = require("odbc");
```

## Build

```powershell
# Install chocolatey cli
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
# Install rebuild dependencies for ia32
choco install python visualstudio2022-workload-vctools -y
```
