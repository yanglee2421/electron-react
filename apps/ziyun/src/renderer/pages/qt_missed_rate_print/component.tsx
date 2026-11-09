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
              铁路货车轮轴B/C型显示超声波自动探伤系统漏检率评定记录
            </ReportTitle>
            <View style={[styles.borderBL]}>
              <Row>
                <Col width={40}>
                  <Cell>板卡</Cell>
                  <Cell height={RowHeight * 4}>左</Cell>
                  <Cell height={RowHeight * 4}>右</Cell>
                  <Cell height={RowHeight * 3}></Cell>
                </Col>
                <Col width={100}>
                  <Row>
                    <Col>
                      <Cell>部位</Cell>
                      <Cell>穿透</Cell>
                      <Cell>卸荷槽</Cell>
                      <Cell>轮座</Cell>
                      <Cell>左合计</Cell>
                      <Cell>穿透</Cell>
                      <Cell>卸荷槽</Cell>
                      <Cell>轮座</Cell>
                      <Cell>右合计</Cell>
                      <Cell>总数</Cell>
                    </Col>
                    <Col>
                      <Cell>A</Cell>
                      {of(8).map((i) => (
                        <Cell key={i}>{i}</Cell>
                      ))}
                      <Cell></Cell>
                    </Col>
                  </Row>

                  <Cell>人工缺陷总数A</Cell>
                  <Cell>自动检测漏检率(Lr)</Cell>
                </Col>
                <Col>
                  <Row>
                    <Col>
                      <Row>
                        <Col>
                          <Cell>A1</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                        <Col>
                          <Cell>A1</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                        <Col>
                          <Cell>A2</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                        <Col>
                          <Cell>A2</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                      </Row>
                      <Cell>30</Cell>
                    </Col>
                    <Col>
                      <Row>
                        <Col>
                          <Cell>A3</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                        <Col>
                          <Cell>A3</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                        <Col>
                          <Cell>A4</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                      </Row>
                      <Cell>自动缺陷检测B</Cell>
                    </Col>
                    <Col>
                      <Row>
                        <Col>
                          <Cell>A4</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                        <Col>
                          <Cell>A5</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                        <Col>
                          <Cell>A5</Cell>
                          {of(9).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </Col>
                      </Row>
                      <Cell>150</Cell>
                    </Col>
                  </Row>
                  <Cell>2%</Cell>
                </Col>
              </Row>
            </View>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
};
