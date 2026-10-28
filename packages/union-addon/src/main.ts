import module from "node:module";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = module.createRequire(import.meta.url);

interface NativeAddon {
  /**
   * TOFD API
   */
  TOFD_PORT_OpenDevice(): boolean;
  TOFD_PORT_CloseDevice(): boolean;
  TOFD_PORT_IsOpen(): boolean;
  TOFD_PORT_SetFrequency(frequency: number): boolean;

  /**
   * ITS API
   */
  ITS_init(): void;
  ITS_IsExist(): boolean;
  ITS_IsOpen(): boolean;
  ITS_SetCh(
    chLeftSource: number,
    chLeftReceiver: number,
    chRightSource: number,
    chRightReceiver: number,
  ): void;
  ITS_SetPlusWidth(plusLeft: number, plusRight: number): void;
  ITS_SetXmove(xmoveLeft: number, xmoveRight: number): void;
  ITS_SetdB(dbLeft: number, dbRight: number): void;
  ITS_SetDis(disLeft: number, disRight: number): void;
  ITS_Selfcheck(chLeft: number, chRight: number): void;
  ITS_SetZeroLeavel(zeroLevelLeft: number, zeroLevelRight: number): void;
  ITS_SetZip(zipLeft: number, zipRight: number): void;
  ITS_GetEncoder(channel: number, mode: number): number;
  ITS_Start(leftBuffer: Buffer, rightBuffer: Buffer): boolean;

  /**
   * Win32 API
   */
  /**
   * Finds a top-level window by class name and/or title. Omit or pass `null`
   * to ignore either criterion.
   * @returns The window handle as a `bigint`, or `0n` if no window is found.
   */
  FindWindowW(className?: string | null, windowName?: string | null): bigint;

  /**
   * Brings the specified window to the foreground.
   * @param hwnd Window handle as a `bigint`.
   * @returns Whether Windows brought the window to the foreground.
   */
  SetForegroundWindow(hwnd: bigint): boolean;

  /**
   * Enumerates the child windows of a parent window.
   * @param parentHwnd Parent window handle as a `bigint`.
   * @param callback Called for each child with its handle as a `bigint`.
   * Return `true` to continue enumeration or `false` to stop.
   * @returns The result returned by the Win32 enumeration call.
   */
  EnumChildWindows(
    parentHwnd: bigint,
    callback: (hwnd: bigint) => boolean,
  ): boolean;

  /**
   * Sends a message to a window and waits up to the timeout for it to respond.
   * String `lParam` values are passed as UTF-16 text; numeric values are passed
   * as raw `lParam` values.
   * @param hwnd Target window handle as a `bigint`.
   * @param msg Message identifier.
   * @param wParam Message-specific `wParam` value.
   * @param lParam Message-specific `lParam` value, either a string or a number.
   * @param timeout Timeout in milliseconds; defaults to 200.
   * @returns The message result as a JavaScript number.
   */
  SendMessageTimeout(
    hwnd: bigint,
    msg: number,
    wParam: number,
    lParam: string | number,
    timeout?: number,
  ): number;

  /**
   * Retrieves the specified value from the window's extra window memory.
   * @param hwnd Window handle as a `bigint`.
   * @param index Window information index, such as a `GWL_*` constant.
   * @returns The retrieved value as a `bigint`.
   */
  GetWindowLongPtrW(hwnd: bigint, index: number): bigint;

  /**
   * Retrieves the handle of a control in a dialog or other parent window.
   * @param parentHwnd Parent window handle as a `bigint`.
   * @param itemId Identifier of the control to retrieve.
   * @returns The control handle as a `bigint`, or `0n` if no matching control exists.
   */
  GetDlgItem(parentHwnd: bigint, itemId: number): bigint;

  /**
   * Checks whether a window is enabled for user input.
   * @param hwnd Window handle as a `bigint`.
   * @returns Whether the window is enabled.
   */
  IsWindowEnabled(hwnd: bigint): boolean;

  /**
   * Checks whether the specified window handle identifies an existing window.
   * @param hwnd Window handle as a `bigint`.
   * @returns Whether the handle identifies an existing window.
   */
  IsWindow(hwnd: bigint): boolean;

  /**
   * CustomAPI
   */
  SendMouseMove(hwnd: bigint, x: number, y: number): void;
}

const addon: NativeAddon = require(
  path.resolve(__dirname, "../build/Release/union_addon.node"),
);
export default addon;

export const WindowsMessages = Object.freeze({
  WM_SETTEXT: 0x000c,
  WM_GETTEXT: 0x000d,
  WM_GETTEXTLENGTH: 0x000e,
  WM_COMMAND: 0x0111,
  WM_LBUTTONDOWN: 0x0201,
  WM_LBUTTONUP: 0x0202,
  WM_CLOSE: 0x0010,
  WM_MOUSEMOVE: 0x0200,

  BM_SETCHECK: 0x00f1,
  BM_GETCHECK: 0x00f0,
  BM_CLICK: 0x00f5,

  CB_SELECTSTRING: 0x014d,
  CB_SETCURSEL: 0x014e,
  CB_GETCURSEL: 0x0147,
});
