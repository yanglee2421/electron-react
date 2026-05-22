import { fetchCHR501Data } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import {
  Cell,
  CheckOK,
  Col,
  PageFooter,
  PageHeader,
  ReportTitle,
  Row,
} from "#renderer/components/pdf";
import { of } from "#shared/functions/array";
import { resolveCHR501 } from "#shared/functions/chr501";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Alert, AlertTitle } from "@mui/material";
import {
  Document,
  Image,
  Page,
  PDFViewer,
  Text,
  View,
} from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
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
        <Col width={SECOND_WIDTH}>
          <Cell>通道编号</Cell>
          <Cell>折射角（度）</Cell>
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
          <Cell>{direction}外</Cell>
          <Cell>{props.zsj3}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 2}>{props.jy3}</Cell>
          <Cell>{props.bc3}</Cell>
          <Cell>{props.ts3}</Cell>
        </Col>
        <Col>
          <Cell>{direction}内</Cell>
          <Cell>{props.zsj4}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 2}>{props.jy4}</Cell>
          <Cell>{props.bc4}</Cell>
          <Cell>{props.ts4}</Cell>
        </Col>
        <Col>
          <Cell>{direction}A3</Cell>
          <Cell>{props.zsj2}</Cell>
          <Cell height={BASIC_ROW_HEIGHT * 2}>{props.jy2}</Cell>
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
        <Cell height={BASIC_ROW_HEIGHT * 3}>{direction}</Cell>
        <Cell height={BASIC_ROW_HEIGHT * 3}>{"轴\n颈"}</Cell>
      </Col>
      <Col width={XHC_CHANNEL_COL_WIDTH}>
        <Cell height={BASIC_ROW_HEIGHT * 3}>通道{"\n"}编号</Cell>
        <Cell>{direction}CT</Cell>
        <Cell>{props.xhChannelName}</Cell>
        <Cell></Cell>
      </Col>
      <Col width={XHC_ZSJ_COL_WIDTH}>
        <Cell height={BASIC_ROW_HEIGHT * 3}>拆射{"\n"}角度</Cell>
        <Cell>{props.ctZsj}</Cell>
        <Cell>{props.xhZsj}</Cell>
        <Cell></Cell>
      </Col>
      <Col>
        <Cell>灵敏度(dB)</Cell>
        <Row>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 2}>{"校验\n(80%)"}</Cell>
            <Cell>{props.ctJy}</Cell>
            <Cell>{props.xhJy}</Cell>
            <Cell></Cell>
          </Col>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 2}>补偿</Cell>
            <Cell>{props.ctBc}</Cell>
            <Cell>{props.xhBc}</Cell>
            <Cell></Cell>
          </Col>
          <Col>
            <Cell height={BASIC_ROW_HEIGHT * 2}>探伤</Cell>
            <Cell>{props.ctTs}</Cell>
            <Cell>{props.xhTs}</Cell>
            <Cell></Cell>
          </Col>
        </Row>
      </Col>
      <Col width={XHC_FLAW_NO_COL_WIDTH}>
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
        <Cell>{props.ctValue}</Cell>
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
        <Col width={SIGNATURE_COL_WIDTH}>
          <Cell font12>备注</Cell>
        </Col>
        <Col>
          <Cell font12></Cell>
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
            铁路货车轮轴多通道超声波自动探伤系统日常性能校验记录表
          </ReportTitle>
          <TableHeader {...tableHeader1} />
          <View style={[styles.borderBL]}>
            <EquipmentTable {...equipmentTableProps} />
            <Row>
              <Col width={ASIDE_COL_WIDTH}>
                <Cell height={ROW_HEIGHT * 26}>{asideTip}</Cell>
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
              铁路货车轮轴超声波自动探伤系统日常性能校验记录表（第2页）
            </ReportTitle>
            <TableHeader {...tableHeader2} />
            <View style={[styles.borderBL, styles.fontBold]}>
              <Row>
                <Col>
                  <Cell font12>左轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    {props.imageLXH ? (
                      <Image
                        src={`ziyun://localhost/${props.imageLXH}`}
                        style={[{ height: IMAGE_HEIGHT }]}
                      />
                    ) : (
                      <View style={[{ height: IMAGE_HEIGHT }]}></View>
                    )}
                  </View>
                  <Cell font12>左轮座部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    {props.imageLLZ ? (
                      <Image
                        src={`ziyun://localhost/${props.imageLLZ}`}
                        style={[{ height: IMAGE_HEIGHT }]}
                      />
                    ) : (
                      <View style={[{ height: IMAGE_HEIGHT }]}></View>
                    )}
                  </View>
                </Col>
                <Col>
                  <Cell font12>右轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    {props.imageRXH ? (
                      <Image
                        src={`ziyun://localhost/${props.imageRXH}`}
                        style={[{ height: IMAGE_HEIGHT }]}
                      />
                    ) : (
                      <View style={[{ height: IMAGE_HEIGHT }]}></View>
                    )}
                  </View>
                  <Cell font12>右轮座部扫描图</Cell>
                  <View style={[styles.flex1, styles.borderTR]}>
                    {props.imageRLZ ? (
                      <Image
                        src={`ziyun://localhost/${props.imageRLZ}`}
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
                    src={`ziyun://localhost/${props.imageLCT}`}
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
                    src={`ziyun://localhost/${props.imageRCT}`}
                    style={[{ height: IMAGE_HEIGHT }]}
                  />
                ) : (
                  <View style={[{ height: IMAGE_HEIGHT }]}></View>
                )}
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
  const query = useQuery(fetchCHR501Data(params.id!));

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

    const { detectors, datas, record, corporation, images } = query.data;
    const { detectorInfo, flawInfo } = resolveCHR501(datas, detectors);
    const of13 = of(13);
    const asideTip = record.szWHModel?.split("").join("\n");

    return (
      <PDFViewer
        showToolbar
        style={{ width: "100%", height: "100%", border: 0 }}
      >
        <ReportDoc
          asideTip={asideTip + "\n试\n样\n轴\n轮\n座\n人\n工\n缺\n陷\n编\n号"}
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
                      <Col width={SECOND_WIDTH}>
                        <Cell>{_}</Cell>
                      </Col>
                      <Col>
                        <Cell text={false}>
                          {!!flawInfo.get(`${board}-3`)?.at(flawNo)?.value && (
                            <CheckOK />
                          )}
                        </Cell>
                      </Col>
                      <Col>
                        <Cell text={false}>
                          {!!flawInfo.get(`${board}-4`)?.at(flawNo)?.value && (
                            <CheckOK />
                          )}
                        </Cell>
                      </Col>
                      <Col>
                        <Cell text={false}>
                          {!!flawInfo.get(`${board}-2`)?.at(flawNo)?.value && (
                            <CheckOK />
                          )}
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
