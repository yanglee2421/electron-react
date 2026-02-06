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

## 导出函数与常量对象纯性检测

**纯函数（确定性、无外部副作用）**

- `minmax` — [src/renderer/lib/utils.ts](src/renderer/lib/utils.ts)：纯（纯数学运算）
- `isWithinRange` — [src/renderer/lib/utils.ts](src/renderer/lib/utils.ts)：纯
- `chunk` — [src/renderer/lib/utils.ts](src/renderer/lib/utils.ts) 与 [src/main/utils.ts](src/main/utils.ts)：纯（仅数组切分）
- `listToTree` — [src/pure.ts](src/pure.ts)：纯（纯数据结构转换）

**非纯函数（包含外部副作用、I/O、DOM、IPC、定时器等）**

- 主进程相关的函数（位于 `src/main/**`），如文件/目录操作、数据库、IPC 绑定、创建/移除临时目录等：例如 `getAppDBPath`、`getProfile`、`setProfile`、`bindIpcHandler`、`db` 创建与读写等，均为非纯。
- 使用计时器或定时调度的工具（如 `debounce`、`createEmit` 内部事件、`onAnimationFrame` 等）：非纯。

**向外暴露的常量对象（对象/Map/数组/数据库表/Store/DB 实例等）**

- `db` — [src/renderer/lib/db.ts](src/renderer/lib/db.ts)：`Dexie` 实例（IndexedDB 封装）
- `cellPaddingMap` — [src/renderer/lib/constants.ts](src/renderer/lib/constants.ts)：`Map` 实例
- `rowsPerPageOptions` — [src/renderer/lib/constants.ts](src/renderer/lib/constants.ts)：数组常量
- 主进程 DB（应用级） — `db` 在 [src/main/lib.ts](src/main/lib.ts)（由 createDB() 创建）
- `channel` 枚举 — [src/main/channel.ts](src/main/channel.ts)

**备注与建议**

- 本次检测使用启发式静态规则完成，能覆盖明显的 I/O/DOM/IPC/定时器/数据库调用，但不能保证检测所有隐式副作用（例如外部库内部副作用或运行时才可判定的行为）。
- 对于标注为“依赖/条件纯”的函数，建议审查其调用方传入的回调是否含副作用，或编写单元测试验证确定性。
- 如果你希望我把此分析进一步细化为逐个导出符号的逐行精确判断（包含源码片段与行号），我可以继续把每个导出逐一检查并在 README 中添加链接与行号。
