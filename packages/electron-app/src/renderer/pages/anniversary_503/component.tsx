import { fetchCHR503Data } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import {
  Cell,
  Col,
  PageFooter,
  PageHeader,
  ReportTitle,
  Row,
} from "#renderer/components/pdf";
import { of } from "#shared/functions/array";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Alert, AlertTitle } from "@mui/material";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

export const Component = () => {
  const CELL_HEIGHT = 18;
  const BLOCK_COL_WIDTH = 30;
  const params = useParams();
  const query = useQuery(fetchCHR503Data(params.id!));

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

    return (
      <PDFViewer
        showToolbar
        style={{ width: "100%", height: "100vh", border: 0 }}
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
              <View style={[styles.paddingB4, styles.font12]}>
                <Row>
                  <Col>
                    <Text>单位名称</Text>
                  </Col>
                  <Col></Col>
                  <Col>
                    <Text>检验时间</Text>
                  </Col>
                  <Col></Col>
                </Row>
              </View>
              <View style={[styles.borderBL]}>
                <CellHeightContext value={20}>
                  <Row>
                    <Col>
                      <Cell font12>设备型号</Cell>
                      <Cell font12>制造单位</Cell>
                    </Col>
                    <Col>
                      <Cell></Cell>
                      <Cell></Cell>
                    </Col>
                    <Col>
                      <Cell font12>设备编号</Cell>
                      <Cell font12>制造日期</Cell>
                    </Col>
                    <Col>
                      <Cell></Cell>
                      <Cell></Cell>
                    </Col>
                  </Row>
                  <Cell font12>仪器测试情况</Cell>
                </CellHeightContext>
                <CellHeightContext value={CELL_HEIGHT}>
                  <Row>
                    <Col>
                      <Cell>测试项目及数据</Cell>
                      <Row>
                        <Col width={BLOCK_COL_WIDTH}>
                          <Cell>试块</Cell>
                          <Cell height={CELL_HEIGHT * 2}>通道</Cell>
                          {of(24).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                          <Cell height={CELL_HEIGHT * 3}>签章</Cell>
                        </Col>
                        <Col>
                          <Cell>CSK-1A</Cell>
                          <Row>
                            <Col>
                              <Cell height={CELL_HEIGHT * 2}>
                                {"水平线性\n(%)"}
                              </Cell>
                              {of(24).map((i) => (
                                <Cell key={i}>{i}</Cell>
                              ))}
                              <Cell>探伤工</Cell>
                              <Cell height={CELL_HEIGHT * 2}></Cell>
                            </Col>
                            <Col>
                              <Cell height={CELL_HEIGHT * 2}>
                                {"分辨力\n(dB)"}
                              </Cell>
                              {of(24).map((i) => (
                                <Cell key={i}>{i}</Cell>
                              ))}
                              <Cell>探伤工长</Cell>
                              <Cell height={CELL_HEIGHT * 2}></Cell>
                            </Col>
                          </Row>
                        </Col>
                        <Col>
                          <Cell>CS-1-5</Cell>
                          <Row>
                            <Col>
                              <Cell height={CELL_HEIGHT * 2}>
                                {"垂直线性\n(%)"}
                              </Cell>
                              {of(24).map((i) => (
                                <Cell key={i}>{i}</Cell>
                              ))}
                              <Cell>设备维修工</Cell>
                              <Cell height={CELL_HEIGHT * 2}></Cell>
                            </Col>
                            <Col width={54}>
                              <Cell height={CELL_HEIGHT * 2}>
                                {"灵敏度余量\n(dB)"}
                              </Cell>
                              {of(24).map((i) => (
                                <Cell key={i}>{i}</Cell>
                              ))}
                              <Cell>质检员</Cell>
                              <Cell height={CELL_HEIGHT * 2}></Cell>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Col>
                    <Col>
                      <Row>
                        <Col>
                          <Cell>探头型号</Cell>
                        </Col>
                        <Col>
                          <Cell>2.5P20Z</Cell>
                        </Col>
                      </Row>
                      <Cell>测试结果判定</Cell>
                      <Row>
                        <Col>
                          <Row>
                            <Col>
                              <Cell height={CELL_HEIGHT * 2}>
                                {"水平\n线性"}
                              </Cell>
                              {of(24).map((i) => (
                                <Cell key={i}>{i}</Cell>
                              ))}
                            </Col>
                            <Col>
                              <Cell height={CELL_HEIGHT * 2}>{"分辨力"}</Cell>
                              {of(24).map((i) => (
                                <Cell key={i}>{i}</Cell>
                              ))}
                            </Col>
                            <Col>
                              <Cell height={CELL_HEIGHT * 2}>
                                {"垂直\n线性"}
                              </Cell>
                              {of(24).map((i) => (
                                <Cell key={i}>{i}</Cell>
                              ))}
                            </Col>
                          </Row>
                          <Row>
                            <Col>
                              <Cell>验收员</Cell>
                              <Cell height={CELL_HEIGHT * 2}></Cell>
                            </Col>
                            <Col>
                              <Cell>轮轴专职</Cell>
                              <Cell height={CELL_HEIGHT * 2}></Cell>
                            </Col>
                          </Row>
                        </Col>
                        <Col width={60}>
                          <Cell height={CELL_HEIGHT * 2}>{"灵敏度\n余量"}</Cell>
                          {of(24).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                          <Cell>设备专职</Cell>
                          <Cell height={CELL_HEIGHT * 2}></Cell>
                        </Col>
                        <Col width={60}>
                          <Cell height={CELL_HEIGHT * 2}>
                            {"测试结果\n判定"}
                          </Cell>
                          {of(24).map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                          <Cell>主管领导</Cell>
                          <Cell height={CELL_HEIGHT * 2}></Cell>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </CellHeightContext>
              </View>
            </View>
            <View style={[styles.paddingT8]}>
              <Text style={[styles.font12]}>
                注：“测试结果判定”中各项目栏以“√” 表示“合格”， “×”表示“不合格”。
              </Text>
            </View>
            <PageFooter>第 1 页</PageFooter>
          </Page>
        </Document>
      </PDFViewer>
    );
  };

  return renderQuery();
};
