import { Print } from "@mui/icons-material";
import { Button, styled } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useParams } from "react-router";

const StyledCol = styled("col")({});
const StyledP = styled("p")({
  margin: 0,
  fontSize: "12pt",
  textAlign: "right",
});
const StyledTr = styled("tr")({
  padding: "2pt",
});
const StyledTable = styled("table")({
  tableLayout: "fixed",
  borderCollapse: "separate",

  width: "100%",
});
const StyledTh = styled("th")({
  border: "1px solid #000",
  borderWidth: "1px 1px 0 0",

  height: "22pt",

  padding: "2pt",
});
const StyledTd = styled("td")({
  border: "1px solid #000",
  borderWidth: "1px 1px 0 0",

  height: "22pt",
});
const StyledImageTD = styled("td")({
  height: "144pt",

  padding: 0,

  border: "1px solid #000",
  borderWidth: "1px 1px 0 0",
});
const StyledH1 = styled("h1")({
  fontSize: "16pt",
  fontWeight: 600,
});

export const PrintCHR501 = () => {
  const date = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const params = useParams();

  const query = useQuery({
    queryKey: ["print-chr-501", params.id],
    queryFn: async () => {},
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
                    江岸车辆段武南轮厂轮轴车间
                  </td>
                  <th className="">检验时间</th>
                  <td className="underline underline-offset-3">{date}</td>
                </StyledTr>
              </thead>
            </StyledTable>
            <StyledTable
              cellSpacing="0"
              sx={{
                border: "1px solid #000",
                borderWidth: "0 0 0 1px",
              }}
            >
              <tbody>
                <StyledTr sx={{ fontSize: "12pt" }}>
                  <StyledTh>设备型号</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTh>设备编号</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTh>实物试块型号</StyledTh>
                  <StyledTd></StyledTd>
                </StyledTr>
              </tbody>
            </StyledTable>
            <StyledTable
              cellSpacing="0"
              sx={{
                border: "1px solid #000",
                borderWidth: "0 0 0 1px",
              }}
            >
              <colgroup>
                <StyledCol sx={{ width: "28pt" }} />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <tbody>
                <StyledTr>
                  <StyledTh rowSpan={20}>
                    R
                    <br />D <br />2 <br />试 <br />样 <br />轴 <br />轮 <br />座{" "}
                    <br />人 <br />工 <br />缺 <br />陷 <br />编 <br />号
                  </StyledTh>
                  <StyledTh colSpan={5}>左轮座探头晶片编号及灵敏度</StyledTh>
                  <StyledTh colSpan={5}>右轮座探头晶片编号及灵敏度</StyledTh>
                </StyledTr>
                <StyledTr>
                  <StyledTh colSpan={2}>通道编号</StyledTh>
                  <StyledTh>左外</StyledTh>
                  <StyledTh>左内</StyledTh>
                  <StyledTh>左A1(A2)</StyledTh>
                  <StyledTh colSpan={2}>通道编号</StyledTh>
                  <StyledTh>右外</StyledTh>
                  <StyledTh>右内</StyledTh>
                  <StyledTh>右A1(A2)</StyledTh>
                </StyledTr>
                <StyledTr>
                  <StyledTh colSpan={2}>折射角（度）</StyledTh>
                  <StyledTh>51</StyledTh>
                  <StyledTh>44</StyledTh>
                  <StyledTh>22.5</StyledTh>
                  <StyledTh colSpan={2}>折射角（度）</StyledTh>
                  <StyledTh>51</StyledTh>
                  <StyledTh>44</StyledTh>
                  <StyledTh>22.5</StyledTh>
                </StyledTr>
                <StyledTr>
                  <StyledTh rowSpan={3}>灵敏度（dB）</StyledTh>
                  <StyledTh>校验（80%）</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTh rowSpan={3}>灵敏度（dB）</StyledTh>
                  <StyledTh>校验（80%）</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledTh>补偿</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTh>补偿</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledTh>探伤</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTh>探伤</StyledTh>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTd></StyledTd>
                </StyledTr>
                {Array.from({ length: 13 }, (_, index) => index + 1).map(
                  (item) => {
                    return (
                      <StyledTr key={item} className="*:text-[12pt]">
                        <StyledTh colSpan={2}>{item}</StyledTh>
                        <StyledTd></StyledTd>
                        <StyledTd></StyledTd>
                        <StyledTd></StyledTd>
                        <StyledTh colSpan={2}>{item}</StyledTh>
                        <StyledTd></StyledTd>
                        <StyledTd></StyledTd>
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
                        <col />
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
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd colSpan={3}></StyledTd>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh>A1</StyledTh>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh>A2</StyledTh>
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
                        <col />
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
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd colSpan={3}></StyledTd>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh>A1</StyledTh>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                          <StyledTd></StyledTd>
                        </StyledTr>
                        <StyledTr>
                          <StyledTh>A2</StyledTh>
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
                border: "1px solid #000",
                borderWidth: "0 0 1px 1px",
              }}
            >
              <tbody>
                <StyledTr>
                  <StyledTh rowSpan={2}>签字签章</StyledTh>
                  <StyledTh>探伤工</StyledTh>
                  <StyledTd></StyledTd>
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
                  <td className="underline underline-offset-3">{date}</td>
                </StyledTr>
              </thead>
            </StyledTable>
            <StyledTable
              cellSpacing="0"
              sx={{ border: "1px solid #000", borderWidth: "0 0 1px 1px" }}
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
                  <StyledImageTD></StyledImageTD>
                  <StyledImageTD></StyledImageTD>
                </StyledTr>
                <StyledTr>
                  <StyledTd sx={{ fontSize: "12pt" }}>
                    左轴颈根部扫描图
                  </StyledTd>
                  <StyledTd sx={{ fontSize: "12pt" }}>
                    右轴颈根部扫描图
                  </StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledImageTD></StyledImageTD>
                  <StyledImageTD></StyledImageTD>
                </StyledTr>
                <StyledTr>
                  <StyledTd colSpan={2} sx={{ fontSize: "12pt" }}>
                    左穿透扫描图
                  </StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledImageTD colSpan={2}></StyledImageTD>
                </StyledTr>
                <StyledTr>
                  <StyledTd colSpan={2} sx={{ fontSize: "12pt" }}>
                    右穿透扫描图
                  </StyledTd>
                </StyledTr>
                <StyledTr>
                  <StyledImageTD colSpan={2}></StyledImageTD>
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
