#define NAPI_CPP_EXCEPTIONS
#include <napi.h>
#include <windows.h>
#include <string>
#include "TOFDPort.h"
#include "js_util.h"

struct AutoInputParams {
  std::u16string zx, zh, czzzdw, sczzdw, mczzdw, czzzrq, sczzrq, mczzrq;
  int ztx, ytx;
};

static bool IsRunAsAdmin() {
  BOOL fIsRunAsAdmin = FALSE;
  HANDLE hToken = NULL;
  if (OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &hToken)) {
    TOKEN_ELEVATION elevation;
    DWORD cbSize = sizeof(TOKEN_ELEVATION);
    if (GetTokenInformation(
            hToken, TokenElevation, &elevation, sizeof(elevation), &cbSize)) {
      fIsRunAsAdmin = elevation.TokenIsElevated;
    }
  }
  if (hToken) {
    CloseHandle(hToken);
  }
  return fIsRunAsAdmin;
}

static BOOL CALLBACK EnumChildProc(HWND hwnd, LPARAM lParam) {
  AutoInputParams* p = reinterpret_cast<AutoInputParams*>(lParam);
  LONG_PTR id = GetWindowLongPtrW(hwnd, GWL_ID);
  switch (id) {
    case 1304:
      SendMessageW(hwnd, CB_SELECTSTRING, (WPARAM)-1, (LPARAM)p->zx.c_str());
      break;
    case 1200:
      SendMessageW(hwnd, WM_SETTEXT, 0, (LPARAM)p->zh.c_str());
      break;
    case 1201:
      SendMessageW(hwnd, WM_SETTEXT, 0, (LPARAM)p->czzzdw.c_str());
      break;
    case 1202:
      SendMessageW(hwnd, WM_SETTEXT, 0, (LPARAM)p->sczzdw.c_str());
      break;
    case 1203:
      SendMessageW(hwnd, WM_SETTEXT, 0, (LPARAM)p->mczzdw.c_str());
      break;
    case 1204:
      SendMessageW(hwnd, WM_SETTEXT, 0, (LPARAM)p->czzzrq.c_str());
      break;
    case 1205:
      SendMessageW(hwnd, WM_SETTEXT, 0, (LPARAM)p->sczzrq.c_str());
      break;
    case 1206:
      SendMessageW(hwnd, WM_SETTEXT, 0, (LPARAM)p->mczzrq.c_str());
      break;
    case 1400:
      SendMessageW(hwnd, BM_SETCHECK, (WPARAM)p->ztx, 0);
      break;
    case 1401:
      SendMessageW(hwnd, BM_SETCHECK, (WPARAM)p->ytx, 0);
      break;
    case 7360:
      SendMessageW(hwnd, BM_SETCHECK, 1, 0);
      break;
  }
  return TRUE;
}

bool AutoInputToVC(
    const std::u16string& zx,
    const std::u16string& zh,
    const std::u16string& czzzdw,
    const std::u16string& sczzdw,
    const std::u16string& mczzdw,
    const std::u16string& czzzrq,
    const std::u16string& sczzrq,
    const std::u16string& mczzrq,
    int ztx,
    int ytx,
    std::string& outError) {
  std::u16string appTitle = u"信息录入 . 现车轮";
  HWND hwnd = FindWindowW(NULL, (LPCWSTR)appTitle.c_str());
  if (!hwnd) {
    outError = "未打开探伤机程序或配置错误!";
    return false;
  }
  SetForegroundWindow(hwnd);
  AutoInputParams params{
      zx, zh, czzzdw, sczzdw, mczzdw, czzzrq, sczzrq, mczzrq, ztx, ytx};
  EnumChildWindows(hwnd, EnumChildProc, (LPARAM)&params);
  return true;
}

Napi::Value IsRunAsAdminWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    bool isAdmin = IsRunAsAdmin();
    return Napi::Boolean::New(env, isAdmin);
  });
}

class AutoInputWorker : public Napi::AsyncWorker {
 public:
  AutoInputWorker(
      Napi::Env env,
      const std::u16string& zx,
      const std::u16string& zh,
      const std::u16string& czzzdw,
      const std::u16string& sczzdw,
      const std::u16string& mczzdw,
      const std::u16string& czzzrq,
      const std::u16string& sczzrq,
      const std::u16string& mczzrq,
      int ztx,
      int ytx)
      : Napi::AsyncWorker(env),
        zx_(zx),
        zh_(zh),
        czzzdw_(czzzdw),
        sczzdw_(sczzdw),
        mczzdw_(mczzdw),
        czzzrq_(czzzrq),
        sczzrq_(sczzrq),
        mczzrq_(mczzrq),
        ztx_(ztx),
        ytx_(ytx),
        deferred_(Napi::Promise::Deferred::New(env)) {}
  Napi::Promise Promise() {
    return deferred_.Promise();
  }

 protected:
  void Execute() override {
    JS::TryExecute(
        [&]() {
          if (!IsRunAsAdmin()) {
            SetError("自动填充需要管理员权限，请以管理员身份运行程序!");
            return;
          }

          std::string err;
          bool ok = AutoInputToVC(
              zx_,
              zh_,
              czzzdw_,
              sczzdw_,
              mczzdw_,
              czzzrq_,
              sczzrq_,
              mczzrq_,
              ztx_,
              ytx_,
              err);

          if (!ok) {
            SetError(err);
          }
        },
        [&](const std::string& err) { SetError(err); });
  }
  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }
  void OnOK() override {
    deferred_.Resolve(Napi::Boolean::New(Env(), true));
  }

 private:
  Napi::Promise::Deferred deferred_;
  std::u16string zx_, zh_, czzzdw_, sczzdw_, mczzdw_, czzzrq_, sczzrq_, mczzrq_;
  int ztx_, ytx_;
};

Napi::Value AutoInputToVCWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    std::u16string zx = info[0].As<Napi::String>().Utf16Value();
    std::u16string zh = info[1].As<Napi::String>().Utf16Value();
    std::u16string czzzdw = info[2].As<Napi::String>().Utf16Value();
    std::u16string sczzdw = info[3].As<Napi::String>().Utf16Value();
    std::u16string mczzdw = info[4].As<Napi::String>().Utf16Value();
    std::u16string czzzrq = info[5].As<Napi::String>().Utf16Value();
    std::u16string sczzrq = info[6].As<Napi::String>().Utf16Value();
    std::u16string mczzrq = info[7].As<Napi::String>().Utf16Value();
    int ztx = info[8].As<Napi::Number>().Int32Value();
    int ytx = info[9].As<Napi::Number>().Int32Value();

    AutoInputWorker* worker = new AutoInputWorker(
        env, zx, zh, czzzdw, sczzdw, mczzdw, czzzrq, sczzrq, mczzrq, ztx, ytx);

    worker->Queue();

    return worker->Promise();
  });
}

Napi::Value FindWindowWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
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
  });
}

Napi::Value SetForegroundWindowWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    if (info.Length() < 1 || !info[0].IsNumber()) {
      Napi::TypeError::New(env, "expected 1 argument: hwnd (number)")
          .ThrowAsJavaScriptException();
      return env.Null();
    }

    HWND hwnd = reinterpret_cast<HWND>(
        static_cast<uintptr_t>(info[0].As<Napi::Number>().DoubleValue()));
    BOOL result = SetForegroundWindow(hwnd);
    return Napi::Boolean::New(env, result);
  });
}

struct EnumChildWindowsContext {
  Napi::Env env;
  Napi::Function callback;
};

static BOOL CALLBACK EnumChildWindowsCallbackProc(HWND hwnd, LPARAM lParam) {
  EnumChildWindowsContext* ctx =
      reinterpret_cast<EnumChildWindowsContext*>(lParam);

  try {
    Napi::Env env = ctx->env;
    Napi::HandleScope scope(env);
    double hwndDouble = static_cast<double>(reinterpret_cast<uintptr_t>(hwnd));
    Napi::Value hwndObj = Napi::Number::New(env, hwndDouble);
    Napi::Value result = ctx->callback.Call({hwndObj});

    if (env.IsExceptionPending()) {
      return FALSE;
    }

    return result.ToBoolean().Value();
  } catch (...) {
    return FALSE;
  }
}

Napi::Value EnumChildWindowsWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
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
        parentHwnd,
        EnumChildWindowsCallbackProc,
        reinterpret_cast<LPARAM>(&ctx));

    return Napi::Boolean::New(env, result);
  });
}

Napi::Value SendMessageWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
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
    WPARAM wParam =
        static_cast<WPARAM>(info[2].As<Napi::Number>().Int64Value());

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
  });
}

Napi::Value TOFD_PORT_OpenDeviceWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    bool result = TOFDPort::TOFD_PORT_OpenDevice(2);

    return Napi::Boolean::New(env, result);
  });
}

Napi::Value TOFD_PORT_CloseDeviceWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    bool result = TOFDPort::TOFD_PORT_CloseDevice();

    return Napi::Boolean::New(env, result);
  });
}

Napi::Value TOFD_PORT_IsOpenWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    bool result = TOFDPort::TOFD_PORT_IsOpen();

    return Napi::Boolean::New(env, result);
  });
}

Napi::Value TOFD_PORT_SetFrequencyWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    int iFrequency = info[0].As<Napi::Number>().Int32Value();
    bool result = TOFDPort::TOFD_PORT_SetFrequency(iFrequency);

    return Napi::Boolean::New(env, result);
  });
}

Napi::Value ITS_initWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    TOFDPortExtensions::ITS_init();

    return env.Undefined();
  });
}

Napi::Value ITS_IsExistWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    bool result = TOFDPortExtensions::ITS_IsExist();

    return Napi::Boolean::New(env, result);
  });
}

Napi::Value ITS_IsOpenWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    bool result = TOFDPortExtensions::ITS_IsOpen();

    return Napi::Boolean::New(env, result);
  });
}

Napi::Value ITS_SetChWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int ch_left_s = info[0].As<Napi::Number>().Uint32Value();
    unsigned int ch_left_r = info[1].As<Napi::Number>().Uint32Value();
    unsigned int ch_right_s = info[2].As<Napi::Number>().Uint32Value();
    unsigned int ch_right_r = info[3].As<Napi::Number>().Uint32Value();

    TOFDPortExtensions::ITS_SetCh(ch_left_s, ch_left_r, ch_right_s, ch_right_r);

    return env.Undefined();
  });
}

Napi::Value ITS_SetPlusWidthWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int plus_left = info[0].As<Napi::Number>().Uint32Value();
    unsigned int plus_right = info[1].As<Napi::Number>().Uint32Value();

    TOFDPortExtensions::ITS_SetPlusWidth(plus_left, plus_right);

    return env.Undefined();
  });
}

Napi::Value ITS_SetXmoveWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int xmove_left = info[0].As<Napi::Number>().Uint32Value();
    unsigned int xmove_right = info[1].As<Napi::Number>().Uint32Value();

    TOFDPortExtensions::ITS_SetXmove(xmove_left, xmove_right);

    return env.Undefined();
  });
}

Napi::Value ITS_SetdBWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int dB_left = info[0].As<Napi::Number>().Uint32Value();
    unsigned int dB_right = info[1].As<Napi::Number>().Uint32Value();

    TOFDPortExtensions::ITS_SetdB(dB_left, dB_right);

    return env.Undefined();
  });
}

Napi::Value ITS_SetDisWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int disW_left = info[0].As<Napi::Number>().Uint32Value();
    unsigned int disW_right = info[1].As<Napi::Number>().Uint32Value();

    TOFDPortExtensions::ITS_SetDis(disW_left, disW_right);

    return env.Undefined();
  });
}

Napi::Value ITS_SelfcheckWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int ch_left = info[0].As<Napi::Number>().Uint32Value();
    unsigned int ch_right = info[1].As<Napi::Number>().Uint32Value();

    TOFDPortExtensions::ITS_Selfcheck(ch_left, ch_right);

    return env.Undefined();
  });
}

Napi::Value ITS_SetZeroLeavelWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int zl_left = info[0].As<Napi::Number>().Uint32Value();
    unsigned int zl_right = info[1].As<Napi::Number>().Uint32Value();

    TOFDPortExtensions::ITS_SetZeroLeavel(zl_left, zl_right);

    return env.Undefined();
  });
}

Napi::Value ITS_SetZipWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int zip_left = info[0].As<Napi::Number>().Uint32Value();
    unsigned int zip_right = info[1].As<Napi::Number>().Uint32Value();

    TOFDPortExtensions::ITS_SetZip(zip_left, zip_right);

    return env.Undefined();
  });
}

Napi::Value ITS_GetEncoderWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    unsigned int ch = info[0].As<Napi::Number>().Uint32Value();
    unsigned int mode = info[1].As<Napi::Number>().Uint32Value();

    signed int result = TOFDPortExtensions::ITS_GetEncoder(ch, mode);

    return Napi::Number::New(env, result);
  });
}

Napi::Value ITS_StartWrapped(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  return JS::Try(env, [&]() -> Napi::Value {
    Napi::Buffer<unsigned char> buf_left =
        info[0].As<Napi::Buffer<unsigned char>>();
    Napi::Buffer<unsigned char> buf_right =
        info[1].As<Napi::Buffer<unsigned char>>();

    bool result =
        TOFDPortExtensions::ITS_Start(buf_left.Data(), buf_right.Data());

    return Napi::Boolean::New(env, result);
  });
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

  // TOFDPort functions
  exports.Set(
      Napi::String::New(env, "TOFD_PORT_OpenDevice"),
      Napi::Function::New(env, TOFD_PORT_OpenDeviceWrapped));
  exports.Set(
      Napi::String::New(env, "TOFD_PORT_CloseDevice"),
      Napi::Function::New(env, TOFD_PORT_CloseDeviceWrapped));
  exports.Set(
      Napi::String::New(env, "TOFD_PORT_IsOpen"),
      Napi::Function::New(env, TOFD_PORT_IsOpenWrapped));
  exports.Set(
      Napi::String::New(env, "TOFD_PORT_SetFrequency"),
      Napi::Function::New(env, TOFD_PORT_SetFrequencyWrapped));

  // TOFDPortExtensions functions
  exports.Set(
      Napi::String::New(env, "ITS_init"),
      Napi::Function::New(env, ITS_initWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_IsExist"),
      Napi::Function::New(env, ITS_IsExistWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_IsOpen"),
      Napi::Function::New(env, ITS_IsOpenWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_SetCh"),
      Napi::Function::New(env, ITS_SetChWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_SetPlusWidth"),
      Napi::Function::New(env, ITS_SetPlusWidthWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_SetXmove"),
      Napi::Function::New(env, ITS_SetXmoveWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_SetdB"),
      Napi::Function::New(env, ITS_SetdBWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_SetDis"),
      Napi::Function::New(env, ITS_SetDisWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_Selfcheck"),
      Napi::Function::New(env, ITS_SelfcheckWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_SetZeroLeavel"),
      Napi::Function::New(env, ITS_SetZeroLeavelWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_SetZip"),
      Napi::Function::New(env, ITS_SetZipWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_GetEncoder"),
      Napi::Function::New(env, ITS_GetEncoderWrapped));
  exports.Set(
      Napi::String::New(env, "ITS_Start"),
      Napi::Function::New(env, ITS_StartWrapped));

  return exports;
}

NODE_API_MODULE(hello_addon, Init)