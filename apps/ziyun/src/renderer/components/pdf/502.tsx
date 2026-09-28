import { Cell, Col, Row } from "#renderer/components/pdf";
import { PDFViewer } from "@react-pdf/renderer";
import dayjs from "dayjs";

export const CHR502 = () => {
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
        chName0={renderChName(0)}
        chName1={renderChName(1)}
        chName2={renderChName(2)}
        chName3={renderChName(3)}
        chName4={renderChName(4)}
      >
        <Col>
          <Cell>反射波高(dB)</Cell>
          <Row>
            {metas.map(({ row, meta }, index) => {
              return (
                <Col key={row.szIds}>
                  <Cell>{`第${index + 1}次`}</Cell>
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
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.lxh))}</Cell>
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.la3))}</Cell>
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.l01))}</Cell>
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.l02))}</Cell>
                  {of10.map((_) => (
                    <Cell key={_}></Cell>
                  ))}
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.lct))}</Cell>
                </Col>
                <Col>
                  <Cell>右</Cell>
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.rxh))}</Cell>
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.ra3))}</Cell>
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.r01))}</Cell>
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.r02))}</Cell>
                  {of10.map((_) => (
                    <Cell key={_}></Cell>
                  ))}
                  <Cell>{calcMaxDiff(metas.map(({ meta }) => meta.rct))}</Cell>
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
