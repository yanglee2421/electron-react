import { fetchCHR502Data } from "#renderer/api/printer";
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
import { resolveCHR502 } from "#shared/functions/chr502";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Alert, AlertTitle } from "@mui/material";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import React from "react";

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
                        {"轮座镶入部轮座镶入部".split("").join("\n")}
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
  const query = useQuery(fetchCHR502Data());

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

    const of10 = of(10);
    const { flaws, records, corporation } = query.data;
    const { attenMap, resultInfo, maxDiffInfo } = resolveCHR502(flaws);
    const opids = records
      .toSorted(
        (a, b) => new Date(a.tmnow!).getTime() - new Date(b.tmnow!).getTime(),
      )
      .map((record) => record.szIDs);

    return (
      <PDFViewer
        showToolbar={true}
        style={{ width: "100%", height: "100vh", border: 0 }}
      >
        <ReportDoc
          tableHeader={{
            factoryName: corporation.Factory || "",
            zx: records.at(0)?.szWHModel || "",
            date: dayjs(records.at(-1)?.tmnow).format("YYYY-MM-DD HH:mm:ss"),
          }}
          equipmentTable={{
            deviceNo: corporation.DeviceNO || "",
            createDate: dayjs(corporation.prodate).format("YYYY-MM-DD") || "",
            previousCheckDate: dayjs().format("YYYY-MM-DD"),
          }}
        >
          <Col>
            <Cell>反射波高(dB)</Cell>
            <Row>
              {opids.map((opid, index) => {
                return (
                  <Col key={opid}>
                    <Cell>第{index + 1}次</Cell>
                    <Row>
                      <Col>
                        <Cell>左</Cell>
                        <Cell>{attenMap.get(opid)?.lxh}</Cell>
                        <Cell>{attenMap.get(opid)?.la3}</Cell>
                        <Cell>{attenMap.get(opid)?.l01}</Cell>
                        <Cell>{attenMap.get(opid)?.l02}</Cell>
                        {of10.map((_) => (
                          <Cell key={_}></Cell>
                        ))}
                        <Cell>{attenMap.get(opid)?.lct}</Cell>
                      </Col>
                      <Col>
                        <Cell>右</Cell>
                        <Cell>{attenMap.get(opid)?.rxh}</Cell>
                        <Cell>{attenMap.get(opid)?.ra3}</Cell>
                        <Cell>{attenMap.get(opid)?.r01}</Cell>
                        <Cell>{attenMap.get(opid)?.r02}</Cell>
                        {of10.map((_) => (
                          <Cell key={_}></Cell>
                        ))}
                        <Cell>{attenMap.get(opid)?.rct}</Cell>
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
                    <Cell>{maxDiffInfo.lxh}</Cell>
                    <Cell>{maxDiffInfo.la3}</Cell>
                    <Cell>{maxDiffInfo.l01}</Cell>
                    <Cell>{maxDiffInfo.l02}</Cell>
                    {of10.map((_) => (
                      <Cell key={_}></Cell>
                    ))}
                    <Cell>{maxDiffInfo.lct}</Cell>
                  </Col>
                  <Col>
                    <Cell>右</Cell>
                    <Cell>{maxDiffInfo.rxh}</Cell>
                    <Cell>{maxDiffInfo.ra3}</Cell>
                    <Cell>{maxDiffInfo.r01}</Cell>
                    <Cell>{maxDiffInfo.r02}</Cell>
                    {of10.map((_) => (
                      <Cell key={_}></Cell>
                    ))}
                    <Cell>{maxDiffInfo.rct}</Cell>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col width={LAST_COL_WIDTH}>
            <Cell></Cell>
            <Cell>结果评定</Cell>
            <Cell></Cell>
            <Cell>{resultInfo.xhc}</Cell>
            <Cell>{resultInfo.a3}</Cell>
            <Cell>{resultInfo.ch01}</Cell>
            <Cell>{resultInfo.ch02}</Cell>
            {of10.map((count) => {
              return <Cell key={count}></Cell>;
            })}
            <Cell>{resultInfo.ct}</Cell>
          </Col>
        </ReportDoc>
      </PDFViewer>
    );
  };

  return renderQuery();
};
