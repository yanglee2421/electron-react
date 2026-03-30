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

1. 打印:日校表格填入数据
2. HMIS:从`usprofile.ini`文件读取`InputSkip`，确保自动填充不会引起闪退
3.

## Cpp Addon

### Setup Environment

```bash
# Windows powershell
# Install chocolatey cli
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
# Install rebuild dependencies for ia32
choco install python visualstudio2022-workload-vctools -y
```

**CPP 与 JS 类型对照表**

- **整型**:
  - `int8_t` / `uint8_t` : 对应 JS `Number`（通常作为整数处理），可通过 `v8::Integer` / `Napi::Number` 传递
  - `int16_t` / `uint16_t`: JS `Number`
  - `int32_t` / `uint32_t`: JS `Number`（可用 `v8::Integer::New` 或 `Napi::Number::New`）
  - `int64_t` / `uint64_t`: JS `Number`（精度受限，超过 2^53-1 会丢失精度）或 `BigInt`（推荐使用 `BigInt` 以保持精度）

- **浮点型**:
  - `float`, `double` : JS `Number`（双精度浮点），通过 `Napi::Number` 传递

- **布尔型**:
  - `bool` : JS `Boolean`（`Napi::Boolean` / `v8::Boolean`）

- **字符串**:
  - `std::string`, `char*`: JS `String`（`Napi::String::New`，注意编码 UTF-8）

- **二进制 / 缓冲区**:
  - `std::vector<uint8_t>`, `uint8_t*`, `char*` + 长度: JS `Buffer`（`Napi::Buffer`）

- **对象 / 结构体**:
  - 自定义 C++ 结构：映射为 JS `Object`（手动构建属性或使用 `napi_wrap`／`ObjectWrap` 将 C++ 对象绑定为 JS 类实例）

- **数组**:
  - C++ 数组 / `std::vector<T>`: JS `Array` 或 `TypedArray`（例如 `Int32Array`, `Float64Array`），根据元素类型选择合适的 TypedArray

- **指针 / 引用**:
  - 原生指针不能直接在 JS 中表示，通常通过封装为外部对象（`External`）或 `ObjectWrap` 暴露方法访问

- **空值**:
  - `nullptr` / NULL : JS `null`
  - 可选值（`std::optional<T>`）: 映射为值或 `null`，视实现而定

- **错误/异常**:
  - C++ 异常（若启用）: 在绑定代码中捕获并转换为 JS `Error`（`Napi::Error::New(env, msg).ThrowAsJavaScriptException()`）

说明：在使用 `node-addon-api`（N-API C++ 封装）时，优先使用 `Napi::Value`、`Napi::Object`、`Napi::Array`、`Napi::Buffer`、`Napi::Number` 等类型进行转换与返回；对精度敏感的整数请使用 `BigInt` 映射。

示例（伪代码）：

```cpp
// 从 JS 接收 int64 或 BigInt
Napi::Value arg = info[0];
if (arg.IsBigInt()) {
	bool lossless;
	int64_t v = arg.As<Napi::BigInt>().Int64Value(&lossless);
}
```
