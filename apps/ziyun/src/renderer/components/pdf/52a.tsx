import {
  Cell,
  Col,
  PageFooter,
  PageHeader,
  ReportImage,
  ReportTitle,
  Row,
} from "#renderer/components/pdf";
import { CellHeightContext, styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";

export const CHR502 = () => {
  return (
    <PDFViewer
      showToolbar
      style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
    >
      <Document
        title="CHR52A"
        creator="超声波自动探伤机"
        producer="武铁紫云接口面板"
      >
        <Page size="A4" style={[styles.page]}>
          <PageHeader>车统-52A1</PageHeader>
          <View>
            <ReportTitle>铁路货车轮轴超声自动探伤发现缺陷记录</ReportTitle>
            <View style={[styles.paddingB4]}>
              <Row>
                <Col>
                  <Text style={[styles.font12, styles.textLeft]}>
                    单位名称: {FACTORY_CLD}
                  </Text>
                </Col>
                <Col>
                  <Text style={[styles.font12, styles.textRight]}>
                    日期: {dayjs(record.tmNow).format("YYYY-MM-DD HH:mm:ss")}
                  </Text>
                </Col>
              </Row>
            </View>
            <View style={[styles.borderBL]}>
              <Row>
                <Col>
                  <Cell>轴型</Cell>
                </Col>
                <Col>
                  <Cell>{record.szWhModel}</Cell>
                </Col>
                <Col>
                  <Cell>轴号</Cell>
                </Col>
                <Col>
                  <Cell>{record.szZh}</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造日期</Cell>
                </Col>
                <Col>
                  <Cell>{record.szTmMake}</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造单位</Cell>
                </Col>
                <Col>
                  <Cell>{record.szIdsMake}</Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell>轮对首次组装日期</Cell>
                  <Cell>轮对末次组装日期</Cell>
                </Col>
                <Col>
                  <Cell>{record.szTmFirst}</Cell>
                  <Cell>{record.szTmLast}</Cell>
                </Col>
                <Col>
                  <Cell>轮对首次组装单位</Cell>
                  <Cell>轮对末次组装单位</Cell>
                </Col>
                <Col>
                  <Cell>{record.szIdsFirst}</Cell>
                  <Cell>{record.szIdsLast}</Cell>
                </Col>
              </Row>
              <Cell>缺陷描述</Cell>
              <Row>
                <Col width={24}>
                  <Cell height={CELL_HEIGHT * 19}>
                    {"故障位置及性质".split("").join("\n")}
                  </Cell>
                </Col>
                <Col width={96}>
                  <Cell>探头编号</Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`0-0`) + `: ` + renderFlawCount(0, 0)}
                  </Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`0-1`) + `: ` + renderFlawCount(0, 1)}
                  </Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`0-2`) + `: ` + renderFlawCount(0, 2)}
                  </Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`0-3`) + `: ` + renderFlawCount(0, 3)}
                  </Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`0-4`) + `: ` + renderFlawCount(0, 4)}
                  </Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                  <Cell center={false} pl>
                    {chNameMap.get(`1-0`) + `: ` + renderFlawCount(1, 0)}
                  </Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`1-1`) + `: ` + renderFlawCount(1, 1)}
                  </Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`1-2`) + `: ` + renderFlawCount(1, 2)}
                  </Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`1-3`) + `: ` + renderFlawCount(1, 3)}
                  </Cell>
                  <Cell center={false} pl>
                    {chNameMap.get(`1-4`) + `: ` + renderFlawCount(1, 4)}
                  </Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                </Col>
                <FlawGroupContext value={flawGroup}>
                  <MemoInfoContext value={memoInfo}>
                    <Col>
                      <Cell>缺陷数量及位置</Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={0} channel={0} />
                      </Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={0} channel={1} />
                      </Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={0} channel={2} />
                      </Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={0} channel={3} />
                      </Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={0} channel={4} />
                      </Cell>
                      {of(4).map((_) => {
                        return <Cell key={_}></Cell>;
                      })}
                      <Cell center={false} pl>
                        <ChannelFlaws board={1} channel={0} />
                      </Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={1} channel={1} />
                      </Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={1} channel={2} />
                      </Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={1} channel={3} />
                      </Cell>
                      <Cell center={false} pl>
                        <ChannelFlaws board={1} channel={4} />
                      </Cell>
                      {of(4).map((_) => {
                        return <Cell key={_}></Cell>;
                      })}
                    </Col>
                  </MemoInfoContext>
                </FlawGroupContext>
                <Col width={64}>
                  <Cell>缺陷类型</Cell>
                  <Cell>{calcFlawType(memoInfo.get("0-0"))}</Cell>
                  <Cell>{calcFlawType(memoInfo.get("0-1"))}</Cell>
                  <Cell>{calcFlawType(memoInfo.get("0-2"))}</Cell>
                  <Cell>{calcFlawType(memoInfo.get("0-3"))}</Cell>
                  <Cell>{calcFlawType(memoInfo.get("0-4"))}</Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                  <Cell>{calcFlawType(memoInfo.get("1-0"))}</Cell>
                  <Cell>{calcFlawType(memoInfo.get("1-1"))}</Cell>
                  <Cell>{calcFlawType(memoInfo.get("1-2"))}</Cell>
                  <Cell>{calcFlawType(memoInfo.get("1-3"))}</Cell>
                  <Cell>{calcFlawType(memoInfo.get("1-4"))}</Cell>
                  {of(4).map((_) => {
                    return <Cell key={_}></Cell>;
                  })}
                </Col>
              </Row>
              <Row>
                <Col width={56}>
                  <Cell height={100}>处理方法</Cell>
                  <Cell height={40}>探伤工</Cell>
                </Col>
                <Col>
                  <Cell height={100} center={false} pl pr>
                    <NoteCell record={record} datas={datas} />
                  </Cell>
                  <CellHeightContext value={40}>
                    <Row>
                      <Col>
                        <Cell></Cell>
                      </Col>
                      <Col>
                        <Cell>探伤工长</Cell>
                      </Col>
                      <Col>
                        <Cell></Cell>
                      </Col>
                      <Col>
                        <Cell>质检员</Cell>
                      </Col>
                      <Col>
                        <Cell></Cell>
                      </Col>
                      <Col>
                        <Cell>验收员</Cell>
                      </Col>
                      <Col>
                        <Cell></Cell>
                      </Col>
                    </Row>
                  </CellHeightContext>
                </Col>
              </Row>
            </View>
          </View>
          <PageFooter>第一页</PageFooter>
        </Page>
        <Page size="A4" style={[styles.page]}>
          <PageHeader>车统-52A1</PageHeader>
          <View>
            <ReportTitle>
              铁路货车轮轴超声自动探伤发现缺陷记录（第二页）
            </ReportTitle>
            <View style={[styles.paddingB4]}>
              <Row>
                <Col>
                  <Text style={[styles.font12]}>单位名称: {FACTORY_CLD}</Text>
                </Col>
                <Col>
                  <Text style={[styles.font12]}>
                    日期: {dayjs().format("YYYY-MM-DD HH:mm:ss")}
                  </Text>
                </Col>
              </Row>
            </View>
            <View style={[styles.borderBL]}>
              <Row>
                <Col>
                  <Cell>轴型</Cell>
                </Col>
                <Col>
                  <Cell>{record.szWhModel}</Cell>
                </Col>
                <Col>
                  <Cell>轴号</Cell>
                </Col>
                <Col>
                  <Cell>{record.szZh}</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造日期</Cell>
                </Col>
                <Col>
                  <Cell>{record.szTmMake}</Cell>
                </Col>
                <Col>
                  <Cell>车轴制造单位</Cell>
                </Col>
                <Col>
                  <Cell>{record.szIdsMake}</Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell>轮对首次组装日期</Cell>
                  <Cell>轮对末次组装日期</Cell>
                </Col>
                <Col>
                  <Cell>{record.szTmFirst}</Cell>
                  <Cell>{record.szTmLast}</Cell>
                </Col>
                <Col>
                  <Cell>轮对首次组装单位</Cell>
                  <Cell>轮对末次组装单位</Cell>
                </Col>
                <Col>
                  <Cell>{record.szIdsFirst}</Cell>
                  <Cell>{record.szIdsLast}</Cell>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell font12>左轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={jpegs.lxh} height={IMAGE_HEIGHT} />
                  </View>
                  <Cell font12>左轮座扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={jpegs.llz} height={IMAGE_HEIGHT} />
                  </View>
                </Col>
                <Col>
                  <Cell font12>右轴颈根部扫描图</Cell>
                  <View style={[styles.borderTR]}>
                    <ReportImage src={jpegs.rxh} height={IMAGE_HEIGHT} />
                  </View>
                  <Cell font12>右轮座扫描图</Cell>
                  <View style={[styles.flex1, styles.borderTR]}>
                    <ReportImage src={jpegs.rlz} height={IMAGE_HEIGHT} />
                  </View>
                </Col>
              </Row>
              <Cell font12>左穿透扫描图</Cell>
              <View style={[styles.borderTR]}>
                <ReportImage src={jpegs.lct} height={IMAGE_HEIGHT} />
              </View>
              <Cell font12>右穿透扫描图</Cell>
              <View style={[styles.borderTR]}>
                <ReportImage src={jpegs.rct} height={IMAGE_HEIGHT} />
              </View>
            </View>
          </View>
          <PageFooter>第二页</PageFooter>
        </Page>
      </Document>
    </PDFViewer>
  );
};
