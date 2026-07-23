#include <string>
#define NAPI_CPP_EXCEPTIONS
#include <napi.h>
#include "js_util.h"

// Stub implementations for Linux

Napi::Value ShowAlert(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return JS::Try(
      env, [&]() -> Napi::Value { return Napi::Number::New(env, 0); });
}

Napi::Value IsRunAsAdminWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return JS::Try(
      env, [&]() -> Napi::Value { return Napi::Boolean::New(env, false); });
}

Napi::Value AutoInputToVCWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return JS::Try(
      env, [&]() -> Napi::Value { return Napi::Boolean::New(env, false); });
}

Napi::Value FindWindowWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return JS::Try(
      env, [&]() -> Napi::Value { return Napi::Number::New(env, 0); });
}

Napi::Value SetForegroundWindowWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return JS::Try(
      env, [&]() -> Napi::Value { return Napi::Boolean::New(env, false); });
}

Napi::Value EnumChildWindowsWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return JS::Try(
      env, [&]() -> Napi::Value { return Napi::Boolean::New(env, false); });
}

Napi::Value SendMessageWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return JS::Try(
      env, [&]() -> Napi::Value { return Napi::Number::New(env, 0); });
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(
      Napi::String::New(env, "isRunAsAdmin"),
      Napi::Function::New(env, IsRunAsAdminWrapped));
  exports.Set(
      Napi::String::New(env, "autoInputToVC"),
      Napi::Function::New(env, AutoInputToVCWrapped));
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

NODE_API_MODULE(hello_addon, Init)
