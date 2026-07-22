#include <windows.h>
#include <string>
#define NAPI_CPP_EXCEPTIONS
#include <napi.h>

template <typename Fn>
static Napi::Value JsSafeCall(const Napi::Env& env, Fn&& func) {
  try {
    return func();
  } catch (Napi::Error& e) {
    e.ThrowAsJavaScriptException();
  } catch (const std::exception& ex) {
    Napi::Error::New(env, ex.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "An unknown error occurred")
        .ThrowAsJavaScriptException();
  }

  return env.Null();
}

template <typename Fn, typename ErrorCallback>
static void SafeExecute(Fn&& func, ErrorCallback&& onError) {
  try {
    func();
  } catch (const std::exception& ex) {
    onError(ex.what());
  } catch (...) {
    onError("An unknown error occurred");
  }
}

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
  Napi::Env env = info.Env();

  return JsSafeCall(env, [&]() -> Napi::Value {
    bool isAdmin = IsRunAsAdmin();
    return Napi::Boolean::New(env, isAdmin);
  });
}

Napi::Value AutoInputToVCWrapped(const Napi::CallbackInfo& info) {
  class AutoInputWorker : public Napi::AsyncWorker {
   public:
    AutoInputWorker(
        Napi::Function& callback,
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
        Napi::Promise::Deferred deferred)
        : Napi::AsyncWorker(callback),
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
          deferred_(deferred) {}

    void Execute() override {
      SafeExecute(
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
    void OnOK() override {
      deferred_.Resolve(Napi::Boolean::New(Env(), true));
    }
    void OnError(const Napi::Error& e) override {
      deferred_.Reject(e.Value());
    }

   private:
    std::u16string zx_, zh_, czzzdw_, sczzdw_, mczzdw_, czzzrq_, sczzrq_,
        mczzrq_;
    int ztx_, ytx_;
    Napi::Promise::Deferred deferred_;
  };

  Napi::Env env = info.Env();

  return JsSafeCall(env, [&]() -> Napi::Value {
    if (info.Length() < 10) {
      Napi::TypeError::New(env, "expected 10 arguments")
          .ThrowAsJavaScriptException();
      return env.Null();
    }

    for (int i = 0; i < 8; i++) {
      if (!info[i].IsString()) {
        std::string errorMessage =
            "Argument " + std::to_string(i) + " must be a string";
        Napi::TypeError::New(env, errorMessage).ThrowAsJavaScriptException();
        return env.Null();
      }
    }

    if (!info[8].IsNumber() || !info[9].IsNumber()) {
      Napi::TypeError::New(env, "Arguments 8-9 must be numbers")
          .ThrowAsJavaScriptException();
      return env.Null();
    }

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

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    Napi::Function cb =
        Napi::Function::New(env, [](const Napi::CallbackInfo&) {});
    AutoInputWorker* worker = new AutoInputWorker(
        cb,
        zx,
        zh,
        czzzdw,
        sczzdw,
        mczzdw,
        czzzrq,
        sczzrq,
        mczzrq,
        ztx,
        ytx,
        deferred);
    worker->Queue();
    return deferred.Promise();
  });
}

Napi::Value FindWindowWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  return JsSafeCall(env, [&]() -> Napi::Value {
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
  Napi::Env env = info.Env();

  return JsSafeCall(env, [&]() -> Napi::Value {
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
  Napi::Env env = info.Env();

  return JsSafeCall(env, [&]() -> Napi::Value {
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
  Napi::Env env = info.Env();

  return JsSafeCall(env, [&]() -> Napi::Value {
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