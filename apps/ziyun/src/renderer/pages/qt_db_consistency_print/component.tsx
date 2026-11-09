import { fetchDynamicById } from "#renderer/api/qt";
import {
  Cell,
  Col,
  PageHeader,
  ReportTitle,
  Row,
} from "#renderer/components/pdf";
import { of } from "#shared/functions/array";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useParams } from "react-router";

export const Component = () => {
  const params = useParams<{ id: string }>();
  const id = params.id;
  useQuery(fetchDynamicById(Number(id)));
  const RowHeight = React.use(CellHeightContext);

  return (
    <PDFViewer
      showToolbar
      style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
    >
      <Document
        title="CHR503"
        creator="超声波自动探伤机"
        producer="武铁紫云接口面板"
      >
        <Page size={"A4"} style={[styles.page]}>
          <PageHeader>辆货统-503</PageHeader>
          <View>
            <ReportTitle>
              铁路货车轮轴B/C型显示超声波自动探伤系统年度性能评定记录
            </ReportTitle>
            <View style={[styles.borderBL]}>
              <Row>
                {of(2).map((i) => (
                  <Col key={i}>
                    <Row>
                      <Col>
                        <Cell>板卡</Cell>
                        <Cell height={RowHeight * 15}>左</Cell>
                      </Col>
                      <Col>
                        <Cell>部位</Cell>
                        <Cell>穿透</Cell>
                        <Cell height={RowHeight * 3}>卸荷槽</Cell>
                        <Cell height={RowHeight * 11}>轮座</Cell>
                      </Col>
                      <Col>
                        <Cell>编号</Cell>
                        {of(11 + 3 + 1).map((i) => (
                          <Cell key={i}></Cell>
                        ))}
                      </Col>
                      <Col>
                        <Cell>波幅</Cell>
                        {of(11 + 3 + 1).map((i) => (
                          <Cell key={i}></Cell>
                        ))}
                      </Col>
                      <Col>
                        <Cell>A’ave</Cell>
                        <Cell></Cell>
                        <Cell height={RowHeight * 3}></Cell>
                        <Cell height={RowHeight * 11}></Cell>
                      </Col>
                      <Col>
                        <Cell>ΔA</Cell>
                        {of(11 + 3 + 1).map((i) => (
                          <Cell key={i}></Cell>
                        ))}
                      </Col>
                      <Col>
                        <Cell>S’con</Cell>
                        {of(11 + 3 + 1).map((i) => (
                          <Cell key={i}></Cell>
                        ))}
                      </Col>
                    </Row>
                  </Col>
                ))}
              </Row>
              <Row>
                <Col>
                  <Cell>结果</Cell>
                </Col>
                <Col>
                  <Cell>合格</Cell>
                </Col>
              </Row>
            </View>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
};
