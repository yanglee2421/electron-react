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
import { Home } from "@mui/icons-material";
import { Alert, AlertTitle, Button } from "@mui/material";
import { Document, Page, PDFViewer, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import type { schema } from "@yanglee2421/external-db";
import { mapGroupBy } from "@yotulee/run";
import React from "react";
import { Link, useSearchParams } from "react-router";

type Flaw = typeof schema.quartorsData.$inferSelect;

class FlawHelper {
  private originalFlaws: Flaw[];
  private _sortedFlaws: Flaw[];

  constructor(flaws: Flaw[]) {
    this.originalFlaws = flaws;
    this._sortedFlaws = [];
  }
  dispose() {
    this.originalFlaws = [];
    this._sortedFlaws = [];
  }

  private get sortedFlaws() {
    if (this._sortedFlaws.length === 0) {
      this._sortedFlaws = this.originalFlaws.toSorted((a, b) => {
        const aValue = a.fltValueX || 0;
        const bValue = b.fltValueX || 0;

        return aValue - bValue;
      });
    }

    return this._sortedFlaws;
  }

  get leftCt() {
    return this.sortedFlaws
      .filter((f) => f.nBoard === 0 && f.nChannel === 0)
      .at(-1);
  }
  get rightCt() {
    return this.sortedFlaws
      .filter((f) => f.nBoard === 1 && f.nChannel === 0)
      .at(-1);
  }
  get leftXhc() {
    return FlawHelper.calcXhcFlaws(
      this.sortedFlaws.filter((f) => f.nBoard === 0 && f.nChannel === 1),
    );
  }
  get rightXhc() {
    return FlawHelper.calcXhcFlaws(
      this.sortedFlaws.filter((f) => f.nBoard === 1 && f.nChannel === 1),
    );
  }
  get leftLzOutter() {
    return this.sortedFlaws.filter((f) => f.nBoard === 0 && f.nChannel === 3);
  }
  get rightLzOutter() {
    return this.sortedFlaws.filter((f) => f.nBoard === 1 && f.nChannel === 3);
  }
  get leftLzInner() {
    const list = this.sortedFlaws.filter(
      (f) => f.nBoard === 0 && f.nChannel === 4,
    );

    return [...of(11 - list.length).map(() => void 0), ...list];
  }
  get rightLzInner() {
    const list = this.sortedFlaws.filter(
      (f) => f.nBoard === 1 && f.nChannel === 4,
    );

    return [...of(11 - list.length).map(() => void 0), ...list];
  }
  get leftA3() {
    return this.sortedFlaws.filter((f) => f.nBoard === 0 && f.nChannel === 1);
  }
  get rightA3() {
    return this.sortedFlaws.filter((f) => f.nBoard === 1 && f.nChannel === 1);
  }
  get leftLz() {
    const outter = this.leftLzOutter;
    const inner = this.leftLzInner;

    return [
      ...outter.slice(0, 6),
      ...inner.slice(inner.length - 5, inner.length),
    ];
  }
  get rightLz() {
    const outter = this.rightLzOutter;
    const inner = this.rightLzInner;

    return [
      ...outter.slice(0, 6),
      ...inner.slice(inner.length - 5, inner.length),
    ];
  }

  private static toX(flaw: Flaw) {
    return flaw.fltValueX || 0;
  }

  private static findFlawsByFirst(originalFlaws: Flaw[], flaw1: Flaw) {
    const flaws1 = [flaw1];
    const excepted2 = this.toX(flaw1) + 10;
    const flaw2 = originalFlaws
      .filter((i) => !flaws1.includes(i))
      .toSorted((a, b) => {
        return (
          Math.abs(this.toX(a) - excepted2) - Math.abs(this.toX(b) - excepted2)
        );
      })
      .at(0);

    if (!flaw2) {
      return flaws1;
    }

    const flaws2 = [flaw1, flaw2];
    const excepted3 = this.toX(flaw2) + 5;
    const flaw3 = originalFlaws
      .filter((i) => !flaws2.includes(i))
      .toSorted((a, b) => {
        return (
          Math.abs(this.toX(a) - excepted3) - Math.abs(this.toX(b) - excepted3)
        );
      })
      .at(0);

    if (!flaw3) {
      return flaws2;
    }

    return [flaw1, flaw2, flaw3];
  }

  static calcXhcFlaws(flaws: Flaw[]) {
    if (flaws.length < 4) {
      return flaws;
    }

    let result: Flaw[] = [];

    for (const flaw of flaws) {
      const xhcFlaws = this.findFlawsByFirst(flaws, flaw);

      if (xhcFlaws.length === 3) {
        return xhcFlaws;
      }

      if (xhcFlaws.length > result.length) {
        result = xhcFlaws;
      }
    }

    return result;
  }
}

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
