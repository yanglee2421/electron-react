#define NAPI_CPP_EXCEPTIONS
#include <napi.h>
#include <string>
#include "js_util.h"

Napi::Value IsRunAsAdminWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  return JS::Try(
      env, [&]() -> Napi::Value { return Napi::Boolean::New(env, false); });
}

Napi::Value AutoInputToVCWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  return JS::Try(env, [&]() -> Napi::Value {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Resolve(Napi::Boolean::New(env, false));

    return deferred.Promise();
  });
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(
      Napi::String::New(env, "isRunAsAdmin"),
      Napi::Function::New(env, IsRunAsAdminWrapped));
  exports.Set(
      Napi::String::New(env, "autoInputToVC"),
      Napi::Function::New(env, AutoInputToVCWrapped));

  return exports;
}

NODE_API_MODULE(hello_addon, Init)
