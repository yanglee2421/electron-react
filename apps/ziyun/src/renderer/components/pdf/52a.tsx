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
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";
import React from "react";

const IMAGE_HEIGHT = 128;

export interface ChannelRow {
  name: string;
  type: string;
  flaws: string[];
}

const renderDescription = (row: ChannelRow) => {
  if (row.type !== "裂纹") {
    return "";
  }

  return `${row.flaws.length}裂纹; ${row.flaws.join(" ")}`;
};

interface CHR52AProps {
  factory: string;
  validateAt: string | Date;
  zh: string;
  zx: string;
  imageLXH: string;
  imageRXH: string;
  imageLLZ: string;
  imageRLZ: string;
  imageLCT: string;
  imageRCT: string;

  szTmMake: string;
  szIdsMake: string;
  szTmFirst: string;
  szIdsFirst: string;
  szTmLast: string;
  szIdsLast: string;

  leftChannels: ChannelRow[];
  rightChannels: ChannelRow[];
  note: string;
}

export const CHR52A = (props: CHR52AProps) => {
  const { leftChannels, rightChannels } = props;

  const CELL_HEIGHT = React.use(CellHeightContext);
  const of4 = of(4);

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
                    单位名称: {props.factory}
                  </Text>
                </Col>
                <Col>
                  <Text style={[styles.font12, styles.textRight]}>
                    日期:
                    {props.validateAt
                      ? dayjs(props.validateAt).format("YYYY-MM-DD HH:mm:ss")
                      : ""}
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
                  <Cell>{props.zx}</Cell>
                </Col>
                <Col>
                  <Cell>轴号</Cell>
                </Col>
                <Col>
                  <Cell>{props.zh}</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造日期</Cell>
                </Col>
                <Col>
                  <Cell>{props.szTmMake}</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造单位</Cell>
                </Col>
                <Col>
                  <Cell>{props.szIdsMake}</Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell>轮对首次组装日期</Cell>
                  <Cell>轮对末次组装日期</Cell>
                </Col>
                <Col>
                  <Cell>{props.szTmFirst}</Cell>
                  <Cell>{props.szTmLast}</Cell>
                </Col>
                <Col>
                  <Cell>轮对首次组装单位</Cell>
                  <Cell>轮对末次组装单位</Cell>
                </Col>
                <Col>
                  <Cell>{props.szIdsFirst}</Cell>
                  <Cell>{props.szIdsLast}</Cell>
                </Col>
              </Row>
              <Cell>缺陷描述</Cell>
              <Row>
                <Col width={24}>
                  <Cell height={CELL_HEIGHT * 19}>
                    {"故障位置及性质".split("").join("\n")}
                  </Cell>
                </Col>
                <Col width={96}>
                  <Cell>探头编号</Cell>
                  {leftChannels.map((i, index) => {
                    return (
                      <Cell key={index} center={false} pl>
                        {i.name}
                      </Cell>
                    );
                  })}
                  {of4.map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                  {rightChannels.map((i, index) => {
                    return (
                      <Cell key={index} center={false} pl>
                        {i.name}
                      </Cell>
                    );
                  })}
                  {of4.map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>缺陷数量及位置</Cell>
                  {leftChannels.map((i, index) => {
                    return (
                      <Cell key={index} center={false} pl>
                        {renderDescription(i)}
                      </Cell>
                    );
                  })}
                  {of4.map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                  {rightChannels.map((i, index) => {
                    return (
                      <Cell key={index} center={false} pl>
                        {renderDescription(i)}
                      </Cell>
                    );
                  })}
                  {of4.map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                </Col>
                <Col width={64}>
                  <Cell>缺陷类型</Cell>
                  {leftChannels.map((i, index) => {
                    return (
                      <Cell key={index} center={false} pl>
                        {i.type}
                      </Cell>
                    );
                  })}
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                  {rightChannels.map((i, index) => {
                    return (
                      <Cell key={index} center={false} pl>
                        {i.type}
                      </Cell>
                    );
                  })}
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
                  <Cell height={100} center={false} pl pr>
                    {props.note}
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
                  <Text style={[styles.font12]}>单位名称: {props.factory}</Text>
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
                  <Cell>{props.zx}</Cell>
                </Col>
                <Col>
                  <Cell>轴号</Cell>
                </Col>
                <Col>
                  <Cell>{props.zh}</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造日期</Cell>
                </Col>
                <Col>
                  <Cell>{props.szTmMake}</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造单位</Cell>
                </Col>
                <Col>
                  <Cell>{props.szIdsMake}</Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell>轮对首次组装日期</Cell>
                  <Cell>轮对末次组装日期</Cell>
                </Col>
                <Col>
                  <Cell>{props.szTmFirst}</Cell>
                  <Cell>{props.szTmLast}</Cell>
                </Col>
                <Col>
                  <Cell>轮对首次组装单位</Cell>
                  <Cell>轮对末次组装单位</Cell>
                </Col>
                <Col>
                  <Cell>{props.szIdsFirst}</Cell>
                  <Cell>{props.szIdsLast}</Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell font12>左轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={props.imageLXH} height={IMAGE_HEIGHT} />
                  </View>
                  <Cell font12>左轮座扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={props.imageLLZ} height={IMAGE_HEIGHT} />
                  </View>
                </Col>
                <Col>
                  <Cell font12>右轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={props.imageRXH} height={IMAGE_HEIGHT} />
                  </View>
                  <Cell font12>右轮座扫描图</Cell>
                  <View style={[styles.flex1, styles.borderTR]}>
                    <ReportImage src={props.imageRLZ} height={IMAGE_HEIGHT} />
                  </View>
                </Col>
              </Row>
              <Cell font12>左穿透扫描图</Cell>
              <View style={[styles.borderTR]}>
                <ReportImage src={props.imageLCT} height={IMAGE_HEIGHT} />
              </View>
              <Cell font12>右穿透扫描图</Cell>
              <View style={[styles.borderTR]}>
                <ReportImage src={props.imageRCT} height={IMAGE_HEIGHT} />
              </View>
            </View>
          </View>
          <PageFooter>第二页</PageFooter>
        </Page>
      </Document>
    </PDFViewer>
  );
};
