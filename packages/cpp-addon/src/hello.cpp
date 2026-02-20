#include <napi.h>
#include <windows.h>
#include <string>

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
// static std::wstring Utf8ToW(const std::string &s)
// {
//     if (s.empty())
//         return std::wstring();
//     int n = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, NULL, 0);
//     std::wstring w;
//     w.resize(n - 1);
//     MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, &w[0], n);
//     return w;
// }

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

Napi::Value Add(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Wrong number of arguments")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  double value1 = info[0].As<Napi::Number>().DoubleValue();
  double value2 = info[1].As<Napi::Number>().DoubleValue();
  Napi::Number sum = Napi::Number::New(env, value1 + value2);

  return sum;
}

Napi::Value ShowAlert(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "String expected for both arguments")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  // Async worker to run MessageBoxW without blocking the event loop
  class AlertWorker : public Napi::AsyncWorker {
   public:
    AlertWorker(
        Napi::Function& callback,
        const std::wstring& message,
        const std::wstring& title,
        Napi::Promise::Deferred deferred)
        : Napi::AsyncWorker(callback),
          message_(message),
          title_(title),
          deferred_(deferred),
          result_(0) {}

    void Execute() override {
      // 调用 Windows API (阻塞操作)
      result_ = MessageBoxW(
          NULL,
          (LPCWSTR)message_.c_str(),
          (LPCWSTR)title_.c_str(),
          MB_OKCANCEL | MB_ICONINFORMATION);
    }
    void OnOK() override {
      deferred_.Resolve(Napi::Number::New(Env(), result_));
    }
    void OnError(const Napi::Error& e) override {
      deferred_.Reject(e.Value());
    }

   private:
    std::wstring message_, title_;
    Napi::Promise::Deferred deferred_;
    int result_;
  };

  // 2. 将 JS 字符串转换为 UTF-16 (std::u16string)
  std::u16string message = info[0].As<Napi::String>().Utf16Value();
  std::u16string title = info[1].As<Napi::String>().Utf16Value();
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
  Napi::Function cb =
      Napi::Function::New(env, [](const Napi::CallbackInfo&) {});
  AlertWorker* worker = new AlertWorker(
      cb, (LPCWSTR)message.c_str(), (LPCWSTR)title.c_str(), deferred);
  worker->Queue();

  return deferred.Promise();
}

Napi::Value IsRunAsAdminWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  bool isAdmin = IsRunAsAdmin();
  return Napi::Boolean::New(env, isAdmin);
}

Napi::Value AutoInputToVCWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 10) {
    Napi::TypeError::New(env, "expected 10 arguments")
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

  // std::wstring wzx = Utf8ToW(zx);
  // std::wstring wzh = Utf8ToW(zh);
  // std::wstring wczzzdw = Utf8ToW(czzzdw);
  // std::wstring wsczzdw = Utf8ToW(sczzdw);
  // std::wstring wmczzdw = Utf8ToW(mczzdw);
  // std::wstring wczzzrq = Utf8ToW(czzzrq);
  // std::wstring wsczzrq = Utf8ToW(sczzrq);
  // std::wstring wmczzrq = Utf8ToW(mczzrq);

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
      if (!IsRunAsAdmin()) {
        SetError(
            "Administrator privileges required to interact with the target "
            "window.");
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
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "add"), Napi::Function::New(env, Add));
  exports.Set(
      Napi::String::New(env, "showAlert"), Napi::Function::New(env, ShowAlert));
  exports.Set(
      Napi::String::New(env, "isRunAsAdmin"),
      Napi::Function::New(env, IsRunAsAdminWrapped));
  exports.Set(
      Napi::String::New(env, "autoInputToVC"),
      Napi::Function::New(env, AutoInputToVCWrapped));

  return exports;
}

// 注册模块。第一个参数是模块名（需与 binding.gyp 一致），第二个是初始化函数
NODE_API_MODULE(hello_addon, Init)