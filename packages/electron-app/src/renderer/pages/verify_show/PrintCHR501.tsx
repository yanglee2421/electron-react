import { Print } from "@mui/icons-material";
import { Button } from "@mui/material";
import { createPortal } from "react-dom";
import styles from "./style.module.css";

export const PrintCHR501 = () => {
  const date = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
        <>
          <article id="print" className={styles.hidden}>
            <section data-a4>
              <p className="text-end text-[12pt]">辆货统-501</p>
              <h1 data-caption>
                铁路货车轮轴多通道超声波自动探伤系统日常性能校验记录表
              </h1>
              <p>&nbsp;</p>
              <table cellSpacing="0">
                <colgroup>
                  <col className="w-[80pt]" />
                  <col />
                  <col className="w-[80pt]" />
                  <col />
                </colgroup>
                <thead>
                  <tr className="text-[12pt]">
                    <th>单位名称</th>
                    <td className="underline underline-offset-3">
                      江岸车辆段武南轮厂轮轴车间
                    </td>
                    <th className="">检验时间</th>
                    <td className="underline underline-offset-3">{date}</td>
                  </tr>
                </thead>
              </table>
              <table cellSpacing="0">
                <thead>
                  <tr>
                    <td colSpan={11}>
                      <table cellSpacing="0">
                        <tbody>
                          <tr className="*:text-[12pt]">
                            <th>设备型号</th>
                            <td></td>
                            <th>设备编号</th>
                            <td></td>
                            <th>实物试块型号</th>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th rowSpan={20}>
                      R
                      <br />D <br />2 <br />试 <br />样 <br />轴 <br />轮 <br />
                      座 <br />人 <br />工 <br />缺 <br />陷 <br />编 <br />号
                    </th>
                    <th colSpan={5}>左轮座探头晶片编号及灵敏度</th>
                    <th colSpan={5}>右轮座探头晶片编号及灵敏度</th>
                  </tr>
                  <tr>
                    <th colSpan={2}>通道编号</th>
                    <th>左外</th>
                    <th>左内</th>
                    <th>左A1(A2)</th>
                    <th colSpan={2}>通道编号</th>
                    <th>右外</th>
                    <th>右内</th>
                    <th>右A1(A2)</th>
                  </tr>
                  <tr>
                    <th colSpan={2}>折射角（度）</th>
                    <th>51</th>
                    <th>44</th>
                    <th>22.5</th>
                    <th colSpan={2}>折射角（度）</th>
                    <th>51</th>
                    <th>44</th>
                    <th>22.5</th>
                  </tr>
                  <tr>
                    <th rowSpan={3}>灵敏度（dB）</th>
                    <th>校验（80%）</th>
                    <td></td>
                    <td></td>
                    <td></td>
                    <th rowSpan={3}>灵敏度（dB）</th>
                    <th>校验（80%）</th>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <th>补偿</th>
                    <td></td>
                    <td></td>
                    <td></td>
                    <th>补偿</th>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <th>探伤</th>
                    <td></td>
                    <td></td>
                    <td></td>
                    <th>探伤</th>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  {Array.from({ length: 13 }, (_, index) => index + 1).map(
                    (item) => {
                      return (
                        <tr key={item} className="*:text-[12pt]">
                          <th colSpan={2}>{item}</th>
                          <td></td>
                          <td></td>
                          <td></td>
                          <th colSpan={2}>{item}</th>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      );
                    },
                  )}
                  <tr>
                    <td colSpan={5}>
                      <table cellSpacing="0">
                        <tbody>
                          <tr>
                            <th rowSpan={2}>左</th>
                            <th rowSpan={2}>通道编号</th>
                            <th rowSpan={2}>拆射角度</th>
                            <th colSpan={3}>灵敏度(dB)</th>
                            <th colSpan={3}>缺陷编号</th>
                          </tr>
                          <tr>
                            <th>
                              校验
                              <br />
                              (80%)
                            </th>
                            <th>补偿</th>
                            <th>探伤</th>
                            <th>1</th>
                            <th>2</th>
                            <th>3</th>
                          </tr>
                          <tr>
                            <th rowSpan={3} className="text-[12pt]">
                              轴
                              <br />颈
                            </th>
                            <th>CT</th>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td colSpan={3}></td>
                          </tr>
                          <tr>
                            <th>A1</th>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                          <tr>
                            <th>A2</th>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td colSpan={5}>
                      <table cellSpacing="0">
                        <tbody>
                          <tr>
                            <th rowSpan={2}>右</th>
                            <th rowSpan={2}>通道编号</th>
                            <th rowSpan={2}>拆射角度</th>
                            <th colSpan={3}>灵敏度(dB)</th>
                            <th colSpan={3}>缺陷编号</th>
                          </tr>
                          <tr>
                            <th>
                              校验
                              <br />
                              (80%)
                            </th>
                            <th>补偿</th>
                            <th>探伤</th>
                            <th>1</th>
                            <th>2</th>
                            <th>3</th>
                          </tr>
                          <tr>
                            <th rowSpan={3} className="text-[12pt]">
                              轴
                              <br />颈
                            </th>
                            <th>CT</th>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td colSpan={3}></td>
                          </tr>
                          <tr>
                            <th>A1</th>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                          <tr>
                            <th>A2</th>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={11}>
                      <table className="text-[12pt]" cellSpacing="0">
                        <tbody>
                          <tr>
                            <th rowSpan={2}>签字签章</th>
                            <th>探伤工</th>
                            <td></td>
                            <th>探伤工长</th>
                            <td></td>
                          </tr>
                          <tr>
                            <th>质检员</th>
                            <td></td>
                            <th>验收员</th>
                            <td></td>
                          </tr>
                          <tr>
                            <th>备注</th>
                            <td colSpan={4}></td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="mt-6 text-end text-[12pt]">第 1 页</p>
            </section>
            <section data-a4>
              <p className="text-end text-[12pt]">辆货统-501</p>
              <h1 data-caption="">
                铁路货车轮轴超声波自动探伤系统日常性能校验记录表（第2页）
              </h1>
              <p>&nbsp;</p>
              <table cellSpacing="0" className="text-[12pt]">
                <colgroup>
                  <col className="w-[80pt]" />
                  <col />
                  <col className="w-[80pt]" />
                  <col />
                </colgroup>
                <thead>
                  <tr className="text-[12pt]">
                    <th>样板轮型号</th>
                    <td className="underline underline-offset-3">
                      江岸车辆段武南轮厂轮轴车间
                    </td>
                    <th className="">校验时间</th>
                    <td className="underline underline-offset-3">{date}</td>
                  </tr>
                </thead>
              </table>
              <table cellSpacing="0">
                <tbody>
                  <tr>
                    <td className="p-0! text-[12pt]">左轴颈根部扫描图</td>
                    <td className="p-0! text-[12pt]">右轴颈根部扫描图</td>
                  </tr>
                  <tr>
                    <td className="h-[150pt] p-0!"></td>
                    <td className="h-[150pt] p-0!"></td>
                  </tr>
                  <tr>
                    <td className="p-0! text-[12pt]">左轴颈根部扫描图</td>
                    <td className="p-0! text-[12pt]">右轴颈根部扫描图</td>
                  </tr>
                  <tr>
                    <td className="h-[150pt] p-0!"></td>
                    <td className="h-[150pt] p-0!"></td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="p-0! text-[12pt]">
                      左穿透扫描图
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="h-[150pt] p-0!"></td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="p-0! text-[12pt]">
                      右穿透扫描图
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="h-[150pt] p-0!"></td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-6 text-end text-[12pt]">第 2 页</p>
            </section>
          </article>
        </>,
        document.body,
      )}
    </>
  );
};
