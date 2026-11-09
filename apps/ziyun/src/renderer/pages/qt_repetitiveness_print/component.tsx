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
              铁路货车轮轴B/C型显示超声波自动探伤系统重复性检测评定记录
            </ReportTitle>
            <View style={[styles.borderBL]}>
              <Row>
                <Col>
                  <Cell>部位</Cell>
                  <Cell>左穿透</Cell>
                  <Cell height={RowHeight * 3}>{"左\n卸\n荷\n槽"}</Cell>
                  <Cell height={RowHeight * 9}>{"左\n轮\n座"}</Cell>
                  <Cell>右穿透</Cell>
                  <Cell height={RowHeight * 3}>{"左\n卸\n荷\n槽"}</Cell>
                  <Cell height={RowHeight * 9}>{"左\n轮\n座"}</Cell>
                </Col>
                <Col>
                  <Cell>编号</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>端面</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>Aave</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A1</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A1</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A2</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A2</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A2</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A2</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A2</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A2</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A2</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A2</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>A</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>Re</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>结论</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(9).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
              </Row>
            </View>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
};
