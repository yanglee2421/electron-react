import type { Detecotor } from "#main/features/mdb/types";
import {
  Cell,
  CheckOK,
  Col,
  PageFooter,
  PageHeader,
  ReportImage,
  ReportTitle,
  Row,
} from "#renderer/components/pdf";
import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import { of } from "#shared/functions/array";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import { mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import * as mathjs from "mathjs";
import React from "react";

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

  channelName2?: React.ReactNode;
  zsj2?: string;
  jy2?: string;
  bc2?: string;
  ts2?: string;

  channelName3?: React.ReactNode;
  zsj3?: string;
  jy3?: string;
  bc3?: string;
  ts3?: string;

  channelName4?: React.ReactNode;
  zsj4?: string;
  jy4?: string;
  bc4?: string;
  ts4?: string;
}

const LZInfoTable = (props: LZInfoTableProps) => {
  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);
  const direction = props.board ? "右" : "左";

  return (
    <>
      <Cell>{direction + "轮座探头晶片编号及灵敏度"}</Cell>
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
          <Cell>{props.jy3 ? props.channelName3 : null}</Cell>
          <Cell>{props.jy3 ? props.zsj3 : null}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.jy3}</Cell>
          <Cell>{props.jy3 ? props.bc3 : null}</Cell>
          <Cell>{props.jy3 ? props.ts3 : null}</Cell>
        </Col>
        <Col>
          <Cell>{props.jy4 ? props.channelName4 : null}</Cell>
          <Cell>{props.jy4 ? props.zsj4 : null}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.jy4}</Cell>
          <Cell>{props.jy4 ? props.bc4 : null}</Cell>
          <Cell>{props.jy4 ? props.ts4 : null}</Cell>
        </Col>
        <Col>
          <Cell>{props.jy2 ? props.channelName2 : null}</Cell>
          <Cell>{props.jy2 ? props.zsj2 : null}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 1.5}>{props.jy2}</Cell>
          <Cell>{props.jy2 ? props.bc2 : null}</Cell>
          <Cell>{props.jy2 ? props.ts2 : null}</Cell>
        </Col>
      </Row>
    </>
  );
};

interface XHCTableProps {
  board: number;

  ctName?: React.ReactNode;
  ctZsj?: string;
  ctJy?: string;
  ctBc?: string;
  ctTs?: string;
  ctValue?: string;

  xhChannelName?: React.ReactNode;
  xhZsj?: string;
  xhJy?: string;
  xhBc?: string;
  xhTs?: string;
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
        <Cell>{props.xhJy ? props.xhChannelName : null}</Cell>
        <Cell></Cell>
        <Cell height={BASIC_ROW_HEIGHT * 1.5}>
          {props.ctJy ? props.ctName : null}
        </Cell>
      </Col>
      <Col width={XHC_ZSJ_COL_WIDTH}>
        <Cell height={BASIC_ROW_HEIGHT * 2.5}>拆射{"\n"}角度</Cell>
        <Cell>{props.xhJy ? props.xhZsj : null}</Cell>
        <Cell></Cell>
        <Cell height={BASIC_ROW_HEIGHT * 1.5}>
          {props.ctJy ? props.ctZsj : null}
        </Cell>
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
            <Cell>{props.xhJy ? props.xhBc : null}</Cell>
            <Cell></Cell>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>
              {props.ctJy ? props.ctBc : null}
            </Cell>
          </Col>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>探伤</Cell>
            <Cell>{props.xhJy ? props.xhTs : null}</Cell>
            <Cell></Cell>
            <Cell height={BASIC_ROW_HEIGHT * 1.5}>
              {props.ctJy ? props.ctTs : null}
            </Cell>
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

  const showUserInQtCHR501 = useProfileStore((s) => s.showUserInQtCHR501);

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
              <Cell font12>{showUserInQtCHR501 ? tsg : null}</Cell>
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
                  <Cell font12>左轮座扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage height={IMAGE_HEIGHT} src={props.imageLLZ} />
                  </View>
                </Col>
                <Col>
                  <Cell font12>右轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage height={IMAGE_HEIGHT} src={props.imageRXH} />
                  </View>
                  <Cell font12>右轮座扫描图</Cell>
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

export interface ChannelData {
  name: string;
  zsj: string;
  bc: string;
  jy: string;
  ts: string;
  flaws: string[];
}

interface CHR501Props {
  zh: string;
  zx: string;
  factoryName: string;
  validateAt: string | Date;
  equipmentNo: string;
  equipmentModel: string;
  user: string;
  imageLXH: string;
  imageRXH: string;
  imageLLZ: string;
  imageRLZ: string;
  imageLCT: string;
  imageRCT: string;

  boardDatas: Map<string, ChannelData>;
}

export const CHR501 = (props: CHR501Props) => {
  const {
    zh,
    zx,
    factoryName,
    validateAt,
    equipmentNo,
    equipmentModel,
    user,
    imageLCT,
    imageLLZ,
    imageLXH,
    imageRCT,
    imageRLZ,
    imageRXH,
    boardDatas,
  } = props;

  return (
    <PDFViewer
      showToolbar
      style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
    >
      <ReportDoc
        asideTip={
          zx.split("").join("\n") +
          "\n试\n样\n轴\n轮\n座\n人\n工\n缺\n陷\n编\n号"
        }
        tableHeader1={{
          labelL: "单位名称",
          valueL: factoryName,
          labelR: "校验时间",
          valueR: dayjs(validateAt).format("YYYY年MM月DD日 HH:mm:ss"),
        }}
        tableHeader2={{
          labelL: "单位名称",
          valueL: factoryName,
          labelR: "校验时间",
          valueR: dayjs(validateAt).format("YYYY年MM月DD日 HH:mm:ss"),
        }}
        equipmentTableProps={{
          deviceModel: equipmentModel || "",
          deviceNo: equipmentNo || "",
          blockModel: [zh, zx].join("-"),
        }}
        signatureTableProps={{
          tsg: user,
        }}
        imageLXH={imageLXH}
        imageRXH={imageRXH}
        imageLLZ={imageLLZ}
        imageRLZ={imageRLZ}
        imageLCT={imageLCT}
        imageRCT={imageRCT}
      >
        {of(2).map((_, board) => {
          const ch0 = boardDatas.get(`${board}-0`);
          const ch1 = boardDatas.get(`${board}-1`);
          const ch2 = boardDatas.get(`${board}-2`);
          const ch3 = boardDatas.get(`${board}-3`);
          const ch4 = boardDatas.get(`${board}-4`);

          return (
            <View key={board} style={[styles.flex1]}>
              <LZInfoTable
                board={board}
                channelName2={ch2?.name}
                jy2={ch2?.jy}
                bc2={ch2?.bc}
                ts2={ch2?.ts}
                zsj2={ch2?.zsj}

                channelName3={ch3?.name}
                jy3={ch3?.jy}
                bc3={ch3?.bc}
                ts3={ch3?.ts}
                zsj3={ch3?.zsj}

                channelName4={ch4?.name}
                jy4={ch4?.jy}
                bc4={ch4?.bc}
                ts4={ch4?.ts}
                zsj4={ch4?.zsj}
              />
              {of(13).map((_, index) => {
                return (
                  <Row key={index}>
                    <Col width={SECOND_WIDTH}>
                      <Cell>{_}</Cell>
                    </Col>
                    <Col>
                      <Cell>{ch3?.flaws?.at(index) ? <CheckOK /> : null}</Cell>
                    </Col>
                    <Col>
                      <Cell>{ch4?.flaws?.at(index) ? <CheckOK /> : null}</Cell>
                    </Col>
                    <Col>
                      <Cell>{ch2?.flaws?.at(index) ? <CheckOK /> : null}</Cell>
                    </Col>
                  </Row>
                );
              })}
              <XHCTable
                board={board}
                ctName={ch0?.name}
                ctZsj={ch0?.zsj}
                ctBc={ch0?.bc}
                ctJy={ch0?.jy}
                ctTs={ch0?.ts}
                ctValue={ch0?.flaws.at(0)}

                xhChannelName={ch1?.name}
                xhZsj={ch1?.zsj}
                xhBc={ch1?.bc}
                xhJy={ch1?.jy}
                xhTs={ch1?.ts}
                xhValue1={ch1?.flaws.at(0)}
                xhValue2={ch1?.flaws.at(1)}
                xhValue3={ch1?.flaws.at(2)}
              />
            </View>
          );
        })}
      </ReportDoc>
    </PDFViewer>
  );
};

const divide10 = (value: number, precision = 0) => {
  return mathjs.format(
    mathjs.divide(mathjs.bignumber(value), mathjs.bignumber(10)),
    { precision, notation: "fixed" },
  );
};

const calcTs = (bc: string, jy: string) => {
  if (!bc) {
    return "";
  }

  if (!jy) {
    return "";
  }

  return mathjs.format(mathjs.add(mathjs.bignumber(bc), mathjs.bignumber(jy)), {
    precision: 1,
    notation: "fixed",
  });
};

interface FlawLike {
  nBoard: number;
  nChannel: number;
  nAtten: number;
  fltValueX: number;
}

const findFlawsByFirst = (originalFlaws: number[], flaw1: number) => {
  const flaws1 = [flaw1];
  const excepted2 = flaw1 + 10;
  const flaw2 = originalFlaws
    .filter((i) => !flaws1.includes(i))
    .toSorted((a, b) => Math.abs(a - excepted2) - Math.abs(b - excepted2))
    .at(0);

  if (!flaw2) {
    return flaws1;
  }

  const flaws2 = [flaw1, flaw2];
  const excepted3 = flaw2 + 5;
  const flaw3 = originalFlaws
    .filter((i) => !flaws2.includes(i))
    .toSorted((a, b) => Math.abs(a - excepted3) - Math.abs(b - excepted3))
    .at(0);

  if (!flaw3) {
    return flaws2;
  }

  return [flaw1, flaw2, flaw3];
};

const calcXhcFlaws = (flaws: number[]) => {
  if (flaws.length < 4) {
    return flaws;
  }

  let result: number[] = [];

  for (const flaw of flaws) {
    const xhcFlaws = findFlawsByFirst(flaws, flaw);

    if (xhcFlaws.length === 3) {
      return xhcFlaws;
    }

    if (xhcFlaws.length > result.length) {
      result = xhcFlaws;
    }
  }

  return result;
};

const fixed = (value: number) => {
  return mathjs.format(value, { notation: "fixed", precision: 0 });
};

const calcFlaws = (datas: FlawLike[], channel: number): string[] => {
  const numberifyDatas = datas.map((i) => Number.parseInt(fixed(i.fltValueX)));
  const flaws = [...new Set(numberifyDatas)].toSorted((a, b) => a - b);

  switch (channel) {
    case 0:
      return flaws.map((i) => i.toString());
    case 1:
      return calcXhcFlaws(flaws).map((i) => i.toString());
    case 2:
      return flaws.map((i) => i.toString());
    case 3:
      return flaws.map((i) => i.toString());
    case 4:
      return [
        ...of(11 - flaws.length).map(() => ""),
        ...flaws.map((i) => i.toString()),
      ];
    default:
      return [];
  }
};

export const resolvedFlaws = (datas: FlawLike[], detectors: Detecotor[]) => {
  const flawGroup = mapGroupBy(datas, (d) => `${d.nBoard}-${d.nChannel}`);
  const detectorGroup = mapGroupBy(
    detectors,
    (d) => `${d.nBoard}-${d.nChannel}`,
  );
  const result = new Map<string, ChannelData>();

  for (let board = 0; board < 2; board++) {
    for (let channel = 0; channel < 5; channel++) {
      const flaws = flawGroup.get(`${board}-${channel}`) || [];
      const flaw = flaws?.at(0);
      const detector = detectorGroup.get(`${board}-${channel}`)?.at(0);
      const name = detector?.szName || "";
      const zsj =
        typeof detector?.nWAngle === "number"
          ? divide10(detector.nWAngle, 1)
          : "";
      const bc =
        typeof detector?.nDBSub === "number"
          ? divide10(detector.nDBSub, 1)
          : "";
      const jy =
        typeof flaw?.nAtten === "number" ? divide10(flaw.nAtten, 1) : "";
      const ts = calcTs(bc, jy);

      result.set(`${board}-${channel}`, {
        name,
        zsj,
        bc,
        jy,
        ts,
        flaws: calcFlaws(flaws, channel),
      });
    }
  }

  return result;
};
