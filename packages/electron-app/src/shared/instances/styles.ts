import fontPath from "#renderer/assets/SimHei.ttf?url";
import type { Styles } from "@react-pdf/renderer";
import { Font, StyleSheet } from "@react-pdf/renderer";
import React from "react";

export const CellHeightContext = React.createContext(22);

type Style = Styles[keyof Styles];
type CnItem = Style | false | undefined | null;

export const cn = (...args: CnItem[]) => {
  return args.filter((i): i is Style => {
    if (typeof i !== "object") {
      return false;
    }

    if (i === null) {
      return false;
    }

    return true;
  });
};

// 注意：react-pdf 默认不支持中文字体，必须注册中文字体才能正常显示中文。
Font.register({
  family: "NotoSansSC",

  // 思源黑体
  // src: "https://cdn.jsdelivr.net/gh/StellarCN/scp_zh@master/fonts/SimHei.ttf",
  // 思源宋体
  // src: "https://cdn.jsdelivr.net/gh/StellarCN/scp_zh@master/fonts/SimSun.ttf",
  // 思源黑体-本地
  src: new URL(fontPath, import.meta.url).href,
});

export const styles = StyleSheet.create({
  page: {
    padding: "14mm",

    fontFamily: "NotoSansSC",
    fontSize: 10,
    textAlign: "center",
  },

  flexRow: {
    flexDirection: "row",
  },
  flexCol: {
    flexDirection: "column",
  },
  flex1: {
    flex: 1,
  },
  flexCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  justifyCenter: {
    justifyContent: "center",
  },
  itemsCenter: {
    alignItems: "center",
  },
  gap10: {
    gap: 10,
  },
  gap12: {
    gap: 12,
  },

  width20: {
    width: "20%",
  },
  width40: {
    width: "40%",
  },
  width80: {
    width: "80%",
  },

  padding2: {
    padding: 2,
  },
  padding4: {
    padding: 4,
  },
  padding6: {
    padding: 6,
  },
  padding8: {
    padding: 8,
  },
  paddingY2: {
    paddingVertical: 2,
  },
  paddingY4: {
    paddingVertical: 4,
  },
  paddingY6: {
    paddingVertical: 6,
  },
  paddingY8: {
    paddingVertical: 8,
  },
  paddingT2: {
    paddingTop: 2,
  },
  paddingT4: {
    paddingTop: 4,
  },
  paddingT6: {
    paddingTop: 6,
  },
  paddingT8: {
    paddingTop: 8,
  },
  paddingB2: {
    paddingBottom: 2,
  },
  paddingB4: {
    paddingBottom: 4,
  },
  paddingB6: {
    paddingBottom: 6,
  },
  paddingB8: {
    paddingBottom: 8,
  },

  border: {
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },
  borderT: {
    borderTopWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },
  borderR: {
    borderRightWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },
  borderB: {
    borderBottomWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },
  borderL: {
    borderLeftWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },
  borderTR: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },
  borderBL: {
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },

  font10: {
    fontSize: 10,
  },
  font12: {
    fontSize: 12,
  },
  font16: {
    fontSize: 16,
  },
  fontBold: {
    fontWeight: "bold",
  },

  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  textLeft: {
    textAlign: "left",
  },
});
