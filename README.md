#

## Database

- password: `Joney`

## Development

```bash
# windows powershell
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8
```

Commonjs modules must be imported using require

```ts
//
const require = createRequire(import.meta.url);
// odbc only support commonjs
const odbc: typeof import("odbc") = require("odbc");
```

If you need react dev tools

```bash
npx react-devtools
```

## Rebuild

When use native module like better-sqlite3 need to rebuild it by @electron/rebuild

```bash
# Windows powershell
# Install chocolatey cli
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
# Install rebuild dependencies for ia32
choco install python visualstudio2022-workload-vctools -y
yarn rebuild -w -f better-sqlite3
```

## Databse

Before development and packaging, generate SQL files for database migration using the following command:

Generating SQL depends on the contents of `schema.ts`. After modifying `schema.ts`, you need to regenerate the SQL files.

> Note: `@electron/rebuild` is internally invoked by `electron-builder`, but during the development phase, `electron-builder` is not used for packaging.

```bash
npx drizzle-kit generate
```

## Note

> `get`: 从缓存/存储/API中取值  
> `make`/`build`: 创建新对象/实例  
> `format`/`transform`/`convert`: 转换/格式化数据
> `update`/`modify`: 更新操作  
> `detelte`/`remove`: 删除操作  
> `velidate`/`verify`: 验证操作
> `normalize`: 归一化
