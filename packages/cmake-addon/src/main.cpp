#include <napi.h>
#include <windows.h>
#include <string>

Napi::Value FindWindowWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "expected 2 arguments: className, windowName")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  LPCWSTR pClassName = NULL;
  std::u16string classNameStr;
  if (info[0].IsString()) {
    classNameStr = info[0].As<Napi::String>().Utf16Value();
    pClassName = (LPCWSTR)classNameStr.c_str();
  }

  LPCWSTR pWindowName = NULL;
  std::u16string windowNameStr;
  if (info[1].IsString()) {
    windowNameStr = info[1].As<Napi::String>().Utf16Value();
    pWindowName = (LPCWSTR)windowNameStr.c_str();
  }

  HWND hwnd = FindWindowW(pClassName, pWindowName);
  return Napi::Number::New(
      env, static_cast<double>(reinterpret_cast<uintptr_t>(hwnd)));
}

Napi::Value SetForegroundWindowWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "expected 1 argument: hwnd (number)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  HWND hwnd = reinterpret_cast<HWND>(
      static_cast<uintptr_t>(info[0].As<Napi::Number>().DoubleValue()));
  BOOL result = SetForegroundWindow(hwnd);
  return Napi::Boolean::New(env, result);
}

struct EnumChildWindowsContext {
  Napi::Env env;
  Napi::Function callback;
};

static BOOL CALLBACK EnumChildWindowsCallbackProc(HWND hwnd, LPARAM lParam) {
  EnumChildWindowsContext* ctx =
      reinterpret_cast<EnumChildWindowsContext*>(lParam);

  Napi::Value hwndObj = Napi::Number::New(
      ctx->env, static_cast<double>(reinterpret_cast<uintptr_t>(hwnd)));
  Napi::Value result = ctx->callback.Call({hwndObj});

  if (result.IsBoolean() && !result.As<Napi::Boolean>().Value()) {
    return FALSE;
  }
  return TRUE;
}

Napi::Value EnumChildWindowsWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsFunction()) {
    Napi::TypeError::New(
        env, "expected 2 arguments: parentHwnd (number), callback (function)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  HWND parentHwnd = reinterpret_cast<HWND>(
      static_cast<uintptr_t>(info[0].As<Napi::Number>().DoubleValue()));

  Napi::Function callback = info[1].As<Napi::Function>();
  EnumChildWindowsContext ctx{env, callback};

  BOOL result = EnumChildWindows(
      parentHwnd, EnumChildWindowsCallbackProc, reinterpret_cast<LPARAM>(&ctx));

  return Napi::Boolean::New(env, result);
}

Napi::Value SendMessageWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 4 || !info[0].IsNumber() || !info[1].IsNumber() ||
      !info[2].IsNumber()) {
    Napi::TypeError::New(
        env,
        "expected at least 4 arguments: hwnd (number), msg (number), wParam (number), lParam (number|string)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  HWND hwnd = reinterpret_cast<HWND>(
      static_cast<uintptr_t>(info[0].As<Napi::Number>().DoubleValue()));
  UINT msg = static_cast<UINT>(info[1].As<Napi::Number>().Uint32Value());
  WPARAM wParam = static_cast<WPARAM>(info[2].As<Napi::Number>().Int64Value());

  UINT timeout = 200;
  if (info.Length() >= 5 && info[4].IsNumber()) {
    timeout = static_cast<UINT>(info[4].As<Napi::Number>().Uint32Value());
  }

  DWORD_PTR dwResult = 0;
  if (info[3].IsString()) {
    std::u16string lParamStr = info[3].As<Napi::String>().Utf16Value();
    SendMessageTimeoutW(
        hwnd,
        msg,
        wParam,
        reinterpret_cast<LPARAM>(lParamStr.c_str()),
        SMTO_ABORTIFHUNG,
        timeout,
        &dwResult);
  } else if (info[3].IsNumber()) {
    LPARAM lParam =
        static_cast<LPARAM>(info[3].As<Napi::Number>().Int64Value());
    SendMessageTimeoutW(
        hwnd, msg, wParam, lParam, SMTO_ABORTIFHUNG, timeout, &dwResult);
  } else {
    Napi::TypeError::New(env, "lParam must be string or number")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Number::New(env, static_cast<double>(dwResult));
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(
      Napi::String::New(env, "findWindow"),
      Napi::Function::New(env, FindWindowWrapped));
  exports.Set(
      Napi::String::New(env, "setForegroundWindow"),
      Napi::Function::New(env, SetForegroundWindowWrapped));
  exports.Set(
      Napi::String::New(env, "enumChildWindows"),
      Napi::Function::New(env, EnumChildWindowsWrapped));
  exports.Set(
      Napi::String::New(env, "sendMessage"),
      Napi::Function::New(env, SendMessageWrapped));

  return exports;
}

// 注册模块。第一个参数是模块名（需与 binding.gyp 一致），第二个是初始化函数
NODE_API_MODULE(cmake_addon, Init)