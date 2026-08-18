import { fetchQT502 } from "#renderer/api/qt";
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
import { divideBy10 } from "#shared/functions/math";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Home } from "@mui/icons-material";
import { Alert, AlertTitle, Button } from "@mui/material";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import type { schema } from "@yanglee2421/external-db";
import { mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import React from "react";
import { Link, useSearchParams } from "react-router";

type Flaw = typeof schema.quartorsData.$inferSelect;

interface MetaInfo {
  lct: string;
  lxh: string;
  l01: string;
  l02: string;
  la3: string;
  rct: string;
  rxh: string;
  r01: string;
  r02: string;
  ra3: string;
}

const calcFlawAtten = (flaws?: Flaw[]) => {
  if (!Array.isArray(flaws)) {
    return "";
  }

  const firstFlaw = flaws.at(0);

  if (!firstFlaw) {
    return "";
  }

  return typeof firstFlaw.nAtten === "number"
    ? divideBy10(firstFlaw.nAtten)
    : "";
};

const calcRowAtten = (flaws: Flaw[]) => {
  const group = mapGroupBy(flaws, (flaw) => `${flaw.nBoard}-${flaw.nChannel}`);

  const meta: MetaInfo = {
    lct: calcFlawAtten(group.get("0-0")),
    lxh: calcFlawAtten(group.get("0-1")),
    la3: calcFlawAtten(group.get("0-2")),
    l01: calcFlawAtten(group.get("0-3")),
    l02: calcFlawAtten(group.get("0-4")),
    rct: calcFlawAtten(group.get("1-0")),
    rxh: calcFlawAtten(group.get("1-1")),
    ra3: calcFlawAtten(group.get("1-2")),
    r01: calcFlawAtten(group.get("1-3")),
    r02: calcFlawAtten(group.get("1-4")),
  };

  return meta;
};

const calcMaxDiff = (strings: string[]) => {
  const numbers = strings.map((str) => Number.parseFloat(str));
  const hasNan = numbers.some((num) => Number.isNaN(num));

  if (hasNan) {
    return "";
  }

  return Math.max(...numbers) - Math.min(...numbers);
};

const calcResult = (left: number | string, right: number | string) => {
  if (typeof left === "string") {
    return typeof right === "string" ? "" : "不合格";
  }

  if (typeof right === "string") {
    return "不合格";
  }

  if (left > 6) {
    return "不合格";
  }

  if (right > 6) {
    return "不合格";
  }

  return "合格";
};

// 日常
// app-ziyun://localhost/qt/verify/501?szIds=123456
// 季度
// app-ziyun://localhost/qt/quartors/502?zx=re2b&date=2024-01-01
// CH52A
// app-ziyun://localhost/qt/detections/52a?szIds=123456
// CH53A
// app-ziyun://localhost/qt/detections/53a?user=xxx&date=2024-01-01

const FIRST_COL_WIDTH = 50;
const LAST_COL_WIDTH = 50;
const CHANNEL_COL_WIDTH = 80;

interface TableHeaderProps {
  factoryName?: string;
  date?: string;
  zx?: string;
}

const TableHeader = (props: TableHeaderProps) => (
  <Row>
    <Col width={FIRST_COL_WIDTH}>
      <Cell>单位名称</Cell>
    </Col>
    <Col>
      <Cell>{props.factoryName}</Cell>
    </Col>
    <Col width={40}>
      <Cell>{props.zx}</Cell>
    </Col>
    <Col width={60}>
      <Cell>校验时间</Cell>
    </Col>
    <Col>
      <Cell>{props.date}</Cell>
    </Col>
  </Row>
);

interface EquipmentTableProps {
  createDate?: string;
  deviceNo?: string;
  previousCheckDate?: string;
}

const EquipmentTable = (props: EquipmentTableProps) => {
  return (
    <Row>
      <Col width={FIRST_COL_WIDTH}>
        <Cell>设备编号</Cell>
      </Col>
      <Col>
        <Cell>{props.deviceNo}</Cell>
      </Col>
      <Col width={FIRST_COL_WIDTH}>
        <Cell>制造时间</Cell>
      </Col>
      <Col>
        <Cell>{props.createDate}</Cell>
      </Col>
      <Col width={FIRST_COL_WIDTH}>
        <Cell>制造单位</Cell>
      </Col>
      <Col width={FIRST_COL_WIDTH}>
        <Cell>紫云公司</Cell>
      </Col>
      <Col>
        <Cell>上次检修时间</Cell>
      </Col>
      <Col>
        <Cell>{props.previousCheckDate}</Cell>
      </Col>
    </Row>
  );
};

interface SignatureTableProps {
  tsg?: string;
}

const SignatureTable = (props: SignatureTableProps) => {
  const { tsg } = props;
  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);

  return (
    <>
      <Row>
        <Col width={FIRST_COL_WIDTH}>
          <Cell height={BASIC_ROW_HEIGHT * 2}>{"参加\n人员\n签章"}</Cell>
        </Col>
        <Col>
          <Cell>探伤工</Cell>
          <Cell>设备维修工</Cell>
        </Col>
        <Col>
          <Cell>{tsg}</Cell>
          <Cell></Cell>
        </Col>
        <Col>
          <Cell>探伤工长</Cell>
          <Cell>轮轴专职</Cell>
        </Col>
        <Col>
          <Cell></Cell>
          <Cell></Cell>
        </Col>
        <Col>
          <Cell>质检员</Cell>
          <Cell>设备专职</Cell>
        </Col>
        <Col>
          <Cell></Cell>
          <Cell></Cell>
        </Col>
        <Col>
          <Cell>验收员</Cell>
          <Cell>主管领导</Cell>
        </Col>
        <Col>
          <Cell></Cell>
          <Cell></Cell>
        </Col>
      </Row>
      <Row>
        <Col width={"20%"}>
          <Cell font12>备注</Cell>
        </Col>
        <Col>
          <Cell font12></Cell>
        </Col>
      </Row>
    </>
  );
};

interface ReportDocProps {
  children?: React.ReactNode;
  tableHeader: TableHeaderProps;
  equipmentTable: EquipmentTableProps;
}

const ReportDoc = (props: ReportDocProps) => {
  const CELL_HEIGHT = 26;

  return (
    <Document
      title="CHR502"
      creator="超声波自动探伤机"
      producer="武铁紫云接口面板"
    >
      <Page size="A4" style={[styles.page, styles.font10, styles.textCenter]}>
        <PageHeader>辆货统-502</PageHeader>
        <View>
          <ReportTitle>
            铁路货车轮轴B/C型显示超声波自动探伤系统季度性能校验记录
          </ReportTitle>
          <CellHeightContext value={CELL_HEIGHT}>
            <View style={[styles.borderBL]}>
              <TableHeader {...props.tableHeader} />
              <EquipmentTable {...props.equipmentTable} />
              <Row>
                <Col width={CHANNEL_COL_WIDTH}>
                  <Cell height={CELL_HEIGHT * 3}>通道</Cell>
                  <Row>
                    <Col width={FIRST_COL_WIDTH}>
                      <Cell height={CELL_HEIGHT * 2}>{"轴颈\n根部"}</Cell>
                      <Cell height={CELL_HEIGHT * 12}>
                        {"轮座镶入部".split("").join("\n")}
                      </Cell>
                      <Cell>全轴穿透</Cell>
                    </Col>
                    <Col>
                      <Cell>A1</Cell>
                      <Cell>A3</Cell>
                      <Cell>01</Cell>
                      <Cell>02</Cell>
                      {of(10).map((_) => (
                        <Cell key={_}></Cell>
                      ))}
                      <Cell>CT</Cell>
                    </Col>
                  </Row>
                </Col>
                {props.children}
              </Row>
              <CellHeightContext value={40}>
                <SignatureTable />
              </CellHeightContext>
            </View>
          </CellHeightContext>
          <View style={[styles.paddingT8]}>
            <Text style={[styles.font12]}>
              注：最大差值(ΔdB)是指五次波幅测量值中最大值与最小值之差，要求ΔdB≤6dB。
            </Text>
          </View>
        </View>
        <PageFooter>第 1 页</PageFooter>
      </Page>
    </Document>
  );
};

export const Component = () => {
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

  const renderQuery = () => {
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

    const of10 = of(10);

    const { FACTORY_CLD, FACTORY_SBBH, FACTORY_SYRQ, rows, datas } = query.data;

    const firstRow = rows.at(0);

    const metas = rows.map((row) => {
      const flaws = datas.filter((data) => Object.is(data.szIds, row.szIds));
      const meta = calcRowAtten(flaws);

      return { row, meta };
    });

    return (
      <PDFViewer
        showToolbar
        style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
      >
        <ReportDoc
          tableHeader={{
            factoryName: FACTORY_CLD || "",
            zx: firstRow?.szWhModel || "",
            date: dayjs(firstRow?.tmNow).format("YYYY-MM-DD HH:mm:ss"),
          }}
          equipmentTable={{
            deviceNo: FACTORY_SBBH || "",
            createDate: dayjs(FACTORY_SYRQ).format("YYYY-MM-DD") || "",
            previousCheckDate: "",
          }}
        >
          <Col>
            <Cell>反射波高(dB)</Cell>
            <Row>
              {metas.map(({ row, meta }, index) => {
                return (
                  <Col key={row.szIds}>
                    <Cell>第{index + 1}次</Cell>
                    <Row>
                      <Col>
                        <Cell>左</Cell>
                        <Cell>{meta.lxh}</Cell>
                        <Cell>{meta.la3}</Cell>
                        <Cell>{meta.l01}</Cell>
                        <Cell>{meta.l02}</Cell>
                        {of10.map((_) => (
                          <Cell key={_}></Cell>
                        ))}
                        <Cell>{meta.lct}</Cell>
                      </Col>
                      <Col>
                        <Cell>右</Cell>
                        <Cell>{meta.rxh}</Cell>
                        <Cell>{meta.ra3}</Cell>
                        <Cell>{meta.r01}</Cell>
                        <Cell>{meta.r02}</Cell>
                        {of10.map((_) => (
                          <Cell key={_}></Cell>
                        ))}
                        <Cell>{meta.rct}</Cell>
                      </Col>
                    </Row>
                  </Col>
                );
              })}
              <Col>
                <Cell>最大差值</Cell>
                <Row>
                  <Col>
                    <Cell>左</Cell>
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.lxh))}
                    </Cell>
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.la3))}
                    </Cell>
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.l01))}
                    </Cell>
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.l02))}
                    </Cell>
                    {of10.map((_) => (
                      <Cell key={_}></Cell>
                    ))}
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.lct))}
                    </Cell>
                  </Col>
                  <Col>
                    <Cell>右</Cell>
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.rxh))}
                    </Cell>
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.ra3))}
                    </Cell>
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.r01))}
                    </Cell>
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.r02))}
                    </Cell>
                    {of10.map((_) => (
                      <Cell key={_}></Cell>
                    ))}
                    <Cell>
                      {calcMaxDiff(metas.map(({ meta }) => meta.rct))}
                    </Cell>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col width={LAST_COL_WIDTH}>
            <Cell></Cell>
            <Cell>结果评定</Cell>
            <Cell></Cell>
            <Cell>
              {calcResult(
                calcMaxDiff(metas.map(({ meta }) => meta.lxh)),
                calcMaxDiff(metas.map(({ meta }) => meta.rxh)),
              )}
            </Cell>
            <Cell>
              {calcResult(
                calcMaxDiff(metas.map(({ meta }) => meta.la3)),
                calcMaxDiff(metas.map(({ meta }) => meta.ra3)),
              )}
            </Cell>
            <Cell>
              {calcResult(
                calcMaxDiff(metas.map(({ meta }) => meta.l01)),
                calcMaxDiff(metas.map(({ meta }) => meta.r01)),
              )}
            </Cell>
            <Cell>
              {calcResult(
                calcMaxDiff(metas.map(({ meta }) => meta.l02)),
                calcMaxDiff(metas.map(({ meta }) => meta.r02)),
              )}
            </Cell>
            {of10.map((count) => {
              return <Cell key={count}></Cell>;
            })}
            <Cell>
              {calcResult(
                calcMaxDiff(metas.map(({ meta }) => meta.lct)),
                calcMaxDiff(metas.map(({ meta }) => meta.rct)),
              )}
            </Cell>
          </Col>
        </ReportDoc>
      </PDFViewer>
    );
  };

  return renderQuery();
};
