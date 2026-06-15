import { CellHeightContext, cn, styles } from "#shared/instances/styles";
import { Image, Path, Svg, Text, View } from "@react-pdf/renderer";
import React from "react";

export const Row = (props: React.PropsWithChildren) => {
  return <View style={[styles.flexRow]}>{props.children}</View>;
};

interface ColProps {
  children?: React.ReactNode;
  width?: number | string;
}

export const Col = (props: ColProps) => {
  const { width } = props;

  return (
    <View style={[width ? { width } : styles.flex1]}>{props.children}</View>
  );
};

const resolveCellHeight = (contextHeight: number, propsHeight?: number) => {
  if (typeof propsHeight === "number") {
    return propsHeight;
  }
  return contextHeight;
};

interface CellProps {
  children?: React.ReactNode;
  tr?: boolean;
  bl?: boolean;
  t?: boolean;
  r?: boolean;
  b?: boolean;
  l?: boolean;
  font12?: boolean;
  height?: number;
  text?: boolean;
  center?: boolean;
  pl?: boolean;
}

export const Cell = (props: CellProps) => {
  const {
    height: propsHeight,
    tr = true,
    bl,
    t,
    r,
    b,
    l,
    font12,
    text = true,
    center = true,
    pl,
  } = props;

  const cellHeight = React.use(CellHeightContext);
  const height = resolveCellHeight(cellHeight, propsHeight);

  return (
    <View
      style={cn(
        styles.justifyCenter,
        pl && styles.paddingL6,
        center ? styles.itemsCenter : styles.itemsStart,
        tr && styles.borderTR,
        bl && styles.borderBL,
        t && styles.borderT,
        r && styles.borderR,
        b && styles.borderB,
        l && styles.borderL,
        font12 ? styles.font12 : styles.font10,
        { height },
      )}
    >
      {text ? <Text>{props.children}</Text> : props.children}
    </View>
  );
};

export const CheckOK = () => {
  return (
    <Svg width="12" height="12" viewBox="0 0 24 24">
      <Path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
        fill="black"
      />
    </Svg>
  );
};

export const CheckNG = () => {
  return (
    <Svg viewBox="0 0 24 24" width={"10"} height={"10"}>
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke="black"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const PageHeader = (props: React.PropsWithChildren) => {
  return (
    <View>
      <Text style={[styles.font12, styles.textRight]}>{props.children}</Text>
    </View>
  );
};

interface PageFooterProps {
  center?: boolean;
  children?: React.ReactNode;
}

export const PageFooter = (props: PageFooterProps) => {
  return (
    <View
      style={cn(styles.paddingT8, {
        marginTop: "auto",
      })}
    >
      <Text
        style={[
          props.center ? styles.textCenter : styles.textRight,
          styles.font12,
        ]}
      >
        {props.children}
      </Text>
    </View>
  );
};

export const ReportTitle = (props: React.PropsWithChildren) => {
  return (
    <View style={[styles.paddingY8]}>
      <Text style={[styles.font16, styles.fontBold]}>{props.children}</Text>
    </View>
  );
};

const createCustomURL = (path: string) => {
  const url = new URL("ziyun://localhost/file");
  url.searchParams.set("file", path);

  return url.href;
};

interface ReportImageProps {
  src?: string;
  height: number;
}

export const ReportImage = (props: ReportImageProps) => {
  if (!props.src) {
    return <View style={[{ height: props.height }]}></View>;
  }

  return (
    <Image
      src={createCustomURL(props.src)}
      style={[{ height: props.height }]}
    />
  );
};
