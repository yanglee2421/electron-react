import module from "node:module";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = module.createRequire(import.meta.url);

interface NativeAddon {
  TOFD_PORT_OpenDevice(): boolean;
  TOFD_PORT_CloseDevice(): boolean;
  TOFD_PORT_IsOpen(): boolean;
  TOFD_PORT_SetFrequency(frequency: number): boolean;

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
}

const addon: NativeAddon = require(
  path.resolve(__dirname, "../build/Release/union_addon.node"),
);
export default addon;
