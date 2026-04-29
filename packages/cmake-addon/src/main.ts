import module from "node:module";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = module.createRequire(import.meta.url);

interface CmakeAddonParams {
  findWindow(className: string | null, windowName: string | null): number;
  setForegroundWindow(hwnd: number): boolean;
  enumChildWindows(
    parentHwnd: number,
    callback: (hwnd: number) => boolean | void,
  ): boolean;
  sendMessage(
    hwnd: number,
    msg: number,
    wParam: number,
    lParam: number | string,
    timeoutMs?: number,
  ): number;
}

export const cmakeAddon = require(
  path.join(__dirname, "../build/Release/cmake-addon.node"),
) as CmakeAddonParams;

export const WindowsMessages = {
  WM_SETTEXT: 0x000c,
  WM_GETTEXT: 0x000d,
  WM_GETTEXTLENGTH: 0x000e,
  WM_COMMAND: 0x0111,
  BM_SETCHECK: 0x00f1,
  BM_GETCHECK: 0x00f0,
  BM_CLICK: 0x00f5,
  CB_SELECTSTRING: 0x014d,
  CB_SETCURSEL: 0x014e,
  CB_GETCURSEL: 0x0147,
  WM_LBUTTONDOWN: 0x0201,
  WM_LBUTTONUP: 0x0202,
} as const;

console.log(
  cmakeAddon,
  cmakeAddon.enumChildWindows(
    cmakeAddon.findWindow(null, "Clash Verge"),
    (hwnd) => {
      console.log("Child window:", hwnd);
      return true;
    },
  ),
);
