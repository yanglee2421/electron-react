import { fetchCHR501Data } from "#renderer/api/printer";
import { resolveCHR501 } from "#shared/functions/chr501";
import type { Styles } from "@react-pdf/renderer";
import {
  Document,
  Font,
  Image,
  Page,
  PDFViewer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { useParams } from "react-router";

// 注意：react-pdf 默认不支持中文字体，必须注册中文字体才能正常显示中文。
// 这里使用一个可用的思源黑体 TTF 字体链接作为示例。在生产环境中建议将字体文件放到 public 目录并使用本地路径。
Font.register({
  family: "NotoSansSC",
  src: "https://cdn.jsdelivr.net/gh/StellarCN/scp_zh@master/fonts/SimHei.ttf",
});

const styles = StyleSheet.create({
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

const CellHeightContext = React.createContext(22);

const of = (count: number) => {
  return Array.from({ length: count }, (_, index) => index + 1);
};

type Style = Styles[keyof Styles];
type CnItem = Style | false | undefined | null;

const cn = (...args: CnItem[]) => {
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

const Row = (props: React.PropsWithChildren) => {
  return <View style={[styles.flexRow]}>{props.children}</View>;
};

interface ColProps {
  children?: React.ReactNode;
  width?: number | string;
}

const Col = (props: ColProps) => {
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
}

const Cell = (props: CellProps) => {
  const { height: propsHeight, tr = true, bl, t, r, b, l, font12 } = props;

  const cellHeight = React.use(CellHeightContext);
  const height = resolveCellHeight(cellHeight, propsHeight);

  return (
    <View
      style={cn(
        styles.itemsCenter,
        styles.justifyCenter,
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
      <Text>{props.children}</Text>
    </View>
  );
};

const PageHeader = (props: React.PropsWithChildren) => {
  return (
    <View>
      <Text style={[styles.font12, styles.textRight]}>{props.children}</Text>
    </View>
  );
};

const PageFooter = (props: React.PropsWithChildren) => {
  return (
    <View style={[styles.paddingT8]}>
      <Text style={[styles.textRight, styles.font12]}>{props.children}</Text>
    </View>
  );
};

const ReportTitle = (props: React.PropsWithChildren) => {
  return (
    <View style={[styles.paddingY8]}>
      <Text style={[styles.font16, styles.fontBold]}>{props.children}</Text>
    </View>
  );
};

interface TableHeaderProps {
  labelL: string;
  valueL: string;
  labelR: string;
  valueR: string;
}

const TableHeader = ({ labelL, valueL, labelR, valueR }: TableHeaderProps) => (
  <View style={[styles.paddingB2, styles.font12]}>
    <Row>
      <Col width={"33.33%"}>
        <Text style={[styles.fontBold]}>{labelL}</Text>
      </Col>
      <Col width={"66.67%"}>
        <Text>{valueL}</Text>
      </Col>
      <Col width={"33.33%"}>
        <Text style={[styles.fontBold]}>{labelR}</Text>
      </Col>
      <Col width={"66.67%"}>
        <Text>{valueR}</Text>
      </Col>
    </Row>
  </View>
);

interface EquipmentTableProps {
  deviceModel?: string;
  deviceNo?: string;
  blockModel?: string;
}

const EquipmentTable = (props: EquipmentTableProps) => {
  return (
    <Row>
      <Col>
        <Cell l font12>
          设备型号
        </Cell>
      </Col>
      <Col>
        <Cell font12>{props.deviceModel}</Cell>
      </Col>
      <Col>
        <Cell font12>设备编号</Cell>
      </Col>
      <Col>
        <Cell font12>{props.deviceNo}</Cell>
      </Col>
      <Col>
        <Cell font12>实物试块型号</Cell>
      </Col>
      <Col>
        <Cell font12>{props.blockModel}</Cell>
      </Col>
    </Row>
  );
};

interface LZInfoTableProps {
  board: number;
  jy3?: string;
  jy4?: string;
  jy2?: string;
  bc3?: string;
  bc4?: string;
  bc2?: string;
  ts3?: string;
  ts4?: string;
  ts2?: string;
  zsj3?: string;
  zsj4?: string;
  zsj2?: string;
}

const LZInfoTable = (props: LZInfoTableProps) => {
  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);
  const direction = props.board ? "右" : "左";

  return (
    <>
      <Cell>{direction}轮座探头晶片编号及灵敏度</Cell>
      <Row>
        <Col width={"40%"}>
          <Cell>通道编号</Cell>
        </Col>
        <Col>
          <Cell>{direction}外</Cell>
        </Col>
        <Col>
          <Cell>{direction}内</Cell>
        </Col>
        <Col>
          <Cell>{direction}A3</Cell>
        </Col>
      </Row>
      <Row>
        <Col width={"40%"}>
          <Cell>折射角（度）</Cell>
        </Col>
        <Col>
          <Cell>{props.zsj3}</Cell>
        </Col>
        <Col>
          <Cell>{props.zsj4}</Cell>
        </Col>
        <Col>
          <Cell>{props.zsj2}</Cell>
        </Col>
      </Row>
      <Row>
        <Col width={"40%"}>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 4}>灵敏度{"\n"}（dB）</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>校验{"\n"}（80%）</Cell>
              <Cell>补偿</Cell>
              <Cell>探伤</Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>{props.jy3}</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>{props.jy4}</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>{props.jy2}</Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell>{props.bc3}</Cell>
            </Col>
            <Col>
              <Cell>{props.bc4}</Cell>
            </Col>
            <Col>
              <Cell>{props.bc2}</Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell>{props.ts3}</Cell>
            </Col>
            <Col>
              <Cell>{props.ts4}</Cell>
            </Col>
            <Col>
              <Cell>{props.ts2}</Cell>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

interface XHCTableProps {
  board: number;
  ctJy?: string;
  ctBc?: string;
  ctTs?: string;
  ctZsj?: string;
  ctValue?: string;
  xhJy?: string;
  xhBc?: string;
  xhTs?: string;
  xhZsj?: string;
  xhChannelName?: string;
  xhValue1?: string;
  xhValue2?: string;
  xhValue3?: string;
}

const XHCTable = (props: XHCTableProps) => {
  const { board } = props;

  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);

  const direction = board ? "右" : "左";

  return (
    <>
      <Row>
        <Col>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3}>{direction}</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3}>通道{"\n"}编号</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3}>拆射{"\n"}角度</Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Cell>灵敏度(dB)</Cell>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>{"校验\n(80%)"}</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>补偿</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>探伤</Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Cell>缺陷编号</Cell>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>1</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>2</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>3</Cell>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row>
        <Col>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3}>{"轴\n颈"}</Cell>
            </Col>
            <Col>
              <Cell>{direction}CT</Cell>
              <Cell>{props.xhChannelName}</Cell>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell>{props.ctZsj}</Cell>
              <Cell>{props.xhZsj}</Cell>
              <Cell></Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col>
              <Cell>{props.ctJy}</Cell>
            </Col>
            <Col>
              <Cell>{props.ctBc}</Cell>
            </Col>
            <Col>
              <Cell>{props.ctTs}</Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell>{props.xhJy}</Cell>
            </Col>
            <Col>
              <Cell>{props.xhBc}</Cell>
            </Col>
            <Col>
              <Cell>{props.xhTs}</Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col>
              <Cell>{props.ctValue}</Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell>{props.xhValue1}</Cell>
            </Col>
            <Col>
              <Cell>{props.xhValue2}</Cell>
            </Col>
            <Col>
              <Cell>{props.xhValue3}</Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

interface SignatureTableProps {
  tsg?: string;
}

const SignatureTable = (props: SignatureTableProps) => {
  const { tsg } = props;
  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);

  return (
    <View style={[styles.borderBL]}>
      <Row>
        <Col>
          <Cell height={BASIC_ROW_HEIGHT * 2} font12>
            签字签章
          </Cell>
        </Col>
        <Col>
          <Cell font12>探伤工</Cell>
          <Cell font12>质检员</Cell>
        </Col>
        <Col>
          <Cell font12>{tsg}</Cell>
          <Cell font12></Cell>
        </Col>
        <Col>
          <Cell font12>探伤工长</Cell>
          <Cell font12>验收员</Cell>
        </Col>
        <Col>
          <Cell font12></Cell>
          <Cell font12></Cell>
        </Col>
      </Row>
      <Row>
        <Col width={"20%"}>
          <Cell font12>备注</Cell>
        </Col>
        <Col>
          <Cell font12></Cell>
        </Col>
      </Row>
    </View>
  );
};

interface ReportDocProps {
  tableHeader1: TableHeaderProps;
  tableHeader2: TableHeaderProps;
  equipmentTableProps: EquipmentTableProps;
  signatureTableProps?: SignatureTableProps;
  children?: React.ReactNode;
  imageLCT?: string;
  imageRCT?: string;
  imageLXH?: string;
  imageRXH?: string;
  imageLLZ?: string;
  imageRLZ?: string;
}

const ReportDoc = (props: ReportDocProps) => {
  const {
    tableHeader1,
    tableHeader2,
    equipmentTableProps,
    signatureTableProps,
  } = props;
  const IMAGE_HEIGHT = 150;

  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.font10, styles.textCenter]}>
        <PageHeader>辆货统-501</PageHeader>
        <ReportTitle>
          铁路货车轮轴多通道超声波自动探伤系统日常性能校验记录表
        </ReportTitle>
        <TableHeader {...tableHeader1} />
        <EquipmentTable {...equipmentTableProps} />
        <View style={[styles.flexRow, styles.borderL]}>
          <View
            style={[
              styles.borderTR,
              styles.itemsCenter,
              styles.justifyCenter,
              styles.padding6,
            ]}
          >
            <Text>{"R\nD\n2\n试\n样\n轴\n轮\n座\n人\n工\n缺\n陷\n编\n号"}</Text>
          </View>
          {props.children}
        </View>
        <CellHeightContext value={26}>
          <SignatureTable {...signatureTableProps} />
        </CellHeightContext>
        <PageFooter>第 1 页</PageFooter>
      </Page>

      <CellHeightContext value={18}>
        <Page size="A4" style={styles.page}>
          <PageHeader>辆货统-501</PageHeader>
          <ReportTitle>
            铁路货车轮轴超声波自动探伤系统日常性能校验记录表（第2页）
          </ReportTitle>
          <TableHeader {...tableHeader2} />
          <View style={[styles.borderBL, styles.fontBold]}>
            <Row>
              <Col>
                <Cell font12>左轴颈根部扫描图</Cell>
              </Col>
              <Col>
                <Cell font12>右轴颈根部扫描图</Cell>
              </Col>
            </Row>
            <Row>
              <Col>
                <View style={[styles.borderTR]}>
                  {props.imageLXH ? (
                    <Image
                      src={props.imageLXH}
                      style={[{ height: IMAGE_HEIGHT }]}
                    />
                  ) : (
                    <View style={[{ height: IMAGE_HEIGHT }]}></View>
                  )}
                </View>
              </Col>
              <Col>
                <View style={[styles.borderTR]}>
                  {props.imageRXH ? (
                    <Image
                      src={props.imageRXH}
                      style={[{ height: IMAGE_HEIGHT }]}
                    />
                  ) : (
                    <View style={[{ height: IMAGE_HEIGHT }]}></View>
                  )}
                </View>
              </Col>
            </Row>
            <Row>
              <Col>
                <Cell font12>左轮座部扫描图</Cell>
              </Col>
              <Col>
                <Cell font12>右轮座部扫描图</Cell>
              </Col>
            </Row>
            <Row>
              <Col>
                <View style={[styles.borderTR]}>
                  {props.imageLLZ ? (
                    <Image
                      src={props.imageLLZ}
                      style={[{ height: IMAGE_HEIGHT }]}
                    />
                  ) : (
                    <View style={[{ height: IMAGE_HEIGHT }]}></View>
                  )}
                </View>
              </Col>
              <Col>
                <View style={[styles.flex1, styles.borderTR]}>
                  {props.imageRLZ ? (
                    <Image
                      src={props.imageRLZ}
                      style={[{ height: IMAGE_HEIGHT }]}
                    />
                  ) : (
                    <View style={[{ height: IMAGE_HEIGHT }]}></View>
                  )}
                </View>
              </Col>
            </Row>
            <Cell font12>左穿透扫描图</Cell>
            <View style={[styles.borderTR]}>
              {props.imageLCT ? (
                <Image
                  src={props.imageLCT}
                  style={[{ height: IMAGE_HEIGHT }]}
                />
              ) : (
                <View style={[{ height: IMAGE_HEIGHT }]}></View>
              )}
            </View>
            <Cell font12>右穿透扫描图</Cell>
            <View style={[styles.borderTR]}>
              {props.imageRCT ? (
                <Image
                  src={props.imageRCT}
                  style={[{ height: IMAGE_HEIGHT }]}
                />
              ) : (
                <View style={[{ height: IMAGE_HEIGHT }]}></View>
              )}
            </View>
          </View>
          <PageFooter>第 2 页</PageFooter>
        </Page>
      </CellHeightContext>
    </Document>
  );
};

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchCHR501Data(params.id!));

  const renderQuery = () => {
    if (query.isPending) {
      return <div>加载中...</div>;
    }

    if (query.isError) {
      return <div>加载失败: {(query.error as Error).message}</div>;
    }

    const { detectors, datas, record, corporation, images } = query.data;
    const { detectorInfo, flawInfo } = resolveCHR501(datas, detectors);
    const of13 = of(13);

    return (
      <PDFViewer
        showToolbar={true}
        style={{ width: "100%", height: "100vh", border: 0 }}
      >
        <ReportDoc
          tableHeader1={{
            labelL: "单位名称",
            valueL: corporation.Factory || "",
            labelR: "校验时间",
            valueR: dayjs(record.tmNow).format("YYYY年MM月DD日 HH:mm:ss"),
          }}
          tableHeader2={{
            labelL: "单位名称",
            valueL: corporation.Factory || "",
            labelR: "校验时间",
            valueR: dayjs(record.tmNow).format("YYYY年MM月DD日 HH:mm:ss"),
          }}
          equipmentTableProps={{
            deviceModel: corporation.DeviceType || "",
            deviceNo: corporation.DeviceNO || "",
            blockModel: [record.szIDsWheel, record.szWHModel].join("_"),
          }}
          signatureTableProps={{
            tsg: record.szUsername || "",
          }}
          imageLXH={images.lxh}
          imageRXH={images.rxh}
          imageLLZ={images.llz}
          imageRLZ={images.rlz}
          imageLCT={images.lct}
          imageRCT={images.rct}
        >
          {of(2).map((_, board) => {
            return (
              <View key={board} style={[styles.flex1]}>
                <LZInfoTable
                  board={board}
                  jy2={detectorInfo.get(`${board}-2`)?.jy}
                  bc2={detectorInfo.get(`${board}-2`)?.bc}
                  ts2={detectorInfo.get(`${board}-2`)?.ts}
                  zsj2={detectorInfo.get(`${board}-2`)?.zsj}
                  jy3={detectorInfo.get(`${board}-3`)?.jy}
                  bc3={detectorInfo.get(`${board}-3`)?.bc}
                  ts3={detectorInfo.get(`${board}-3`)?.ts}
                  zsj3={detectorInfo.get(`${board}-3`)?.zsj}
                  jy4={detectorInfo.get(`${board}-4`)?.jy}
                  bc4={detectorInfo.get(`${board}-4`)?.bc}
                  ts4={detectorInfo.get(`${board}-4`)?.ts}
                  zsj4={detectorInfo.get(`${board}-4`)?.zsj}
                />
                {of13.map((_, flawNo) => {
                  return (
                    <Row key={flawNo}>
                      <Col width={"40%"}>
                        <Cell>{flawNo}</Cell>
                      </Col>
                      <Col>
                        <Cell>
                          {flawInfo.get(`${board}-3`)?.at(flawNo)?.value}
                        </Cell>
                      </Col>
                      <Col>
                        <Cell>
                          {flawInfo.get(`${board}-4`)?.at(flawNo)?.value}
                        </Cell>
                      </Col>
                      <Col>
                        <Cell>
                          {flawInfo.get(`${board}-2`)?.at(flawNo)?.value}
                        </Cell>
                      </Col>
                    </Row>
                  );
                })}
                <XHCTable
                  board={board}
                  ctBc={detectorInfo.get(`${board}-0`)?.bc}
                  ctJy={detectorInfo.get(`${board}-0`)?.jy}
                  ctTs={detectorInfo.get(`${board}-0`)?.ts}
                  ctZsj={detectorInfo.get(`${board}-0`)?.zsj}
                  ctValue={flawInfo.get(`${board}-0`)?.at(0)?.value}
                  xhBc={detectorInfo.get(`${board}-1`)?.bc}
                  xhJy={detectorInfo.get(`${board}-1`)?.jy}
                  xhTs={detectorInfo.get(`${board}-1`)?.ts}
                  xhZsj={detectorInfo.get(`${board}-1`)?.zsj}
                  xhChannelName={detectorInfo.get(`${board}-1`)?.place}
                  xhValue1={flawInfo.get(`${board}-1`)?.at(0)?.value}
                  xhValue2={flawInfo.get(`${board}-1`)?.at(1)?.value}
                  xhValue3={flawInfo.get(`${board}-1`)?.at(2)?.value}
                />
              </View>
            );
          })}
        </ReportDoc>
      </PDFViewer>
    );
  };

  return renderQuery();
};
