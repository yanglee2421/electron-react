#define NAPI_CPP_EXCEPTIONS
#include <napi.h>
#include <windows.h>
#include <string>
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

          std::string err = "";
          std::u16string appTitle = u"信息录入 . 现车轮";
          HWND hwnd = FindWindowW(NULL, (LPCWSTR)appTitle.c_str());

          if (!hwnd) {
            err = "未打开探伤机程序或配置错误!";
          }

          AutoInputParams params{
              zx_,
              zh_,
              czzzdw_,
              sczzdw_,
              mczzdw_,
              czzzrq_,
              sczzrq_,
              mczzrq_,
              ztx_,
              ytx_};

          SetForegroundWindow(hwnd);
          EnumChildWindows(hwnd, EnumChildProc, (LPARAM)&params);

          if (!err.empty()) {
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