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

const TableHeader = () => (
  <View style={[styles.flexRow, styles.font12, styles.paddingB2]}>
    <View
      style={[
        styles.flex1,
        styles.flexRow,
        styles.itemsCenter,
        styles.justifyCenter,
        styles.gap12,
      ]}
    >
      <Text style={[styles.fontBold]}>单位名称</Text>
      <Text>江岸车辆段武南轮厂轮轴车间</Text>
    </View>
    <View
      style={[
        styles.flex1,
        styles.flexRow,
        styles.itemsCenter,
        styles.justifyCenter,
        styles.gap12,
      ]}
    >
      <Text style={[styles.fontBold]}>检验时间</Text>
      <Text>{dayjs().format("YYYY年MM月DD日 HH:mm:ss")}</Text>
    </View>
  </View>
);

const EquipmentTable = () => (
  <Row>
    <Col>
      <Cell l font12>
        设备型号
      </Cell>
    </Col>
    <Col>
      <Cell></Cell>
    </Col>
    <Col>
      <Cell font12>设备编号</Cell>
    </Col>
    <Col>
      <Cell font12>{null}</Cell>
    </Col>
    <Col>
      <Cell font12>实物试块型号</Cell>
    </Col>
    <Col>
      <Cell></Cell>
    </Col>
  </Row>
);

const LZInfoTable = () => {
  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);

  return (
    <>
      <Cell>左轮座探头晶片编号及灵敏度</Cell>
      <Row>
        <Col width={"40%"}>
          <Cell>通道编号</Cell>
        </Col>
        <Col>
          <Cell>左外</Cell>
        </Col>
        <Col>
          <Cell>左内</Cell>
        </Col>
        <Col>
          <Cell>左A3</Cell>
        </Col>
      </Row>
      <Row>
        <Col width={"40%"}>
          <Cell>折射角（度）</Cell>
        </Col>
        <Col>
          <Cell>51</Cell>
        </Col>
        <Col>
          <Cell>44</Cell>
        </Col>
        <Col>
          <Cell>22.5</Cell>
        </Col>
      </Row>
      <Row>
        <Col width={"40%"}>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 4}>灵敏度{"\n"}（dB）</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>校验{"\n"}（80%）</Cell>
              <Cell>补偿</Cell>
              <Cell>探伤</Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}></Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}></Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}></Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

const XHCTable = () => {
  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);

  return (
    <>
      <Row>
        <Col>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3}>左</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3}>通道{"\n"}编号</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3}>拆射{"\n"}角度</Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Cell>灵敏度(dB)</Cell>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>{"校验\n(80%)"}</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>补偿</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>探伤</Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Cell>缺陷编号</Cell>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>1</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>2</Cell>
            </Col>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 2}>3</Cell>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row>
        <Col>
          <Row>
            <Col>
              <Cell height={BASIC_ROW_HEIGHT * 3}>{"轴\n颈"}</Cell>
            </Col>
            <Col>
              <Cell>CT</Cell>
              <Cell>A1</Cell>
              <Cell>A2</Cell>
            </Col>
            <Col>
              <Cell>0</Cell>
              <Cell>225</Cell>
              <Cell>260</Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
          <Row>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
            <Col>
              <Cell></Cell>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

const SignatureTable = () => {
  const BASIC_ROW_HEIGHT = React.use(CellHeightContext);

  return (
    <View style={[styles.borderBL]}>
      <Row>
        <Col>
          <Cell height={BASIC_ROW_HEIGHT * 2}>签字签章</Cell>
        </Col>
        <Col>
          <Cell>探伤工</Cell>
          <Cell>质检员</Cell>
        </Col>
        <Col>
          <Cell></Cell>
          <Cell></Cell>
        </Col>
        <Col>
          <Cell>探伤工长</Cell>
          <Cell>验收员</Cell>
        </Col>
        <Col>
          <Cell></Cell>
          <Cell></Cell>
        </Col>
      </Row>
      <Row>
        <Col width={"20%"}>
          <Cell>备注</Cell>
        </Col>
        <Col>
          <Cell></Cell>
        </Col>
      </Row>
    </View>
  );
};

const ReportDoc = () => {
  const IMAGE_HEIGHT = 150;
  const of13 = of(13);

  return (
    <Document>
      {/* 第一页 */}
      <Page size="A4" style={[styles.page, styles.font10, styles.textCenter]}>
        <PageHeader>辆货统-501</PageHeader>
        <ReportTitle>
          铁路货车轮轴多通道超声波自动探伤系统日常性能校验记录表
        </ReportTitle>
        <TableHeader />
        <EquipmentTable />
        <View style={[styles.flexRow, styles.borderL]}>
          <View
            style={[
              styles.borderTR,
              styles.itemsCenter,
              styles.justifyCenter,
              styles.padding6,
            ]}
          >
            <Text>{"R\nD\n2\n试\n样\n轴\n轮\n座\n人\n工\n缺\n陷\n编\n号"}</Text>
          </View>
          {of(2).map((dir) => {
            return (
              <View key={dir} style={[styles.flex1]}>
                <LZInfoTable />
                {of13.map((no) => {
                  return (
                    <Row key={no}>
                      <Col width={"40%"}>
                        <Cell>{no}</Cell>
                      </Col>
                      <Col>
                        <Cell></Cell>
                      </Col>
                      <Col>
                        <Cell></Cell>
                      </Col>
                      <Col>
                        <Cell></Cell>
                      </Col>
                    </Row>
                  );
                })}
                <XHCTable />
              </View>
            );
          })}
        </View>
        <CellHeightContext value={26}>
          <SignatureTable />
        </CellHeightContext>
        <PageFooter>第 1 页</PageFooter>
      </Page>

      {/* 第二页 */}
      <Page size="A4" style={styles.page}>
        <PageHeader>辆货统-501</PageHeader>
        <ReportTitle>
          铁路货车轮轴超声波自动探伤系统日常性能校验记录表（第2页）
        </ReportTitle>
        <TableHeader />
        <View style={[styles.borderBL, styles.font12, styles.fontBold]}>
          <View style={[styles.flexRow]}>
            <View style={[styles.flex1, styles.borderTR, styles.padding2]}>
              <Text>左轴颈根部扫描图</Text>
            </View>
            <View style={[styles.flex1, styles.borderTR, styles.padding2]}>
              <Text>右轴颈根部扫描图</Text>
            </View>
          </View>
          <View style={[styles.flexRow, { height: IMAGE_HEIGHT }]}>
            <View style={[styles.flex1, styles.borderTR]} />
            <View style={[styles.flex1, styles.borderTR]} />
          </View>
          <View style={[styles.flexRow]}>
            <View style={[styles.flex1, styles.borderTR, styles.padding2]}>
              <Text>左轴颈根部扫描图</Text>
            </View>
            <View style={[styles.flex1, styles.borderTR, styles.padding2]}>
              <Text>右轴颈根部扫描图</Text>
            </View>
          </View>
          <View style={[styles.flexRow, { height: IMAGE_HEIGHT }]}>
            <View style={[styles.flex1, styles.borderTR]} />
            <View style={[styles.flex1, styles.borderTR]} />
          </View>
          <View style={[styles.borderTR, styles.padding2]}>
            <Text>左穿透扫描图</Text>
          </View>
          <View style={[styles.borderTR, { height: IMAGE_HEIGHT }]}></View>
          <View style={[styles.borderTR, styles.padding2]}>
            <Text>右穿透扫描图</Text>
          </View>
          <View style={[styles.borderTR, { height: IMAGE_HEIGHT }]}></View>
        </View>
        <PageFooter>第 2 页</PageFooter>
      </Page>
    </Document>
  );
};

export const Component = () => {
  return (
    <PDFViewer
      showToolbar={true}
      style={{ width: "100%", height: "100%", border: 0 }}
    >
      <ReportDoc />
    </PDFViewer>
  );
};
