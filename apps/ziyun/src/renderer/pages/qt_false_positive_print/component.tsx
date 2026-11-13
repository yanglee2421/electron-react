import { fetchQT502 } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import {
  Cell,
  Col,
  PageHeader,
  ReportTitle,
  Row,
} from "#renderer/components/pdf";
import { of } from "#shared/functions/array";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { FlawHelper } from "#shared/qt-flaw-helper";
import { Home } from "@mui/icons-material";
import { Alert, AlertTitle, Button } from "@mui/material";
import { Document, Page, PDFViewer, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { mapGroupBy } from "@yotulee/run";
import React from "react";
import { Link, useSearchParams } from "react-router";

export const Component = () => {
  const RowHeight = React.use(CellHeightContext);

  const [search] = useSearchParams();
  const user = search.get("user");
  const zx = search.get("zx");
  const date = search.get("date");
  const ids = search.getAll("row");
  const query = useQuery(
    fetchQT502({
      ids,
      user: user || "",
      zx: zx || "",
      date: date || "",
    }),
  );

  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return (
      <Alert>
        <AlertTitle>错误</AlertTitle>
        {query.error.message}
        <div></div>
        <Button
          component={Link}
          to={{ pathname: "/" }}
          variant="contained"
          color="error"
          sx={{ mt: 1 }}
          startIcon={<Home />}
        >
          回到首页
        </Button>
      </Alert>
    );
  }

  const { rows, datas } = query.data;
  const flawMap = mapGroupBy(datas, (i) => i.szIDs);
  const helperMap = new Map(
    [...flawMap].map(([key, value]) => [key, new FlawHelper(value)]),
  );

  const toFlawCount = (
    rowIndex: number,
    direction: number,
    channel: number,
  ) => {
    const helper = helperMap.get(rows[rowIndex].szIDs);

    switch (channel) {
      case 0: {
        const ch = direction ? helper?.rightCtOriginal : helper?.leftCtOriginal;
        return ch?.length ?? 0;
      }
      case 1: {
        const ch = direction
          ? helper?.rightXhcOrignal
          : helper?.leftXhcOriginal;
        return ch?.length ?? 0;
      }
      case 2: {
        const ch = direction ? helper?.rightA3 : helper?.leftA3;
        return ch?.length ?? 0;
      }
      case 3:
      case 4: {
        const ch = direction ? helper?.rightLzOriginal : helper?.leftLzOriginal;
        return ch?.length ?? 0;
      }
      default:
        return 0;
    }
  };

  const flawCounts = rows.map((_, rowIndex) => {
    const leftCt = toFlawCount(rowIndex, 0, 0);
    const leftXhc = toFlawCount(rowIndex, 0, 1);
    const leftA3 = toFlawCount(rowIndex, 0, 2);
    const leftLz = toFlawCount(rowIndex, 0, 3);
    const leftCount = leftCt + leftXhc + leftLz;

    const rightCt = toFlawCount(rowIndex, 1, 0);
    const rightXhc = toFlawCount(rowIndex, 1, 1);
    const rightA3 = toFlawCount(rowIndex, 1, 2);
    const rightLz = toFlawCount(rowIndex, 1, 3);
    const rightCount = rightCt + rightXhc + rightLz;
    const count = leftCount + rightCount;

    return {
      leftCt,
      leftXhc,
      leftA3,
      leftLz,
      leftCount,

      rightCt,
      rightXhc,
      rightA3,
      rightLz,
      rightCount,

      count,
    };
  });

  const A = 30;
  const B = flawCounts.reduce((a, b) => a + b.count, 0);

  const renderCountCol = (index: number) => {
    const num = index + 1;
    return (
      <Col>
        <Cell>{`A${num}`}</Cell>
        <Cell>{flawCounts[index].leftCt}</Cell>
        <Cell>{flawCounts[index].leftXhc}</Cell>
        <Cell>{flawCounts[index].leftLz}</Cell>
        <Cell>{flawCounts[index].leftCount}</Cell>
        <Cell>{flawCounts[index].rightCt}</Cell>
        <Cell>{flawCounts[index].rightXhc}</Cell>
        <Cell>{flawCounts[index].rightLz}</Cell>
        <Cell>{flawCounts[index].rightCount}</Cell>
        <Cell>{flawCounts[index].count}</Cell>
      </Col>
    );
  };

  const renderDiffCol = (index: number) => {
    const num = index + 1;
    return (
      <Col>
        <Cell>{`ΔA${num}`}</Cell>
        <Cell>{Math.abs(1 - flawCounts[index].leftCt)}</Cell>
        <Cell>{Math.abs(3 - flawCounts[index].leftXhc)}</Cell>
        <Cell>{Math.abs(11 - flawCounts[index].leftLz)}</Cell>
        <Cell>{Math.abs(15 - flawCounts[index].leftCount)}</Cell>
        <Cell>{Math.abs(1 - flawCounts[index].rightCt)}</Cell>
        <Cell>{Math.abs(3 - flawCounts[index].rightXhc)}</Cell>
        <Cell>{Math.abs(11 - flawCounts[index].rightLz)}</Cell>
        <Cell>{Math.abs(15 - flawCounts[index].rightCount)}</Cell>
        <Cell>{Math.abs(30 - flawCounts[index].count)}</Cell>
      </Col>
    );
  };

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
                      {of(2).map((i) => (
                        <React.Fragment key={i}>
                          {[1, 3, 11, 15].map((i) => (
                            <Cell key={i}>{i}</Cell>
                          ))}
                        </React.Fragment>
                      ))}
                      <Cell>30</Cell>
                    </Col>
                  </Row>

                  <Cell>人工缺陷总数A</Cell>
                  <Cell>自动检测误判率(Lr)</Cell>
                </Col>
                <Col>
                  <Row>
                    <Col>
                      <Row>
                        {of(2).map((num, index) => {
                          return (
                            <React.Fragment key={num}>
                              {renderCountCol(index)}
                              {renderDiffCol(index)}
                            </React.Fragment>
                          );
                        })}
                      </Row>
                      <Cell>{A}</Cell>
                    </Col>
                    <Col>
                      <Row>
                        {renderCountCol(2)}
                        {renderDiffCol(2)}
                        {renderCountCol(3)}
                      </Row>
                      <Cell>自动缺陷检测B</Cell>
                    </Col>
                    <Col>
                      <Row>
                        {renderDiffCol(3)}
                        {renderCountCol(4)}
                        {renderDiffCol(4)}
                      </Row>
                      <Cell>{B}</Cell>
                    </Col>
                  </Row>
                  <Cell>
                    {(((B - 5 * A) / (5 * A)) * 100).toFixed(1) + "%"}
                  </Cell>
                </Col>
              </Row>
            </View>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
};
