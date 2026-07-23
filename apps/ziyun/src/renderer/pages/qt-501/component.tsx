import { fetchExternalDB501 } from "#renderer/api/external-db";
import { Loading } from "#renderer/components/Loading";
import {
  Cell,
  Col,
  PageFooter,
  PageHeader,
  ReportImage,
  ReportTitle,
  Row,
} from "#renderer/components/pdf";
import { of } from "#shared/functions/array";
import { divideBy10, mathFormat } from "#shared/functions/math";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Alert, AlertTitle } from "@mui/material";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import React from "react";
import { useParams } from "react-router";

const ASIDE_COL_WIDTH = 24;
const SECOND_WIDTH = 80;
const SIGNATURE_COL_WIDTH = 104;
const XHC_DIRECTION_COL_WIDTH = 20;
const XHC_CHANNEL_COL_WIDTH = 32;
const XHC_ZSJ_COL_WIDTH = 28;
const XHC_FLAW_NO_COL_WIDTH = 80;

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
    <CellHeightContext value={30}>
      <Row>
        <Col>
          <Cell font12>设备型号</Cell>
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
          <Cell font12>{"对比试样\n轮对型号"}</Cell>
        </Col>
        <Col>
          <Cell font12>{props.blockModel}</Cell>
        </Col>
      </Row>
    </CellHeightContext>
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
        <Col width={SECOND_WIDTH}>
          <Cell>通道编号</Cell>
          <Cell>折射角（度）</Cell>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3.5}>灵敏度{"\n"}（dB）</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 1.5}>校验{"\n"}（80%）</Cell>
              <Cell>补偿</Cell>
              <Cell>探伤</Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Cell>{direction}外</Cell>
          <Cell>{props.zsj3}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.jy3}</Cell>
          <Cell>{props.bc3}</Cell>
          <Cell>{props.ts3}</Cell>
        </Col>
        <Col>
          <Cell>{direction}内</Cell>
          <Cell>{props.zsj4}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.jy4}</Cell>
          <Cell>{props.bc4}</Cell>
          <Cell>{props.ts4}</Cell>
        </Col>
        <Col>
          <Cell>{direction}A3</Cell>
          <Cell>{props.zsj2}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.jy2}</Cell>
          <Cell>{props.bc2}</Cell>
          <Cell>{props.ts2}</Cell>
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
    <Row>
      <Col width={XHC_DIRECTION_COL_WIDTH}>
        <Cell height={BASIC_ROW_HEIGHT * 2.5}>{direction}</Cell>
        <Cell height={BASIC_ROW_HEIGHT * 2}>{"轴\n颈"}</Cell>
        <Cell height={BASIC_ROW_HEIGHT * 1.5}>{"穿\n透"}</Cell>
      </Col>
      <Col width={XHC_CHANNEL_COL_WIDTH}>
        <Cell height={BASIC_ROW_HEIGHT * 2.5}>通道{"\n"}编号</Cell>
        <Cell>{props.xhChannelName?.replace(/[左右0]/g, "")}</Cell>
        <Cell></Cell>
        <Cell height={BASIC_ROW_HEIGHT * 1.5}>CT</Cell>
      </Col>
      <Col width={XHC_ZSJ_COL_WIDTH}>
        <Cell height={BASIC_ROW_HEIGHT * 2.5}>拆射{"\n"}角度</Cell>
        <Cell>{props.xhZsj}</Cell>
        <Cell></Cell>
        <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.ctZsj}</Cell>
      </Col>
      <Col>
        <Cell>灵敏度(dB)</Cell>
        <Row>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>{"校验\n(80%)"}</Cell>
            <Cell>{props.xhJy}</Cell>
            <Cell></Cell>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.ctJy}</Cell>
          </Col>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>补偿</Cell>
            <Cell>{props.xhBc}</Cell>
            <Cell></Cell>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.ctBc}</Cell>
          </Col>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>探伤</Cell>
            <Cell>{props.xhTs}</Cell>
            <Cell></Cell>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.ctTs}</Cell>
          </Col>
        </Row>
      </Col>
      <Col width={XHC_FLAW_NO_COL_WIDTH}>
        <Cell>缺陷编号</Cell>
        <Row>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>1</Cell>
          </Col>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>2</Cell>
          </Col>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>3</Cell>
          </Col>
        </Row>
        <Row>
          <Col>
            <Cell>{props.xhValue1}</Cell>
            <Cell></Cell>
          </Col>
          <Col>
            <Cell>{props.xhValue2}</Cell>
            <Cell></Cell>
          </Col>
          <Col>
            <Cell>{props.xhValue3}</Cell>
            <Cell></Cell>
          </Col>
        </Row>
        <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.ctValue}</Cell>
      </Col>
    </Row>
  );
};

interface SignatureTableProps {
  tsg?: string;
}

const SignatureTable = (props: SignatureTableProps) => {
  const { tsg } = props;
  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);

  return (
    <>
      <Row>
        <Col width={SIGNATURE_COL_WIDTH}>
          <Cell height={BASIC_ROW_HEIGHT * 2} font12>
            签字签章
          </Cell>
          <Cell font12>备注</Cell>
        </Col>
        <Col>
          <Row>
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
            <Col>
              <Cell font12>维修工</Cell>
              <Cell font12></Cell>
            </Col>
            <Col>
              <Cell font12></Cell>
              <Cell font12></Cell>
            </Col>
          </Row>
          <Cell></Cell>
        </Col>
      </Row>
    </>
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
  asideTip: string;
}

const ReportDoc = (props: ReportDocProps) => {
  const {
    tableHeader1,
    tableHeader2,
    equipmentTableProps,
    signatureTableProps,
    asideTip,
  } = props;
  const IMAGE_HEIGHT = 150;

  const ROW_HEIGHT = React.use(CellHeightContext);

  return (
    <Document
      title="CHR501"
      creator="超声波自动探伤机"
      producer="武铁紫云接口面板"
    >
      <Page size="A4" style={[styles.page, styles.font10, styles.textCenter]}>
        <PageHeader>辆货统-501</PageHeader>
        <View>
          <ReportTitle>
            铁路货车轮轴B/C型显示超声波自动探伤系统日常性能校验记录
          </ReportTitle>
          <TableHeader {...tableHeader1} />
          <View style={[styles.borderBL]}>
            <EquipmentTable {...equipmentTableProps} />
            <Row>
              <Col width={ASIDE_COL_WIDTH}>
                <Cell height={ROW_HEIGHT * 25.5}>{asideTip}</Cell>
              </Col>
              {props.children}
            </Row>
            <CellHeightContext value={26}>
              <SignatureTable {...signatureTableProps} />
            </CellHeightContext>
          </View>
        </View>
        <PageFooter>第 1 页</PageFooter>
      </Page>

      <CellHeightContext value={18}>
        <Page size="A4" style={styles.page}>
          <PageHeader>辆货统-501</PageHeader>
          <View>
            <ReportTitle>
              铁路货车轮轴B/C型显示超声波自动探伤系统日常性能校验记录（第2页）
            </ReportTitle>
            <TableHeader {...tableHeader2} />
            <View style={[styles.borderBL, styles.fontBold]}>
              <Row>
                <Col>
                  <Cell font12>左轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage height={IMAGE_HEIGHT} src={props.imageLXH} />
                  </View>
                  <Cell font12>左轮座部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage height={IMAGE_HEIGHT} src={props.imageLLZ} />
                  </View>
                </Col>
                <Col>
                  <Cell font12>右轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage height={IMAGE_HEIGHT} src={props.imageRXH} />
                  </View>
                  <Cell font12>右轮座部扫描图</Cell>
                  <View style={[styles.flex1, styles.borderTR]}>
                    <ReportImage height={IMAGE_HEIGHT} src={props.imageRLZ} />
                  </View>
                </Col>
              </Row>
              <Cell font12>左穿透扫描图</Cell>
              <View style={[styles.borderTR]}>
                <ReportImage height={IMAGE_HEIGHT} src={props.imageLCT} />
              </View>
              <Cell font12>右穿透扫描图</Cell>
              <View style={[styles.borderTR]}>
                <ReportImage height={IMAGE_HEIGHT} src={props.imageRCT} />
              </View>
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
  const query = useQuery(fetchExternalDB501(params.id!));

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Alert severity="error">
          <AlertTitle>数据加载失败</AlertTitle>
          {query.error.message}
        </Alert>
      );
    }

    const { record, flaws, FACTORY_CLD, FACTORY_SBBH, FACTORY_SBXH, jpegs } =
      query.data;
    const of13 = of(13);
    const asideTip = record.szWhModel?.split("").join("\n");

    const metaMap = new Map<
      string,
      {
        zsj: string;
        bc: string;
        jy: string;
        ts: string;
      }
    >();

    for (const item of flaws) {
      const key = `${item.nBoard}-${item.nChannel}`;

      metaMap.set(key, {
        zsj: typeof item.nWangle === "number" ? divideBy10(item.nWangle) : "",
        bc: typeof item.nDbSub === "number" ? divideBy10(item.nDbSub) : "",
        jy: typeof item.nAtten === "number" ? divideBy10(item.nAtten) : "",
        ts:
          typeof item.nDbSub === "number" && typeof item.nAtten === "number"
            ? divideBy10(item.nDbSub + item.nAtten)
            : "",
      });
    }

    const flawMap = new Map<string, string[]>();
    const flawGroup = mapGroupBy(flaws, (r) => `${r.nBoard}-${r.nChannel}`);

    for (const [key, list] of flawGroup) {
      const item = list.at(0);

      if (!item) {
        continue;
      }

      const channel = item.nChannel;
      switch (channel) {
        case 0:
          flawMap.set(key, [
            ...new Set(
              list
                .toSorted((a, b) => {
                  const aValue = a.fltValueX || 0;
                  const bValue = b.fltValueX || 0;

                  return aValue - bValue;
                })
                .map((i) =>
                  mathFormat(i.fltValueX, { precision: 0, notation: "fixed" }),
                ),
            ),
          ]);
          break;
        case 1:
          flawMap.set(
            key,
            list
              .map((i) => i.fltValueX || 0)
              .toSorted((a, b) => a - b)
              .map((i) => mathFormat(i, { precision: 0, notation: "fixed" })),
          );
          break;
        case 2:
        case 3:
          flawMap.set(key, [
            ...new Set(
              list
                .toSorted((a, b) => {
                  const aValue = a.fltValueX || 0;
                  const bValue = b.fltValueX || 0;

                  return aValue - bValue;
                })
                .map((i) =>
                  mathFormat(i.fltValueX, { precision: 0, notation: "fixed" }),
                ),
            ),
          ]);
          break;
        case 4:
          flawMap.set(
            key,
            list
              .toSorted((a, b) => {
                const aValue = a.fltValueX || 0;
                const bValue = b.fltValueX || 0;

                return aValue - bValue;
              })
              .map((i) =>
                mathFormat(i.fltValueX, { precision: 0, notation: "fixed" }),
              ),
          );
          break;
        default:
          flawMap.set(key, []);
          break;
      }
    }

    return (
      <PDFViewer
        showToolbar
        style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
      >
        <ReportDoc
          asideTip={asideTip + "\n试\n样\n轴\n轮\n座\n人\n工\n缺\n陷\n编\n号"}
          tableHeader1={{
            labelL: "单位名称",
            valueL: FACTORY_CLD || "",
            labelR: "校验时间",
            valueR: dayjs(record.tmNow).format("YYYY年MM月DD日 HH:mm:ss"),
          }}
          tableHeader2={{
            labelL: "单位名称",
            valueL: FACTORY_CLD || "",
            labelR: "校验时间",
            valueR: dayjs(record.tmNow).format("YYYY年MM月DD日 HH:mm:ss"),
          }}
          equipmentTableProps={{
            deviceModel: FACTORY_SBXH || "",
            deviceNo: FACTORY_SBBH || "",
            blockModel: [record.szZh, record.szWhModel].join("-"),
          }}
          signatureTableProps={{
            tsg: record.szUsername || "",
          }}
          imageLXH={jpegs.lxh}
          imageRXH={jpegs.rxh}
          imageLLZ={jpegs.llz}
          imageRLZ={jpegs.rlz}
          imageLCT={jpegs.lct}
          imageRCT={jpegs.rct}
        >
          {of(2).map((_, board) => {
            return (
              <View key={board} style={[styles.flex1]}>
                <LZInfoTable
                  board={board}
                  jy2={metaMap.get(`${board}-2`)?.jy}
                  bc2={metaMap.get(`${board}-2`)?.bc}
                  ts2={metaMap.get(`${board}-2`)?.ts}
                  zsj2={metaMap.get(`${board}-2`)?.zsj}
                  jy3={metaMap.get(`${board}-3`)?.jy}
                  bc3={metaMap.get(`${board}-3`)?.bc}
                  ts3={metaMap.get(`${board}-3`)?.ts}
                  zsj3={metaMap.get(`${board}-3`)?.zsj}
                  jy4={metaMap.get(`${board}-4`)?.jy}
                  bc4={metaMap.get(`${board}-4`)?.bc}
                  ts4={metaMap.get(`${board}-4`)?.ts}
                  zsj4={metaMap.get(`${board}-4`)?.zsj}
                />
                {of13.map((_, flawNo) => {
                  return (
                    <Row key={flawNo}>
                      <Col width={SECOND_WIDTH}>
                        <Cell>{_}</Cell>
                      </Col>
                      <Col>
                        <Cell text={true}>
                          {flawMap.get(`${board}-3`)?.at(_)}
                        </Cell>
                      </Col>
                      <Col>
                        <Cell text={true}>
                          {flawMap.get(`${board}-4`)?.at(_)}
                        </Cell>
                      </Col>
                      <Col>
                        <Cell text={true}>
                          {flawMap.get(`${board}-2`)?.at(_)}
                        </Cell>
                      </Col>
                    </Row>
                  );
                })}
                <XHCTable
                  board={board}
                  ctBc={metaMap.get(`${board}-0`)?.bc}
                  ctJy={metaMap.get(`${board}-0`)?.jy}
                  ctTs={metaMap.get(`${board}-0`)?.ts}
                  ctZsj={metaMap.get(`${board}-0`)?.zsj}
                  ctValue={""}
                  xhBc={metaMap.get(`${board}-1`)?.bc}
                  xhJy={metaMap.get(`${board}-1`)?.jy}
                  xhTs={metaMap.get(`${board}-1`)?.ts}
                  xhZsj={metaMap.get(`${board}-1`)?.zsj}
                  xhChannelName={record.szWhModel === "RD2" ? "A1" : "A2"}
                  xhValue1={""}
                  xhValue2={""}
                  xhValue3={""}
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

const calcTextList = (list: number[]) => {
  return [
    ...new Set(
      list.map((i) => mathFormat(i, { precision: 0, notation: "fixed" })),
    ),
  ];
};
const findFlawsByFirst = (list: number[], value1: number) => {
  let result = [value1];
  const excepted2 = value1 + 10;
  const value2 = list
    .filter((i) => !result.includes(i))
    .toSorted((a, b) => Math.abs(a - excepted2) - Math.abs(b - excepted2))
    .at(0);

  if (!value2) {
    return result;
  }

  result = [value1, value2];
  const excepted3 = value2 + 5;
  const value3 = list
    .filter((i) => !result.includes(i))
    .toSorted((a, b) => Math.abs(a - excepted3) - Math.abs(b - excepted3))
    .at(0);

  if (!value3) {
    return result;
  }

  result = [value1, value2, value3];

  return result;
};
const calcXHCFlaws = (list: number[]) => {
  const uniquedList = [...new Set(list)];
  const filtered = uniquedList.toSorted((a, b) => a - b);

  if (filtered.length < 4) {
    return filtered;
  }

  let result: number[] = [];

  for (const item of filtered) {
    const flaws = findFlawsByFirst(list, item);

    if (flaws.length === 3) {
      return flaws;
    }

    if (flaws.length > result.length) {
      result = flaws;
    }
  }

  return result;
};
