import type { Detection, DetectionData } from "#main/features/mdb/types";
import { fetchCHR52AData } from "#renderer/api/printer";
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
import type { FlawGroup, MemoInfo } from "#shared/functions/chr52a";
import {
  calcFlawType,
  calcNote,
  resolveMemoInfo,
} from "#shared/functions/chr52a";
import { divideBy10, mathFormat } from "#shared/functions/math";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Alert, AlertTitle } from "@mui/material";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import React from "react";
import { useParams } from "react-router";

const MemoInfoContext = React.createContext<MemoInfo>(new Map());
const FlawGroupContext = React.createContext<FlawGroup>(new Map());
const IMAGE_HEIGHT = 128;

interface ChannelFlawsProps {
  board: number;
  channel: number;
}

const ChannelFlaws = (props: ChannelFlawsProps): string => {
  const { board, channel } = props;
  const memoInfo = React.use(MemoInfoContext);
  const flawGroup = React.use(FlawGroupContext);

  const typeNumber = memoInfo.get(`${board}-${channel}`);
  const flawType = calcFlawType(typeNumber);

  if (flawType !== "裂纹") {
    return "";
  }

  const flaws = flawGroup.get(`${board}-${channel}`) || [];
  const db = flaws?.at(0)?.nAtten || 0;

  return `${divideBy10(db)}dB;${flaws.map((flaw) => mathFormat(flaw.fltValueX, { precision: 0 })).join(" ")}`;
};

interface NoteCellProps {
  record: Detection;
  datas: DetectionData[];
}

const NoteCell = (props: NoteCellProps): string => {
  const { record, datas } = props;

  return calcNote(datas, record.szMemo);
};

export const Component = () => {
  const CELL_HEIGHT = React.use(CellHeightContext);

  const params = useParams();
  const recordId = params.id!;
  const query = useQuery(fetchCHR52AData(recordId));

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

    const { corporation, record, datas, jpegs } = query.data;
    const memoInfo = resolveMemoInfo(record.szMemo);
    const flawGroup = mapGroupBy(
      datas,
      (data) => `${data.nBoard}-${data.nChannel}`,
    );

    const renderFlawCount = (board: number, channel: number) => {
      return flawGroup.get(`${board}-${channel}`)?.length || "无";
    };

    return (
      <PDFViewer
        showToolbar
        style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
      >
        <Document
          title="CHR52A"
          creator="超声波自动探伤机"
          producer="武铁紫云接口面板"
        >
          <Page size="A4" style={[styles.page]}>
            <PageHeader>车统-52A1</PageHeader>
            <View>
              <ReportTitle>铁路货车轮轴超声自动探伤发现缺陷记录</ReportTitle>
              <View style={[styles.paddingB4]}>
                <Row>
                  <Col>
                    <Text style={[styles.font12, styles.textLeft]}>
                      单位名称: {corporation.Factory}
                    </Text>
                  </Col>
                  <Col>
                    <Text style={[styles.font12, styles.textRight]}>
                      日期: {dayjs(record.tmnow).format("YYYY-MM-DD HH:mm:ss")}
                    </Text>
                  </Col>
                </Row>
              </View>
              <View style={[styles.borderBL]}>
                <Row>
                  <Col>
                    <Cell>轴型</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szWHModel}</Cell>
                  </Col>
                  <Col>
                    <Cell>轴号</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szIDsWheel}</Cell>
                  </Col>
                  <Col>
                    <Cell>车轴制造日期</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szTMMake}</Cell>
                  </Col>
                  <Col>
                    <Cell>车轴制造单位</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szIDsMake}</Cell>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Cell>轮对首次组装日期</Cell>
                    <Cell>轮对末次组装日期</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szTMFirst}</Cell>
                    <Cell>{record.szTMLast}</Cell>
                  </Col>
                  <Col>
                    <Cell>轮对首次组装单位</Cell>
                    <Cell>轮对末次组装单位</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szIDsFirst}</Cell>
                    <Cell>{record.szIDsLast}</Cell>
                  </Col>
                </Row>
                <Cell>缺陷描述</Cell>
                <Row>
                  <Col width={24}>
                    <Cell height={CELL_HEIGHT * 19}>
                      {"故障位置及性质".split("").join("\n")}
                    </Cell>
                  </Col>
                  <Col>
                    <Cell>探头编号</Cell>
                    <Cell center={false} pl>
                      左穿透: {renderFlawCount(0, 0)}
                    </Cell>
                    <Cell center={false} pl>
                      左A01: {renderFlawCount(0, 1)}
                    </Cell>
                    <Cell center={false} pl>
                      左A02: {renderFlawCount(0, 2)}
                    </Cell>
                    <Cell center={false} pl>
                      左轮座01: {renderFlawCount(0, 3)}
                    </Cell>
                    <Cell center={false} pl>
                      左轮座02: {renderFlawCount(0, 4)}
                    </Cell>
                    {of(4).map((_) => {
                      return <Cell key={_}></Cell>;
                    })}
                    <Cell center={false} pl>
                      右穿透: {renderFlawCount(1, 0)}
                    </Cell>
                    <Cell center={false} pl>
                      右A01: {renderFlawCount(1, 1)}
                    </Cell>
                    <Cell center={false} pl>
                      右A02: {renderFlawCount(1, 2)}
                    </Cell>
                    <Cell center={false} pl>
                      右轮座01: {renderFlawCount(1, 3)}
                    </Cell>
                    <Cell center={false} pl>
                      右轮座02: {renderFlawCount(1, 4)}
                    </Cell>
                    {of(4).map((_) => {
                      return <Cell key={_}></Cell>;
                    })}
                  </Col>
                  <FlawGroupContext value={flawGroup}>
                    <MemoInfoContext value={memoInfo}>
                      <Col>
                        <Cell>缺陷数量及位置</Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={0} channel={0} />
                        </Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={0} channel={1} />
                        </Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={0} channel={2} />
                        </Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={0} channel={3} />
                        </Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={0} channel={4} />
                        </Cell>
                        {of(4).map((_) => {
                          return <Cell key={_}></Cell>;
                        })}
                        <Cell center={false} pl>
                          <ChannelFlaws board={1} channel={0} />
                        </Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={1} channel={1} />
                        </Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={1} channel={2} />
                        </Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={1} channel={3} />
                        </Cell>
                        <Cell center={false} pl>
                          <ChannelFlaws board={1} channel={4} />
                        </Cell>
                        {of(4).map((_) => {
                          return <Cell key={_}></Cell>;
                        })}
                      </Col>
                    </MemoInfoContext>
                  </FlawGroupContext>
                  <Col>
                    <Cell>缺陷类型</Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("0-0"))}
                    </Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("0-1"))}
                    </Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("0-2"))}
                    </Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("0-3"))}
                    </Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("0-4"))}
                    </Cell>
                    {of(4).map((_) => {
                      return <Cell key={_}></Cell>;
                    })}
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("1-0"))}
                    </Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("1-1"))}
                    </Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("1-2"))}
                    </Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("1-3"))}
                    </Cell>
                    <Cell center={false} pl>
                      {calcFlawType(memoInfo.get("1-4"))}
                    </Cell>
                    {of(4).map((_) => {
                      return <Cell key={_}></Cell>;
                    })}
                  </Col>
                </Row>
                <Row>
                  <Col width={56}>
                    <Cell height={100}>处理方法</Cell>
                    <Cell height={40}>探伤工</Cell>
                  </Col>
                  <Col>
                    <Cell height={100} center={false} pl>
                      <NoteCell record={record} datas={datas} />
                    </Cell>
                    <CellHeightContext value={40}>
                      <Row>
                        <Col>
                          <Cell></Cell>
                        </Col>
                        <Col>
                          <Cell>探伤工长</Cell>
                        </Col>
                        <Col>
                          <Cell></Cell>
                        </Col>
                        <Col>
                          <Cell>质检员</Cell>
                        </Col>
                        <Col>
                          <Cell></Cell>
                        </Col>
                        <Col>
                          <Cell>验收员</Cell>
                        </Col>
                        <Col>
                          <Cell></Cell>
                        </Col>
                      </Row>
                    </CellHeightContext>
                  </Col>
                </Row>
              </View>
            </View>
            <PageFooter>第一页</PageFooter>
          </Page>
          <Page size="A4" style={[styles.page]}>
            <PageHeader>车统-52A1</PageHeader>
            <View>
              <ReportTitle>
                铁路货车轮轴超声自动探伤发现缺陷记录（第二页）
              </ReportTitle>
              <View style={[styles.paddingB4]}>
                <Row>
                  <Col>
                    <Text style={[styles.font12]}>单位名称: 襄阳车辆段</Text>
                  </Col>
                  <Col>
                    <Text style={[styles.font12]}>
                      日期: {dayjs().format("YYYY-MM-DD HH:mm:ss")}
                    </Text>
                  </Col>
                </Row>
              </View>
              <View style={[styles.borderBL]}>
                <Row>
                  <Col>
                    <Cell>轴型</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szWHModel}</Cell>
                  </Col>
                  <Col>
                    <Cell>轴号</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szIDsWheel}</Cell>
                  </Col>
                  <Col>
                    <Cell>车轴制造日期</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szTMMake}</Cell>
                  </Col>
                  <Col>
                    <Cell>车轴制造单位</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szIDsMake}</Cell>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Cell>轮对首次组装日期</Cell>
                    <Cell>轮对末次组装日期</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szTMFirst}</Cell>
                    <Cell>{record.szTMLast}</Cell>
                  </Col>
                  <Col>
                    <Cell>轮对首次组装单位</Cell>
                    <Cell>轮对末次组装单位</Cell>
                  </Col>
                  <Col>
                    <Cell>{record.szIDsFirst}</Cell>
                    <Cell>{record.szIDsLast}</Cell>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Cell font12>左轴颈根部扫描图</Cell>
                    <View style={[styles.borderTR]}>
                      <ReportImage src={jpegs.lxh} height={IMAGE_HEIGHT} />
                    </View>
                    <Cell font12>左轮座部扫描图</Cell>
                    <View style={[styles.borderTR]}>
                      <ReportImage src={jpegs.llz} height={IMAGE_HEIGHT} />
                    </View>
                  </Col>
                  <Col>
                    <Cell font12>右轴颈根部扫描图</Cell>
                    <View style={[styles.borderTR]}>
                      <ReportImage src={jpegs.rxh} height={IMAGE_HEIGHT} />
                    </View>
                    <Cell font12>右轮座部扫描图</Cell>
                    <View style={[styles.flex1, styles.borderTR]}>
                      <ReportImage src={jpegs.rlz} height={IMAGE_HEIGHT} />
                    </View>
                  </Col>
                </Row>
                <Cell font12>左穿透扫描图</Cell>
                <View style={[styles.borderTR]}>
                  <ReportImage src={jpegs.lct} height={IMAGE_HEIGHT} />
                </View>
                <Cell font12>右穿透扫描图</Cell>
                <View style={[styles.borderTR]}>
                  <ReportImage src={jpegs.rct} height={IMAGE_HEIGHT} />
                </View>
              </View>
            </View>
            <PageFooter>第二页</PageFooter>
          </Page>
        </Document>
      </PDFViewer>
    );
  };

  return renderQuery();
};