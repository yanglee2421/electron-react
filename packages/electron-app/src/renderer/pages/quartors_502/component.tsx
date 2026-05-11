import { of } from "#shared/functions/array";
import { CellHeightContext, cn, styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";
import React from "react";

const Row = (props: React.PropsWithChildren) => {
  return <View style={[styles.flexRow]}>{props.children}</View>;
};

interface ColProps {
  children?: React.ReactNode;
  width?: number | string;
}

const Col = (props: ColProps) => {
  const { width } = props;

  return (
    <View style={[width ? { width } : styles.flex1]}>{props.children}</View>
  );
};

const resolveCellHeight = (contextHeight: number, propsHeight?: number) => {
  if (typeof propsHeight === "number") {
    return propsHeight;
  }
  return contextHeight;
};

interface CellProps {
  children?: React.ReactNode;
  tr?: boolean;
  bl?: boolean;
  t?: boolean;
  r?: boolean;
  b?: boolean;
  l?: boolean;
  font12?: boolean;
  height?: number;
}

const Cell = (props: CellProps) => {
  const { height: propsHeight, tr = true, bl, t, r, b, l, font12 } = props;

  const cellHeight = React.use(CellHeightContext);
  const height = resolveCellHeight(cellHeight, propsHeight);

  return (
    <View
      style={cn(
        styles.itemsCenter,
        styles.justifyCenter,
        tr && styles.borderTR,
        bl && styles.borderBL,
        t && styles.borderT,
        r && styles.borderR,
        b && styles.borderB,
        l && styles.borderL,
        font12 ? styles.font12 : styles.font10,
        { height },
      )}
    >
      <Text>{props.children}</Text>
    </View>
  );
};

const PageHeader = (props: React.PropsWithChildren) => {
  return (
    <View>
      <Text style={[styles.font12, styles.textRight]}>{props.children}</Text>
    </View>
  );
};

const PageFooter = (props: React.PropsWithChildren) => {
  return (
    <View style={[styles.paddingT8]}>
      <Text style={[styles.textRight, styles.font12]}>{props.children}</Text>
    </View>
  );
};

const ReportTitle = (props: React.PropsWithChildren) => {
  return (
    <View style={[styles.paddingY8]}>
      <Text style={[styles.font16, styles.fontBold]}>{props.children}</Text>
    </View>
  );
};

interface TableHeaderProps {}

const TableHeader = ({}: TableHeaderProps) => (
  <Row>
    <Col>
      <Cell>单位名称:</Cell>
    </Col>
    <Col>
      <Cell>宁东铁路公司</Cell>
    </Col>
    <Col>
      <Cell>RE2B</Cell>
    </Col>
    <Col>
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
      <Col>
        <Cell>设备编号</Cell>
      </Col>
      <Col>
        <Cell>{props.deviceNo}</Cell>
      </Col>
      <Col>
        <Cell>制造时间</Cell>
      </Col>
      <Col>
        <Cell>{props.deviceNo}</Cell>
      </Col>
      <Col>
        <Cell>制造单位</Cell>
      </Col>
      <Col>
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
        <Col>
          <Cell height={BASIC_ROW_HEIGHT * 2} font12>
            {"参加\n人员\n签章"}
          </Cell>
        </Col>
        <Col>
          <Cell font12>探伤工</Cell>
          <Cell font12>质检员</Cell>
        </Col>
        <Col>
          <Cell font12>{tsg}</Cell>
          <Cell font12></Cell>
        </Col>
        <Col>
          <Cell font12>探伤工长</Cell>
          <Cell font12>验收员</Cell>
        </Col>
        <Col>
          <Cell font12></Cell>
          <Cell font12></Cell>
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
  const CELL_HEIGHT = React.use(CellHeightContext);
  const RESULT_COL_WIDTH = 50;
  const CHANNEL_COL_WIDTH = 100;

  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.font10, styles.textCenter]}>
        <PageHeader>辆货统-502</PageHeader>
        <ReportTitle>
          铁路货车轮轴B/C型显示超声波自动探伤系统季度性能校验记录
        </ReportTitle>
        <View>
          <TableHeader />
          <EquipmentTable />
          <Row>
            <Col width={CHANNEL_COL_WIDTH}>
              <Cell height={CELL_HEIGHT * 3}>通道</Cell>
            </Col>
            <Col>
              <Row>
                <Col>
                  <Cell>反射波高（dB)</Cell>
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
            <Col width={RESULT_COL_WIDTH}>
              <Cell></Cell>
              <Cell>结果评定</Cell>
              <Cell></Cell>
            </Col>
          </Row>
          <Row>
            <Col width={CHANNEL_COL_WIDTH}>
              <Row>
                <Col>
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
            <Col width={RESULT_COL_WIDTH}>
              <Cell></Cell>
              <Cell>合格</Cell>
            </Col>
          </Row>
          <Row>
            <Col width={CHANNEL_COL_WIDTH}>
              <Row>
                <Col>
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
            <Col width={RESULT_COL_WIDTH}>
              {of(12).map((count) => {
                return <Cell key={count}></Cell>;
              })}
            </Col>
          </Row>
          <Row>
            <Col width={CHANNEL_COL_WIDTH}>
              <Row>
                <Col>
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
            <Col width={RESULT_COL_WIDTH}>
              <Cell></Cell>
            </Col>
          </Row>
          <CellHeightContext value={26}>
            <SignatureTable tsg="张三丰" />
          </CellHeightContext>
        </View>
        <Text style={[styles.font12]}>
          注：最大差值(ΔdB)是指五次波幅测量值中最大值与最小值之差，要求ΔdB≤6dB。
        </Text>
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
