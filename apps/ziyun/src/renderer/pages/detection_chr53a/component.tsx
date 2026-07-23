import { fetchCHR53AData } from "#renderer/api/printer";
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
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Alert, AlertTitle } from "@mui/material";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { chunk } from "@yotulee/run";
import dayjs from "dayjs";
import { useLocation } from "react-router";

interface CheckCellProps {
  place: number;
  board: number;
  showLeft: boolean;
  showRight: boolean;
}

const CheckCell = (props: CheckCellProps) => {
  const { place, board, showLeft, showRight } = props;

  switch (place) {
    case 3:
      switch (board) {
        case 0:
          return showLeft && <CheckOK />;
        case 1:
          return showRight && <CheckOK />;
        default:
          return null;
      }
    default:
      return <CheckOK />;
  }
};

export const Component = () => {
  const location = useLocation();
  const ids = location.state.ids;
  const CELL_HEIGHT = 18;
  const query = useQuery(fetchCHR53AData({ ids }));

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Alert severity="error">
          <AlertTitle>错误</AlertTitle>
          {query.error.message}
        </Alert>
      );
    }

    const { records, corporation } = query.data;
    const MAX_ROWS_PER_PAGE = 28;
    const pages = chunk(records, MAX_ROWS_PER_PAGE);
    const firstRow = records.at(0);

    if (!firstRow) {
      return (
        <Alert severity="info">
          <AlertTitle>空数据</AlertTitle>
          未查询到任何数据
        </Alert>
      );
    }

    return (
      <PDFViewer
        showToolbar
        style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
      >
        <Document
          title="CHR53A"
          creator="超声波自动探伤机"
          producer="武铁紫云接口面板"
        >
          <CellHeightContext value={CELL_HEIGHT}>
            {pages.map((rows, pageIndex) => {
              const ofRest = of(MAX_ROWS_PER_PAGE - rows.length);

              return (
                <Page key={pageIndex} style={[styles.page]} size={"A4"}>
                  <PageHeader>车统-53A</PageHeader>
                  <View>
                    <ReportTitle>
                      铁路货车轮轴（轮对、车轴、车轮）超声波 探伤记录
                    </ReportTitle>
                    <View style={[styles.paddingB4]}>
                      <Row>
                        <Col width={144}>
                          <Text style={[styles.textLeft]}>
                            单位名称:{corporation.Factory}
                          </Text>
                        </Col>
                        <Col>
                          <Text>探伤方法:微控超探</Text>
                        </Col>
                        <Col>
                          <Text>探伤性质:初探</Text>
                        </Col>
                        <Col>
                          <Text>探伤者:{firstRow.szUsername}</Text>
                        </Col>
                        <Col width={60}>
                          <Text>
                            {dayjs(firstRow.tmnow).format("YYYY-MM-DD")}
                          </Text>
                        </Col>
                      </Row>
                    </View>
                    <View style={[styles.borderBL]}>
                      <Row>
                        <Col width={24}>
                          <Cell height={CELL_HEIGHT * 3}>{"序\n号"}</Cell>
                          {rows.map((row, index) => {
                            return <Cell key={row.szIDs}>{index + 1}</Cell>;
                          })}
                          {ofRest.map((_) => (
                            <Cell key={_}></Cell>
                          ))}
                        </Col>
                        <Col width={34}>
                          <Cell height={CELL_HEIGHT * 3}>轴型</Cell>
                          {rows.map((row) => {
                            return <Cell key={row.szIDs}>{row.szWHModel}</Cell>;
                          })}
                          {ofRest.map((_) => (
                            <Cell key={_}></Cell>
                          ))}
                        </Col>
                        <Col width={54}>
                          <Cell height={CELL_HEIGHT * 3}>轴号</Cell>
                          {rows.map((row) => {
                            return (
                              <Cell key={row.szIDs}>{row.szIDsWheel}</Cell>
                            );
                          })}
                          {ofRest.map((_) => (
                            <Cell key={_}></Cell>
                          ))}
                        </Col>
                        <Col width={100}>
                          <Cell height={CELL_HEIGHT * 2}>轮对首次组装</Cell>
                          <Row>
                            <Col width={64}>
                              <Cell>时间</Cell>
                              {rows.map((row) => {
                                return (
                                  <Cell key={row.szIDs}>{row.szTMFirst}</Cell>
                                );
                              })}
                              {ofRest.map((_) => (
                                <Cell key={_}></Cell>
                              ))}
                            </Col>
                            <Col>
                              <Cell>单位</Cell>
                              {rows.map((row) => {
                                return (
                                  <Cell key={row.szIDs}>{row.szIDsFirst}</Cell>
                                );
                              })}
                              {ofRest.map((_) => (
                                <Cell key={_}></Cell>
                              ))}
                            </Col>
                          </Row>
                        </Col>
                        <Col>
                          <Cell>探测部位</Cell>
                          <Row>
                            {of(3).map((place) => {
                              return (
                                <Col key={place}>
                                  <Cell>{place}</Cell>
                                  <Row>
                                    {of(2).map((_, board) => {
                                      return (
                                        <Col key={board}>
                                          <Cell>
                                            {board % 2 !== 0 ? "左" : "右"}
                                          </Cell>
                                          {rows.map((row) => {
                                            return (
                                              <Cell
                                                key={row.szIDs}
                                                text={false}
                                              >
                                                <CheckCell
                                                  place={place}
                                                  board={board}
                                                  showLeft={!!row.bWheelLS}
                                                  showRight={!!row.bWheelRS}
                                                />
                                              </Cell>
                                            );
                                          })}
                                          {ofRest.map((_) => (
                                            <Cell key={_}></Cell>
                                          ))}
                                        </Col>
                                      );
                                    })}
                                  </Row>
                                </Col>
                              );
                            })}
                          </Row>
                        </Col>
                        <Col width={40}>
                          <Cell height={CELL_HEIGHT * 3}>{"探测\n结果"}</Cell>
                          {rows.map((row) => (
                            <Cell key={row.szIDs}>{row.szResult}</Cell>
                          ))}
                          {ofRest.map((_) => (
                            <Cell key={_}></Cell>
                          ))}
                        </Col>
                        <Col width={60}>
                          <Cell height={CELL_HEIGHT * 3}>备注</Cell>
                          {rows.map((row) => (
                            <Cell key={row.szIDs}>
                              {!!row.szMemo && "待复验"}
                            </Cell>
                          ))}
                          {ofRest.map((_) => (
                            <Cell key={_}></Cell>
                          ))}
                        </Col>
                      </Row>
                    </View>
                    <View style={[styles.textLeft, styles.paddingT8]}>
                      <Text>1.注：探测部位中,①②和③分别代表如下内容。</Text>
                      <Text>
                        2.磁粉探伤时：①代表轴身；②代表轮座或幅板孔；③代表轴颈及防尘板座。探测时应在被探测部位栏中画“√”。
                      </Text>
                      <Text>
                        3.超声波探伤时，①代表全轴穿透；②代表轮座镶入部；③代表轴颈根部（或卸荷槽）部位。探测时应在被探测部位栏
                        中画“√”
                      </Text>
                      <Text>4.探伤方法，记录磁探、超探、微控超探。</Text>
                      <Text>
                        5.探伤性质，记录初探和复探，初探和复探分别填写车统-53A。
                      </Text>
                      <Text>6.微控超探发现缺陷时备注栏内注明“待复验”。</Text>
                      <Text>
                        7.新制车轴探伤时，在轮对首次组装栏填写车轴制造时间及单位
                      </Text>
                    </View>
                  </View>
                  <PageFooter center>
                    {pageIndex + 1}页/{pages.length}页
                  </PageFooter>
                </Page>
              );
            })}
          </CellHeightContext>
        </Document>
      </PDFViewer>
    );
  };

  return renderQuery();
};