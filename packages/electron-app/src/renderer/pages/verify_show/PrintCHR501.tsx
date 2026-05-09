import { fetchCHR501Data } from "#renderer/api/printer";
import { resolveCHR501 } from "#shared/functions/chr501";
import { Print } from "@mui/icons-material";
import { Button, styled } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { createPortal } from "react-dom";
import { useParams } from "react-router";

export const StyledCol = styled("col")({});
export const StyledP = styled("p")({
  margin: 0,
  fontSize: "12pt",
  textAlign: "right",
});
export const StyledTr = styled("tr")({
  padding: "2pt",
});
export const StyledTable = styled("table")({
  tableLayout: "fixed",
  borderCollapse: "separate",

  width: "100%",
});
export const StyledTh = styled("th")({
  border: "1pt solid #000",
  borderWidth: "1pt 1pt 0 0",

  height: "22pt",

  padding: "2pt",
});
export const StyledTd = styled("td")({
  border: "1pt solid #000",
  borderWidth: "1pt 1pt 0 0",

  height: "22pt",
});
export const StyledImageTD = styled("td")({
  position: "relative",

  height: "144pt",
  padding: 0,
  border: "1pt solid #000",
  borderWidth: "1pt 1pt 0 0",

  overflow: "hidden",
});
export const StyledH1 = styled("h1")({
  fontSize: "16pt",
  fontWeight: 600,
});
export const StyledImage = styled("img")({
  position: "absolute",
  inset: 0,

  display: "block",
  width: "100%",
  height: "100%",

  // width: "calc((210mm - 28mm - 3pt) / 2)",
  // height: "143pt",
  // objectFit: "cover",
});

export const PrintCHR501 = () => {
  const params = useParams();
  const query = useQuery(fetchCHR501Data(params.id!));

  if (query.isPending) {
    return <div>加载中...</div>;
  }

  if (query.isError) {
    return <div>加载失败: {(query.error as Error).message}</div>;
  }

  const { record, corporation, datas, detectors, images } = query.data;
  const { detectorInfo, flawInfo } = resolveCHR501(datas, detectors);

  const zxNodes = record.szWHModel
    ?.split("")
    .join("@")
    .split("")
    .map((i, index) => {
      if (i === "@") {
        return <br key={index} />;
      }

      return i;
    });

  return (
    <>
      <Button
        startIcon={<Print />}
        variant="outlined"
        onClick={() => {
          window.print();
          //   void window.electron.ipcRenderer.invoke("print");
        }}
      >
        Print
      </Button>
      {createPortal(
        <article data-print-container>
          <section data-a4>
            <StyledP>辆货统-501</StyledP>
            <StyledH1>
              铁路货车轮轴多通道超声波自动探伤系统日常性能校验记录表
            </StyledH1>
            <StyledTable cellSpacing="0">
              <colgroup>
                <StyledCol sx={{ width: "80pt" }} />
                <col />
                <StyledCol sx={{ width: "80pt" }} />
                <col />
              </colgroup>
              <thead>
                <StyledTr sx={{ fontSize: "12pt" }}>
                  <th>单位名称</th>
                  <td className="underline underline-offset-3">
                    {corporation.Factory}
                  </td>
                  <th className="">检验时间</th>
                  <td className="underline underline-offset-3">
                    {dayjs(record.tmNow).format("YYYY年MM月DD日 HH:mm:ss")}
                  </td>
                </StyledTr>
              </thead>
            </StyledTable>
            <StyledTable
              cellSpacing="0"
              sx={{
                border: "1pt solid #000",
                borderWidth: "0 0 0 1pt",
              }}
            >
              <tbody>
                <StyledTr sx={{ fontSize: "12pt" }}>
                  <StyledTh>设备型号</StyledTh>
                  <StyledTd>{corporation.DeviceType}</StyledTd>
                  <StyledTh>设备编号</StyledTh>
                  <StyledTd>{corporation.DeviceNO}</StyledTd>
                  <StyledTh>实物试块型号</StyledTh>
                  <StyledTd>
                    {[record.szWHModel, record.szIDsWheel].join("_")}
                  </StyledTd>
                </StyledTr>
              </tbody>
            </StyledTable>
            <StyledTable
              cellSpacing="0"
              sx={{
                border: "1pt solid #000",
                borderWidth: "0 0 0 1pt",
              }}
            >
              <colgroup>
                <StyledCol sx={{ width: "28pt" }} />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
                <col
                  style={{ width: `calc((210mm - 28pt - 28mm - 1pt) / 10)` }}
                />
              </colgroup>
              <tbody>
                <StyledTr>
                  <StyledTh rowSpan={20}>
                    {zxNodes} <br />试 <br />样 <br />轴 <br />轮 <br />座{" "}
                    <br />人 <br />工 <br />缺 <br />陷 <br />编 <br />号
                  </StyledTh>
                  <StyledTh colSpan={5}>左轮座探头晶片编号及灵敏度</StyledTh>
                  <StyledTh colSpan={5}>右轮座探头晶片编号及灵敏度</StyledTh>
                </StyledTr>
                <StyledTr>
                  <StyledTh colSpan={2}>通道编号</StyledTh>
                  <StyledTh>左外</StyledTh>
                  <StyledTh>左内</StyledTh>
                  <StyledTh>左A3</StyledTh>
                  <StyledTh colSpan={2}>通道编号</StyledTh>
                  <StyledTh>右外</StyledTh>
                  <StyledTh>右内</StyledTh>
                  <StyledTh>右A3</StyledTh>
                </StyledTr>
                <StyledTr>
                  <StyledTh colSpan={2}>折射角（度）</StyledTh>
                  <StyledTh>{detectorInfo.get("0-3")?.zsj}</StyledTh>
                  <StyledTh>{detectorInfo.get("0-4")?.zsj}</StyledTh>
                  <StyledTh>{detectorInfo.get("0-2")?.zsj}</StyledTh>
                  <StyledTh colSpan={2}>折射角（度）</StyledTh>
                  <StyledTh>{detectorInfo.get("1-3")?.zsj}</StyledTh>
                  <StyledTh>{detectorInfo.get("1-4")?.zsj}</StyledTh>
                  <StyledTh>{detectorInfo.get("1-2")?.zsj}</StyledTh>
                </StyledTr>
                <StyledTr>
                  <StyledTh rowSpan={3}>灵敏度（dB）</StyledTh>
                  <StyledTh>校验（80%）</StyledTh>
                  <StyledTd>{detectorInfo.get("0-3")?.jy}</StyledTd>
                  <StyledTd>{detectorInfo.get("0-4")?.jy}</StyledTd>
                  <StyledTd>{detectorInfo.get("0-2")?.jy}</StyledTd>
                  <StyledTh rowSpan={3}>灵敏度（dB）</StyledTh>
                  <StyledTh>校验（80%）</StyledTh>
                  <StyledTd>{detectorInfo.get("1-3")?.jy}</StyledTd>
                  <StyledTd>{detectorInfo.get("1-4")?.jy}</StyledTd>
                  <StyledTd>{detectorInfo.get("1-2")?.jy}</StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledTh>补偿</StyledTh>
                  <StyledTd>{detectorInfo.get("0-3")?.bc}</StyledTd>
                  <StyledTd>{detectorInfo.get("0-4")?.bc}</StyledTd>
                  <StyledTd>{detectorInfo.get("0-2")?.bc}</StyledTd>
                  <StyledTh>补偿</StyledTh>
                  <StyledTd>{detectorInfo.get("1-3")?.bc}</StyledTd>
                  <StyledTd>{detectorInfo.get("1-4")?.bc}</StyledTd>
                  <StyledTd>{detectorInfo.get("1-2")?.bc}</StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledTh>探伤</StyledTh>
                  <StyledTd>{detectorInfo.get("0-3")?.ts}</StyledTd>
                  <StyledTd>{detectorInfo.get("0-4")?.ts}</StyledTd>
                  <StyledTd>{detectorInfo.get("0-2")?.ts}</StyledTd>
                  <StyledTh>探伤</StyledTh>
                  <StyledTd>{detectorInfo.get("1-3")?.ts}</StyledTd>
                  <StyledTd>{detectorInfo.get("1-4")?.ts}</StyledTd>
                  <StyledTd>{detectorInfo.get("1-2")?.ts}</StyledTd>
                </StyledTr>
                {Array.from({ length: 13 }, (_, index) => index + 1).map(
                  (item, index) => {
                    return (
                      <StyledTr key={index} className="*:text-[12pt]">
                        <StyledTh colSpan={2}>{item}</StyledTh>
                        <StyledTd>
                          {flawInfo.get("0-3")?.at(index)?.value}
                        </StyledTd>
                        <StyledTd>
                          {flawInfo.get("0-4")?.at(index)?.value}
                        </StyledTd>
                        <StyledTd></StyledTd>
                        <StyledTh colSpan={2}>{item}</StyledTh>
                        <StyledTd>
                          {flawInfo.get("1-3")?.at(index)?.value}
                        </StyledTd>
                        <StyledTd>
                          {flawInfo.get("1-4")?.at(index)?.value}
                        </StyledTd>
                        <StyledTd></StyledTd>
                      </StyledTr>
                    );
                  },
                )}
                <StyledTr>
                  <StyledTd colSpan={5} sx={{ padding: 0, border: 0 }}>
                    <StyledTable cellSpacing="0">
                      <colgroup>
                        <StyledCol sx={{ width: "22pt" }} />
                        <col />
                        <col />
                        <StyledCol sx={{ width: "36pt" }} />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                      </colgroup>
                      <tbody>
                        <StyledTr>
                          <StyledTh rowSpan={2}>左</StyledTh>
                          <StyledTh rowSpan={2}>通道编号</StyledTh>
                          <StyledTh rowSpan={2}>拆射角度</StyledTh>
                          <StyledTh colSpan={3}>灵敏度(dB)</StyledTh>
                          <StyledTh colSpan={3}>缺陷编号</StyledTh>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh>
                            校验
                            <br />
                            (80%)
                          </StyledTh>
                          <StyledTh>补偿</StyledTh>
                          <StyledTh>探伤</StyledTh>
                          <StyledTh>1</StyledTh>
                          <StyledTh>2</StyledTh>
                          <StyledTh>3</StyledTh>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh rowSpan={3} className="text-[12pt]">
                            轴
                            <br />颈
                          </StyledTh>
                          <StyledTh>CT</StyledTh>
                          <StyledTd>{detectorInfo.get("0-0")?.zsj}</StyledTd>
                          <StyledTd>{detectorInfo.get("0-0")?.jy}</StyledTd>
                          <StyledTd>{detectorInfo.get("0-0")?.bc}</StyledTd>
                          <StyledTd>{detectorInfo.get("0-0")?.ts}</StyledTd>
                          <StyledTd colSpan={3}>
                            {flawInfo.get("0-0")?.at(0)?.value}
                          </StyledTd>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh>
                            {detectorInfo
                              .get("0-1")
                              ?.place.replaceAll(
                                detectorInfo.get("0-1")?.direction || "",
                                "",
                              )
                              .replaceAll("0", "")}
                          </StyledTh>
                          <StyledTd>{detectorInfo.get("0-1")?.zsj}</StyledTd>
                          <StyledTd>{detectorInfo.get("0-1")?.jy}</StyledTd>
                          <StyledTd>{detectorInfo.get("0-1")?.bc}</StyledTd>
                          <StyledTd>{detectorInfo.get("0-1")?.ts}</StyledTd>
                          <StyledTd>
                            {flawInfo.get("0-1")?.at(0)?.value}
                          </StyledTd>
                          <StyledTd>
                            {flawInfo.get("0-1")?.at(1)?.value}
                          </StyledTd>
                          <StyledTd>
                            {flawInfo.get("0-1")?.at(2)?.value}
                          </StyledTd>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh></StyledTh>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                        </StyledTr>
                      </tbody>
                    </StyledTable>
                  </StyledTd>
                  <StyledTd colSpan={5} sx={{ padding: 0, border: 0 }}>
                    <StyledTable cellSpacing="0">
                      <colgroup>
                        <StyledCol sx={{ width: "22pt" }} />
                        <col />
                        <col />
                        <StyledCol sx={{ width: "36pt" }} />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                      </colgroup>
                      <tbody>
                        <StyledTr>
                          <StyledTh rowSpan={2}>右</StyledTh>
                          <StyledTh rowSpan={2}>通道编号</StyledTh>
                          <StyledTh rowSpan={2}>拆射角度</StyledTh>
                          <StyledTh colSpan={3}>灵敏度(dB)</StyledTh>
                          <StyledTh colSpan={3}>缺陷编号</StyledTh>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh>
                            校验
                            <br />
                            (80%)
                          </StyledTh>
                          <StyledTh>补偿</StyledTh>
                          <StyledTh>探伤</StyledTh>
                          <StyledTh>1</StyledTh>
                          <StyledTh>2</StyledTh>
                          <StyledTh>3</StyledTh>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh rowSpan={3} className="text-[12pt]">
                            轴
                            <br />颈
                          </StyledTh>
                          <StyledTh>CT</StyledTh>
                          <StyledTd>{detectorInfo.get("1-0")?.zsj}</StyledTd>
                          <StyledTd>{detectorInfo.get("1-0")?.jy}</StyledTd>
                          <StyledTd>{detectorInfo.get("1-0")?.bc}</StyledTd>
                          <StyledTd>{detectorInfo.get("1-0")?.ts}</StyledTd>
                          <StyledTd colSpan={3}>
                            {flawInfo.get("1-0")?.at(0)?.value}
                          </StyledTd>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh>
                            {detectorInfo
                              .get("1-1")
                              ?.place.replaceAll(
                                detectorInfo.get("1-1")?.direction || "",
                                "",
                              )
                              .replaceAll("0", "")}
                          </StyledTh>
                          <StyledTd>{detectorInfo.get("1-1")?.zsj}</StyledTd>
                          <StyledTd>{detectorInfo.get("1-1")?.jy}</StyledTd>
                          <StyledTd>{detectorInfo.get("1-1")?.bc}</StyledTd>
                          <StyledTd>{detectorInfo.get("1-1")?.ts}</StyledTd>
                          <StyledTd>
                            {flawInfo.get("1-1")?.at(0)?.value}
                          </StyledTd>
                          <StyledTd>
                            {flawInfo.get("1-1")?.at(1)?.value}
                          </StyledTd>
                          <StyledTd>
                            {flawInfo.get("1-1")?.at(2)?.value}
                          </StyledTd>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh></StyledTh>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                        </StyledTr>
                      </tbody>
                    </StyledTable>
                  </StyledTd>
                </StyledTr>
              </tbody>
            </StyledTable>
            <StyledTable
              cellSpacing="0"
              sx={{
                fontSize: "12pt",
                border: "1pt solid #000",
                borderWidth: "0 0 1pt 1pt",
              }}
            >
              <tbody>
                <StyledTr>
                  <StyledTh rowSpan={2}>签字签章</StyledTh>
                  <StyledTh>探伤工</StyledTh>
                  <StyledTd>{record.szUsername}</StyledTd>
                  <StyledTh>探伤工长</StyledTh>
                  <StyledTd></StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledTh>质检员</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTh>验收员</StyledTh>
                  <StyledTd></StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledTh sx={{ padding: "6pt" }}>备注</StyledTh>
                  <StyledTd colSpan={4} sx={{ padding: "6pt" }}></StyledTd>
                </StyledTr>
              </tbody>
            </StyledTable>
            <StyledP
              sx={{
                textAlign: "right",
                fontSize: "12pt",
              }}
            >
              第 1 页
            </StyledP>
          </section>
          <section data-a4>
            <StyledP
              sx={{
                textAlign: "right",
                fontSize: "12pt",
                margin: 0,
              }}
            >
              辆货统-501
            </StyledP>
            <StyledH1>
              铁路货车轮轴超声波自动探伤系统日常性能校验记录表（第2页）
            </StyledH1>
            <StyledTable
              cellSpacing="0"
              sx={{
                fontSize: "12pt",
              }}
            >
              <colgroup>
                <StyledCol sx={{ width: "80pt" }} />
                <col />
                <StyledCol sx={{ width: "80pt" }} />
                <col />
              </colgroup>
              <thead>
                <StyledTr className="text-[12pt]">
                  <th>样板轮型号</th>
                  <td className="underline underline-offset-3">
                    江岸车辆段武南轮厂轮轴车间
                  </td>
                  <th className="">校验时间</th>
                  <td className="underline underline-offset-3"></td>
                </StyledTr>
              </thead>
            </StyledTable>
            <StyledTable
              cellSpacing="0"
              sx={{ border: "1pt solid #000", borderWidth: "0 0 1pt 1pt" }}
            >
              <tbody>
                <StyledTr>
                  <StyledTd sx={{ fontSize: "12pt" }}>
                    左轴颈根部扫描图
                  </StyledTd>
                  <StyledTd sx={{ fontSize: "12pt" }}>
                    右轴颈根部扫描图
                  </StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledImageTD>
                    <StyledImage src={images.lxh} alt="左轴颈根部扫描图" />
                  </StyledImageTD>
                  <StyledImageTD>
                    <StyledImage src={images.rxh} alt="右轴颈根部扫描图" />
                  </StyledImageTD>
                </StyledTr>
                <StyledTr>
                  <StyledTd sx={{ fontSize: "12pt" }}>左轮座部扫描图</StyledTd>
                  <StyledTd sx={{ fontSize: "12pt" }}>右轮座部扫描图</StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledImageTD>
                    <StyledImage src={images.llz} alt="左轮座部扫描图" />
                  </StyledImageTD>
                  <StyledImageTD>
                    <StyledImage src={images.rlz} alt="右轮座部扫描图" />
                  </StyledImageTD>
                </StyledTr>
                <StyledTr>
                  <StyledTd colSpan={2} sx={{ fontSize: "12pt" }}>
                    左穿透扫描图
                  </StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledImageTD colSpan={2}>
                    <StyledImage
                      src={images.lct}
                      alt="左穿透扫描图"
                      sx={{
                        width: "calc(210mm - 28mm - 3pt)",
                      }}
                    />
                  </StyledImageTD>
                </StyledTr>
                <StyledTr>
                  <StyledTd colSpan={2} sx={{ fontSize: "12pt" }}>
                    右穿透扫描图
                  </StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledImageTD colSpan={2}>
                    <StyledImage
                      src={images.rct}
                      alt="右穿透扫描图"
                      sx={{
                        width: "calc(210mm - 28mm - 3pt)",
                      }}
                    />
                  </StyledImageTD>
                </StyledTr>
              </tbody>
            </StyledTable>
            <StyledP>第 2 页</StyledP>
          </section>
        </article>,
        document.body,
      )}
    </>
  );
};
