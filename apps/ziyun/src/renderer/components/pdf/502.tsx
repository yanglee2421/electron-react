import {
  Cell,
  Col,
  PageFooter,
  PageHeader,
  ReportTitle,
  Row,
} from "#renderer/components/pdf";
import { of } from "#shared/functions/array";
import { calculateMaxDiff, calculateResult } from "#shared/functions/chr502";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";
import React from "react";

export interface RowData {
  lch0: string;
  lch1: string;
  lch2: string;
  lch3: string;
  lch4: string;
  rch0: string;
  rch1: string;
  rch2: string;
  rch3: string;
  rch4: string;
}

interface TableHeaderProps {
  factoryName?: string;
  date?: string;
  zx?: string;
}

const LAST_COL_WIDTH = 50;
const CHANNEL_COL_WIDTH = 80;
const FIRST_COL_WIDTH = 50;
const of10 = of(10);

const TableHeader = (props: TableHeaderProps) => {
  return (
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
};

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
  chName0?: React.ReactNode;
  chName1?: React.ReactNode;
  chName2?: React.ReactNode;
  chName3?: React.ReactNode;
  chName4?: React.ReactNode;
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
                      <Cell>{props.chName1}</Cell>
                      <Cell>{props.chName2}</Cell>
                      <Cell>{props.chName3}</Cell>
                      <Cell>{props.chName4}</Cell>
                      {of(10).map((_) => (
                        <Cell key={_}></Cell>
                      ))}
                      <Cell>{props.chName0}</Cell>
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

interface CHR502Props {
  factory: string;
  zx: string;
  validateAt: string | Date;
  equipmentNo: string;
  manufactureDate: string | Date | null;
  lastManufactureDate: string | Date | null;
  chName0: string;
  chName1: string;
  chName2: string;
  chName3: string;
  chName4: string;
  rows: RowData[];
}

export const CHR502 = (props: CHR502Props) => {
  const { rows } = props;

  return (
    <PDFViewer
      showToolbar
      style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
    >
      <ReportDoc
        tableHeader={{
          factoryName: props.factory,
          zx: props.zx,
          date: props.validateAt
            ? dayjs(props.validateAt).format("YYYY-MM-DD HH:mm:ss")
            : "",
        }}
        equipmentTable={{
          deviceNo: props.equipmentNo,
          createDate: props.manufactureDate
            ? dayjs(props.manufactureDate).format("YYYY-MM-DD")
            : "",
          previousCheckDate: props.lastManufactureDate
            ? dayjs(props.lastManufactureDate).format("YYYY-MM-DD")
            : "",
        }}
        chName0={props.chName0}
        chName1={props.chName1}
        chName2={props.chName2}
        chName3={props.chName3}
        chName4={props.chName4}
      >
        <Col>
          <Cell>反射波高(dB)</Cell>
          <Row>
            {rows.map((row, index) => {
              return (
                <Col key={index}>
                  <Cell>{`第${index + 1}次`}</Cell>
                  <Row>
                    <Col>
                      <Cell>左</Cell>
                      <Cell>{row.lch1}</Cell>
                      <Cell>{row.lch2}</Cell>
                      <Cell>{row.lch3}</Cell>
                      <Cell>{row.lch4}</Cell>
                      {of10.map((_) => (
                        <Cell key={_}></Cell>
                      ))}
                      <Cell>{row.lch0}</Cell>
                    </Col>
                    <Col>
                      <Cell>右</Cell>
                      <Cell>{row.rch1}</Cell>
                      <Cell>{row.rch2}</Cell>
                      <Cell>{row.rch3}</Cell>
                      <Cell>{row.rch4}</Cell>
                      {of10.map((_) => (
                        <Cell key={_}></Cell>
                      ))}
                      <Cell>{row.rch0}</Cell>
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
                    {calculateMaxDiff(...rows.map((row) => row.lch1))}
                  </Cell>
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.lch2))}
                  </Cell>
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.lch3))}
                  </Cell>
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.lch4))}
                  </Cell>
                  {of10.map((_) => (
                    <Cell key={_}></Cell>
                  ))}
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.lch0))}
                  </Cell>
                </Col>
                <Col>
                  <Cell>右</Cell>
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.rch1))}
                  </Cell>
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.rch2))}
                  </Cell>
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.rch3))}
                  </Cell>
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.rch4))}
                  </Cell>
                  {of10.map((_) => (
                    <Cell key={_}></Cell>
                  ))}
                  <Cell>
                    {calculateMaxDiff(...rows.map((row) => row.rch0))}
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
            {calculateResult(
              calculateMaxDiff(...rows.map((row) => row.lch1)),
              calculateMaxDiff(...rows.map((row) => row.rch1)),
            )}
          </Cell>
          <Cell>
            {calculateResult(
              calculateMaxDiff(...rows.map((row) => row.lch2)),
              calculateMaxDiff(...rows.map((row) => row.rch2)),
            )}
          </Cell>
          <Cell>
            {calculateResult(
              calculateMaxDiff(...rows.map((row) => row.lch3)),
              calculateMaxDiff(...rows.map((row) => row.rch3)),
            )}
          </Cell>
          <Cell>
            {calculateResult(
              calculateMaxDiff(...rows.map((row) => row.lch4)),
              calculateMaxDiff(...rows.map((row) => row.rch4)),
            )}
          </Cell>
          {of10.map((count) => {
            return <Cell key={count}></Cell>;
          })}
          <Cell>
            {calculateResult(
              calculateMaxDiff(...rows.map((row) => row.lch0)),
              calculateMaxDiff(...rows.map((row) => row.rch0)),
            )}
          </Cell>
        </Col>
      </ReportDoc>
    </PDFViewer>
  );
};
