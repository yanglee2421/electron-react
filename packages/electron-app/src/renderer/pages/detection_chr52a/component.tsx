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

export const Component = () => {
  const CELL_HEIGHT = React.use(CellHeightContext);

  return (
    <PDFViewer showToolbar style={{ width: "100%", height: "100%", border: 0 }}>
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
                  <Cell>RE2B</Cell>
                </Col>
                <Col>
                  <Cell>轴号</Cell>
                </Col>
                <Col>
                  <Cell>12345678</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造日期</Cell>
                </Col>
                <Col>
                  <Cell>12345678</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造单位</Cell>
                </Col>
                <Col>
                  <Cell>123</Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell>轮对首次组装日期</Cell>
                  <Cell>轮对末次组装日期</Cell>
                </Col>
                <Col>
                  <Cell></Cell>
                  <Cell></Cell>
                </Col>
                <Col>
                  <Cell>轮对首次组装单位</Cell>
                  <Cell>轮对末次组装单位</Cell>
                </Col>
                <Col>
                  <Cell></Cell>
                  <Cell></Cell>
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
                    左穿透: 1
                  </Cell>
                  <Cell center={false} pl>
                    左A01: 4
                  </Cell>
                  <Cell center={false} pl>
                    左A02: 无
                  </Cell>
                  <Cell center={false} pl>
                    左轮座01: 16
                  </Cell>
                  <Cell center={false} pl>
                    左轮座02: 10
                  </Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                  <Cell center={false} pl>
                    右穿透: 1
                  </Cell>
                  <Cell center={false} pl>
                    右A01: 4
                  </Cell>
                  <Cell center={false} pl>
                    右A02: 无
                  </Cell>
                  <Cell center={false} pl>
                    右轮座01: 16
                  </Cell>
                  <Cell center={false} pl>
                    右轮座02: 10
                  </Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>缺陷数量及位置</Cell>
                  <Cell center={false} pl>
                    左穿透: 1
                  </Cell>
                  <Cell center={false} pl>
                    左A01: 4
                  </Cell>
                  <Cell center={false} pl>
                    左A02: 无
                  </Cell>
                  <Cell center={false} pl>
                    左轮座01: 16
                  </Cell>
                  <Cell center={false} pl>
                    左轮座02: 10
                  </Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                  <Cell center={false} pl>
                    右穿透: 1
                  </Cell>
                  <Cell center={false} pl>
                    右A01: 4
                  </Cell>
                  <Cell center={false} pl>
                    右A02: 无
                  </Cell>
                  <Cell center={false} pl>
                    右轮座01: 16
                  </Cell>
                  <Cell center={false} pl>
                    右轮座02: 10
                  </Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>缺陷类型</Cell>
                  <Cell center={false} pl>
                    左穿透: 1
                  </Cell>
                  <Cell center={false} pl>
                    左A01: 4
                  </Cell>
                  <Cell center={false} pl>
                    左A02: 无
                  </Cell>
                  <Cell center={false} pl>
                    左轮座01: 16
                  </Cell>
                  <Cell center={false} pl>
                    左轮座02: 10
                  </Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                  <Cell center={false} pl>
                    右穿透: 1
                  </Cell>
                  <Cell center={false} pl>
                    右A01: 4
                  </Cell>
                  <Cell center={false} pl>
                    右A02: 无
                  </Cell>
                  <Cell center={false} pl>
                    右轮座01: 16
                  </Cell>
                  <Cell center={false} pl>
                    右轮座02: 10
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
                  <Cell height={100}></Cell>
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
                  <Cell>RE2B</Cell>
                </Col>
                <Col>
                  <Cell>轴号</Cell>
                </Col>
                <Col>
                  <Cell>12345678</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造日期</Cell>
                </Col>
                <Col>
                  <Cell>12345678</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造单位</Cell>
                </Col>
                <Col>
                  <Cell>123</Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell>轮对首次组装日期</Cell>
                  <Cell>轮对末次组装日期</Cell>
                </Col>
                <Col>
                  <Cell></Cell>
                  <Cell></Cell>
                </Col>
                <Col>
                  <Cell>轮对首次组装单位</Cell>
                  <Cell>轮对末次组装单位</Cell>
                </Col>
                <Col>
                  <Cell></Cell>
                  <Cell></Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell font12>左轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={""} height={IMAGE_HEIGHT} />
                  </View>
                  <Cell font12>左轮座部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={""} height={IMAGE_HEIGHT} />
                  </View>
                </Col>
                <Col>
                  <Cell font12>右轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={""} height={IMAGE_HEIGHT} />
                  </View>
                  <Cell font12>右轮座部扫描图</Cell>
                  <View style={[styles.flex1, styles.borderTR]}>
                    <ReportImage src={""} height={IMAGE_HEIGHT} />
                  </View>
                </Col>
              </Row>
              <Cell font12>左穿透扫描图</Cell>
              <View style={[styles.borderTR]}>
                <ReportImage src={""} height={IMAGE_HEIGHT} />
              </View>
              <Cell font12>右穿透扫描图</Cell>
              <View style={[styles.borderTR]}>
                <ReportImage src={""} height={IMAGE_HEIGHT} />
              </View>
            </View>
          </View>
          <PageFooter>第二页</PageFooter>
        </Page>
      </Document>
    </PDFViewer>
  );
};
