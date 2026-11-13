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
    Array.from(flawMap).map(([key, value]) => [key, new FlawHelper(value)]),
  );

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
                  <Cell height={RowHeight * 11}>{"左\n轮\n座"}</Cell>
                  <Cell>右穿透</Cell>
                  <Cell height={RowHeight * 3}>{"左\n卸\n荷\n槽"}</Cell>
                  <Cell height={RowHeight * 11}>{"左\n轮\n座"}</Cell>
                </Col>
                <Col>
                  <Cell>编号</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>端面</Cell>
                  <Cell>
                    {helperMap
                      .get(rows[0].szIDs)
                      ?.leftCt?.fltValueX?.toFixed(0)}
                  </Cell>
                  {of(3).map((i, index) => {
                    return (
                      <Cell key={i}>
                        {helperMap
                          .get(rows[0].szIDs)
                          ?.leftXhc[index]?.fltValueX?.toFixed(0)}
                      </Cell>
                    );
                  })}
                  {of(11).map((i, index) => {
                    return (
                      <Cell key={i}>
                        {helperMap
                          .get(rows[0].szIDs)
                          ?.leftLz[index]?.fltValueX?.toFixed(0)}
                      </Cell>
                    );
                  })}
                  <Cell>
                    {helperMap
                      .get(rows[0].szIDs)
                      ?.rightCt?.fltValueX?.toFixed(0)}
                  </Cell>
                  {of(3).map((i, index) => {
                    return (
                      <Cell key={i}>
                        {helperMap
                          .get(rows[0].szIDs)
                          ?.rightXhc[index]?.fltValueX?.toFixed(0)}
                      </Cell>
                    );
                  })}
                  {of(11).map((i, index) => {
                    return (
                      <Cell key={i}>
                        {helperMap
                          .get(rows[0].szIDs)
                          ?.rightLz[index]?.fltValueX?.toFixed(0)}
                      </Cell>
                    );
                  })}
                </Col>
                <Col>
                  <Cell>Aave</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                {rows.map((row, index) => {
                  return (
                    <React.Fragment key={row.recID}>
                      <Col>
                        <Cell>{`A${index + 1}`}</Cell>
                        <Cell>
                          {helperMap.get(rows[index].szIDs)?.leftCt?.fFWValue}
                        </Cell>
                        {of(3).map((i, flawIndex) => {
                          return (
                            <Cell key={i}>
                              {
                                helperMap.get(rows[index].szIDs)?.leftXhc[
                                  flawIndex
                                ]?.fFWValue
                              }
                            </Cell>
                          );
                        })}
                        {of(11).map((i, flawIndex) => {
                          return (
                            <Cell key={i}>
                              {
                                helperMap.get(rows[index].szIDs)?.leftLz[
                                  flawIndex
                                ]?.fFWValue
                              }
                            </Cell>
                          );
                        })}
                        <Cell>
                          {helperMap.get(rows[index].szIDs)?.rightCt?.fFWValue}
                        </Cell>
                        {of(3).map((i, flawIndex) => {
                          return (
                            <Cell key={i}>
                              {
                                helperMap.get(rows[index].szIDs)?.rightXhc[
                                  flawIndex
                                ]?.fFWValue
                              }
                            </Cell>
                          );
                        })}
                        {of(11).map((i, flawIndex) => {
                          return (
                            <Cell key={i}>
                              {
                                helperMap.get(rows[index].szIDs)?.rightLz[
                                  flawIndex
                                ]?.fFWValue
                              }
                            </Cell>
                          );
                        })}
                      </Col>
                      <Col>
                        <Cell>{`ΔA${index + 1}`}</Cell>
                        <Cell>1</Cell>
                        {of(3).map((i) => {
                          return <Cell key={i}>{i}</Cell>;
                        })}
                        {of(11).map((i) => {
                          return <Cell key={i}>{i}</Cell>;
                        })}
                        <Cell>1</Cell>
                        {of(3).map((i) => {
                          return <Cell key={i}>{i}</Cell>;
                        })}
                        {of(11).map((i) => {
                          return <Cell key={i}>{i}</Cell>;
                        })}
                      </Col>
                    </React.Fragment>
                  );
                })}
                <Col>
                  <Cell>Δ</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>Re</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                </Col>
                <Col>
                  <Cell>结论</Cell>
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  <Cell>1</Cell>
                  {of(3).map((i) => {
                    return <Cell key={i}>{i}</Cell>;
                  })}
                  {of(11).map((i) => {
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
