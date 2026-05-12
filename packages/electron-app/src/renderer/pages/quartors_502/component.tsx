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
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";
import React from "react";

const FIRST_COL_WIDTH = 60;
const LAST_COL_WIDTH = 50;
const CHANNEL_COL_WIDTH = 90;

interface TableHeaderProps {}

const TableHeader = ({}: TableHeaderProps) => (
  <Row>
    <Col width={FIRST_COL_WIDTH}>
      <Cell>单位名称:</Cell>
    </Col>
    <Col>
      <Cell>宁东铁路公司</Cell>
    </Col>
    <Col width={40}>
      <Cell>RE2B</Cell>
    </Col>
    <Col width={60}>
      <Cell>校验时间:</Cell>
    </Col>
    <Col>
      <Cell>{dayjs().format("YYYY-MM-DD HH:mm:ss")}</Cell>
    </Col>
  </Row>
);

interface EquipmentTableProps {
  deviceModel?: string;
  deviceNo?: string;
  blockModel?: string;
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
        <Cell>{props.deviceNo}</Cell>
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
        <Cell>{props.blockModel}</Cell>
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

interface ReportDocProps {}

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
              <TableHeader />
              <EquipmentTable />
              <Row>
                <Col width={CHANNEL_COL_WIDTH}>
                  <Cell height={CELL_HEIGHT * 3}>通道</Cell>
                </Col>
                <Col>
                  <Row>
                    <Col>
                      <Cell>反射波高(dB)</Cell>
                    </Col>
                  </Row>
                  <Row>
                    {of(6).map((count) => {
                      return (
                        <Col key={count}>
                          <Cell>第{count}次</Cell>
                        </Col>
                      );
                    })}
                  </Row>
                  <Row>
                    {of(12).map((count) => {
                      return (
                        <Col key={count}>
                          <Cell>{count % 2 === 0 ? "左" : "右"}</Cell>
                        </Col>
                      );
                    })}
                  </Row>
                </Col>
                <Col width={LAST_COL_WIDTH}>
                  <Cell></Cell>
                  <Cell>结果评定</Cell>
                  <Cell></Cell>
                </Col>
              </Row>
              <Row>
                <Col width={CHANNEL_COL_WIDTH}>
                  <Row>
                    <Col width={FIRST_COL_WIDTH}>
                      <Cell height={CELL_HEIGHT * 2}>{"轴颈\n根部"}</Cell>
                    </Col>
                    <Col>
                      <Cell></Cell>
                      <Cell></Cell>
                    </Col>
                  </Row>
                </Col>
                <Col>
                  {of(2).map((_, board) => {
                    return (
                      <Row key={board}>
                        {of(12).map((count) => {
                          return (
                            <Col key={count}>
                              <Cell>{count}</Cell>
                            </Col>
                          );
                        })}
                      </Row>
                    );
                  })}
                </Col>
                <Col width={LAST_COL_WIDTH}>
                  <Cell></Cell>
                  <Cell>合格</Cell>
                </Col>
              </Row>
              <Row>
                <Col width={CHANNEL_COL_WIDTH}>
                  <Row>
                    <Col width={FIRST_COL_WIDTH}>
                      <Cell height={CELL_HEIGHT * 12}>
                        {"轮座镶入部轮座镶入部".split("").join("\n")}
                      </Cell>
                    </Col>
                    <Col>
                      {of(12).map((count) => {
                        return <Cell key={count}></Cell>;
                      })}
                    </Col>
                  </Row>
                </Col>
                <Col>
                  {of(12).map((count) => {
                    return (
                      <Row key={count}>
                        {of(12).map((count) => {
                          return (
                            <Col key={count}>
                              <Cell>{count}</Cell>
                            </Col>
                          );
                        })}
                      </Row>
                    );
                  })}
                </Col>
                <Col width={LAST_COL_WIDTH}>
                  {of(12).map((count) => {
                    return <Cell key={count}></Cell>;
                  })}
                </Col>
              </Row>
              <Row>
                <Col width={CHANNEL_COL_WIDTH}>
                  <Row>
                    <Col width={FIRST_COL_WIDTH}>
                      <Cell>全轴穿透</Cell>
                    </Col>
                    <Col>
                      <Cell>1</Cell>
                    </Col>
                  </Row>
                </Col>
                <Col>
                  <Cell></Cell>
                </Col>
                <Col width={LAST_COL_WIDTH}>
                  <Cell></Cell>
                </Col>
              </Row>
              <CellHeightContext value={36}>
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
  const renderQuery = () => {
    return (
      <PDFViewer
        showToolbar={true}
        style={{ width: "100%", height: "100vh", border: 0 }}
      >
        <ReportDoc></ReportDoc>
      </PDFViewer>
    );
  };

  return renderQuery();
};
