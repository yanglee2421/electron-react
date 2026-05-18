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
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";
import React from "react";
import { useLocation } from "react-router";

export const Component = () => {
  const location = useLocation();
  const ids = location.state.ids;
  const CELL_HEIGHT = React.use(CellHeightContext);

  return (
    <PDFViewer showToolbar style={{ width: "100%", height: "100%", border: 0 }}>
      <Document
        title="CHR53A"
        creator="超声波自动探伤机"
        producer="武铁紫云接口面板"
      >
        <Page style={[styles.page]} size={"A4"}>
          <PageHeader>车统-53A</PageHeader>
          <View>
            <ReportTitle>
              铁路货车轮轴（轮对、车轴、车轮）超声波 探伤记录
            </ReportTitle>
            <View style={[styles.paddingB4]}>
              <Row>
                <Col width={128}>
                  <Text style={[styles.textLeft]}>单位名称:宁东铁路公司</Text>
                </Col>
                <Col>
                  <Text>探伤方法:微控超探</Text>
                </Col>
                <Col>
                  <Text>探伤性质:初探</Text>
                </Col>
                <Col>
                  <Text>探伤者:张三</Text>
                </Col>
                <Col width={60}>
                  <Text>{dayjs().format("YYYY-MM-DD")}</Text>
                </Col>
              </Row>
            </View>
            <View style={[styles.borderBL]}>
              <Row>
                <Col width={24}>
                  <Cell height={CELL_HEIGHT * 3}>{"序\n号"}</Cell>
                  {of(22).map((_) => (
                    <Cell key={_}>{_}</Cell>
                  ))}
                </Col>
                <Col width={34}>
                  <Cell height={CELL_HEIGHT * 3}>轴型</Cell>
                  {of(22).map((_) => (
                    <Cell key={_}>RE2B</Cell>
                  ))}
                </Col>
                <Col width={54}>
                  <Cell height={CELL_HEIGHT * 3}>轴号</Cell>
                  {of(22).map((_) => (
                    <Cell key={_}>12345678</Cell>
                  ))}
                </Col>
                <Col width={100}>
                  <Cell height={CELL_HEIGHT * 2}>轮对首次组装</Cell>
                  <Row>
                    <Col width={64}>
                      <Cell>时间</Cell>
                      {of(22).map((_) => (
                        <Cell key={_}>{dayjs().format("YYYY-MM-DD")}</Cell>
                      ))}
                    </Col>
                    <Col>
                      <Cell>单位</Cell>
                      {of(22).map((_) => (
                        <Cell key={_}>123</Cell>
                      ))}
                    </Col>
                  </Row>
                </Col>
                <Col>
                  <Cell>探测部位</Cell>
                  <Row>
                    {of(3).map((_) => (
                      <Col key={_}>
                        <Cell>{_}</Cell>
                        <Row>
                          {of(2).map((_) => (
                            <Col key={_}>
                              <Cell>{_ % 2 !== 0 ? "左" : "右"}</Cell>
                              {of(22).map((_) => (
                                <Cell key={_} text={false}>
                                  <CheckOK />
                                </Cell>
                              ))}
                            </Col>
                          ))}
                        </Row>
                      </Col>
                    ))}
                  </Row>
                </Col>
                <Col width={40}>
                  <Cell height={CELL_HEIGHT * 3}>{"探测\n结果"}</Cell>
                  {of(22).map((_) => (
                    <Cell key={_}>不合格</Cell>
                  ))}
                </Col>
                <Col width={60}>
                  <Cell height={CELL_HEIGHT * 3}>备注</Cell>
                  {of(22).map((_) => (
                    <Cell key={_}>待复验</Cell>
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
          <PageFooter center>1页/1页</PageFooter>
        </Page>
      </Document>
    </PDFViewer>
  );
};
