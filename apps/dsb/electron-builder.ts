import type { Configuration } from "electron-builder";

export default {
  appId: "app.yanglee2421.app-dsb",
  productName: "测试应用",
  protocols: [{ name: "App Ziyun Protocol", schemes: ["app-ziyun-dev"] }],
  asar: true,
  asarUnpack: ["resources/**"],
  files: ["out", "drizzle", "resources", "!**/LICENSE"],
  compression: "maximum",
  directories: {
    output: "release/${version}",
  },
  npmRebuild: true,
  electronDownload: {
    mirror: "https://npmmirror.com/mirrors/electron/",
  },
  publish: {
    provider: "generic",
    url: "https://yanglee2421.vercel.app/auto-updates",
  },
  mac: {
    target: ["dmg"],
    artifactName: "${productName}-Mac-${version}-Installer.${ext}",
  },
  win: {
    target: [{ target: "nsis", arch: [] }],
    artifactName: "${productName}_${version}_${arch}-Setup.${ext}",
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: false,
    deleteAppDataOnUninstall: false,
    allowElevation: true,
  },
  linux: {
    target: ["deb"],
    artifactName: "${productName}-Linux-${version}.${ext}",
  },
} satisfies Configuration;
