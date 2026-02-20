/**
 * Type definitions for native addon
 */
interface NativeAddon {
  add(a: number, b: number): number;
  showAlert(message: string, title: string): Promise<number>;
  isRunAsAdmin(): boolean;
  autoInputToVC(
    zx: string,
    zh: string,
    czzzdw: string,
    sczzdw: string,
    mczzdw: string,
    czzzrq: string,
    sczzrq: string,
    mczzrq: string,
    ztx: number,
    ytx: number,
  ): Promise<boolean>;
}

export default NativeAddon;
