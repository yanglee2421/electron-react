#define NAPI_CPP_EXCEPTIONS
#include <napi.h>
#include <string>
#include "js_util.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  return exports;
}

NODE_API_MODULE(hello_addon, Init)
