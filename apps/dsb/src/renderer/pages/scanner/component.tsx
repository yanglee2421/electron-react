import innerImage1 from "#renderer/assets/images/1-inner.jpg";
import outImage1 from "#renderer/assets/images/1-outter.jpg";
import innerImage2 from "#renderer/assets/images/2-inner.jpg";
import outImage2 from "#renderer/assets/images/2-outter.jpg";
import innerImage3 from "#renderer/assets/images/3-inner.jpg";
import outImage3 from "#renderer/assets/images/3-outter.jpg";
import innerImage4 from "#renderer/assets/images/4-inner.jpg";
import outImage4 from "#renderer/assets/images/4-outter.jpg";
import innerImage5 from "#renderer/assets/images/5-inner.jpg";
import outImage5 from "#renderer/assets/images/5-outter.jpg";
import innerImage6 from "#renderer/assets/images/6-inner.jpg";
import outImage6 from "#renderer/assets/images/6-outter.jpg";
import innerImage7 from "#renderer/assets/images/7-inner.jpg";
import outImage7 from "#renderer/assets/images/7-outter.jpg";
import customer from "#renderer/assets/images/customer.jpg";
import officeInner from "#renderer/assets/images/office-inner.jpg";
import officeOutter from "#renderer/assets/images/office-outter.jpg";
import saleNetwork from "#renderer/assets/images/sale-network.jpg";
import pdf from "#renderer/assets/pdf/test.pdf";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// @ts-ignore
if (typeof Map.prototype.getOrInsertComputed === "undefined") {
  Object.defineProperty(Map.prototype, "getOrInsertComputed", {
    // @ts-ignore
    value(key, callbackFn) {
      if (this.has(key)) {
        return this.get(key);
      }
      const value = callbackFn(key);
      this.set(key, value);
      return value;
    },
    writable: true,
    configurable: true,
  });
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "/pdf.worker.mjs",
  import.meta.url,
).href;

// pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const out1 = new URL(outImage1, import.meta.url).href;
const inner1 = new URL(innerImage1, import.meta.url).href;
const out2 = new URL(outImage2, import.meta.url).href;
const inner2 = new URL(innerImage2, import.meta.url).href;
const out3 = new URL(outImage3, import.meta.url).href;
const inner3 = new URL(innerImage3, import.meta.url).href;
const out4 = new URL(outImage4, import.meta.url).href;
const inner4 = new URL(innerImage4, import.meta.url).href;
const out5 = new URL(outImage5, import.meta.url).href;
const inner5 = new URL(innerImage5, import.meta.url).href;
const out6 = new URL(outImage6, import.meta.url).href;
const inner6 = new URL(innerImage6, import.meta.url).href;
const out7 = new URL(outImage7, import.meta.url).href;
const inner7 = new URL(innerImage7, import.meta.url).href;
const saleNet = new URL(saleNetwork, import.meta.url).href;
const customerHref = new URL(customer, import.meta.url).href;
const officeOutterHref = new URL(officeOutter, import.meta.url).href;
const officeInnerHref = new URL(officeInner, import.meta.url).href;
const pdfHref = new URL(pdf, import.meta.url).href;

const Title = (props: React.PropsWithChildren) => {
  return (
    <h2 className="rounded bg-blue-400 p-1 text-center text-2xl text-white">
      {props.children}
    </h2>
  );
};

const PageOne = () => {
  const [boxWidth, setBoxWidth] = React.useState(0);

  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const [{ inlineSize: height }] = entry.contentBoxSize;
        setBoxWidth(height);
      }
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="box-border flex size-full flex-col">
      <div className="grid flex-1 grid-flow-col grid-cols-3 grid-rows-1 flex-col gap-3 overflow-hidden bg-linear-to-b from-blue-50 to-blue-200 p-3">
        <div className="flex flex-col gap-3">
          <Title>生产计划</Title>
          <div className="flex-1 overflow-hidden rounded bg-white"></div>
          <Title>制度文件</Title>
          <div className="flex-1 overflow-hidden rounded bg-white">
            <div className="grid h-full grid-cols-2 grid-rows-1 place-items-center">
              <div ref={ref}>
                <ErrorBoundary fallback={<p>Failed to load PDF.</p>}>
                  <React.Suspense fallback={<p>Loading document…</p>}>
                    <Document file={pdfHref}>
                      <React.Suspense fallback={<p>Loading page…</p>}>
                        <Page pageNumber={1} width={boxWidth} />
                      </React.Suspense>
                    </Document>
                  </React.Suspense>
                </ErrorBoundary>
              </div>
              <div className="">
                <ErrorBoundary fallback={<p>Failed to load PDF.</p>}>
                  <React.Suspense fallback={<p>Loading document…</p>}>
                    <Document file={pdfHref}>
                      <React.Suspense fallback={<p>Loading page…</p>}>
                        <Page pageNumber={1} width={boxWidth} />
                      </React.Suspense>
                    </Document>
                  </React.Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Title>工作安排</Title>
          <div className="flex-1 overflow-hidden rounded bg-white"></div>
        </div>
        <div className="flex flex-col gap-3">
          <Title>信息公开</Title>
          <div className="flex-1 overflow-hidden rounded bg-white"></div>
          <Title>其它</Title>
          <div className="flex-1 overflow-hidden rounded bg-white"></div>
        </div>
      </div>
    </div>
  );
};

const PageTwo = () => {
  return (
    <div className="box-border flex size-full flex-col">
      <div className="grid flex-1 grid-flow-col grid-cols-2 grid-rows-1 flex-col gap-3 overflow-hidden bg-linear-to-b from-blue-50 to-blue-200 p-3">
        <div className="flex flex-col gap-3">
          <Title>公司简介</Title>
          <div className="flex-1 overflow-hidden rounded bg-white p-3">
            <article className="text-base">
              <p className="indent-[2em]">
                武汉武铁紫云轨道装备有限公司成立于1992年，系武汉武铁机辆装备有限公司下属法人子公司（下简称“紫云公司”），注册资金1120.10万元，注册地点武汉，出资人为武汉武铁机辆装备有限公司。主要产品有客货车轮轴超声波探伤机系列、制动室及车钩检修生产线、闸调器检修、锂电工具、钢轨磨石配件及机车6A系统故障修等。其中，客货车轮轴超声波探伤机主要用户群体为18个铁路局集团公司下属的客货车检修站段、武汉及天津地铁车辆段等。多年以来，紫云公司坚持“工艺保质量，质量保安全”的理念，立足铁路机车车辆生产一线，专注于为机辆系统生产和安全提供科学有效的解决方案。公司勇于开拓、敢于创新，形成了探伤系列设备、公铁牵引设备、机辆架修设备、机辆检修流水线等四大类系列产品。同时，为了适应铁路发展需要，也正在拓展超声波清洗设备、救援和安防设备、机器人应用、智能仓库等四大类系列产品。在各铁路局、车辆工厂、动车基地以及部分城市轻轨、地铁系统得到广泛应用，为推动生产作业自动化、现代化、智能化起到了巨大作用，并赢得了良好的市场赞誉。
              </p>
              <p className="indent-[2em]">
                <b>实力雄厚：</b>
                公司拥有非标设备/专用配件制造基地（武昌南），分别配置非标设备制造车间、闸调器生产车间、锂电工具生产车间、钢轨磨石生产车间等现代化的生产基地，占地规模8400多平方米。以及一大批具有机械设计制造、软件开发、集成电路、超声波技术专业人才。
              </p>
              <p className="indent-[2em]">
                <b>主要设备有：</b>
                数控加工中心2台，数控车床3台，6M龙门刨1台，激光切割机1台，等离子火焰切割机1台、线切割机4台以及剪板折弯普车等通用设备30多台。
              </p>
              <p className="indent-[2em]">
                <b>管理先进：</b>
                客户服务至上，人才技术优先，专注于铁路各类非标设备的开发、制作、应用，从专业化产品、专业化技术、专业化服务、专业化管理入手，致力于为客户提供专业化系列服务。公司坚持推行ISO9000质量管理体系，本着“对用户负责、求自身发展”的经营思路严格管理，专注行业解决方案与现场技术解决方案，做到产品开发规范化，项目实施管理标准化。
              </p>
              <p className="indent-[2em]">
                <b>技术领先：</b>
                本公司生产的轮轴微机控制超声波探伤机系列产品等12项产品通过铁道部技术评审，系列产品科技含量高、性能优越。公司在无损检测领域拥有国内领先技术，实现非标设备系列化，技术水平一流化，售后服务规范化。
              </p>
              <p>
                <b>经验丰富：</b>
                公司研制生产的各类非标设备产品在国家铁路集团公司各铁路局集团公司、车辆工厂、客运系统和车辆系统得到广泛应用，拥有成熟的应用技术和产品，并在该领域内积累了丰富的经验，培养了一批德才兼备的计算机程序设计、电子技术及机械工程等知识领域的技术人才和管理人才，拥有了一支高素质、高效率的营销队伍。为了不断创新，公司与各大专院校建立了广泛、友好的技术合作与联盟，共同推动产品计算机智能控制系统的技术领先和发展，以优良的设备产品和一流的服务质量满足各地用户需要。目前公司已形成了科研开发、生产、销售整体发展的良好态势。
              </p>
            </article>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Title>区域示意图</Title>
          <div className="flex-1 overflow-hidden rounded bg-white p-3">
            <p className="indent-[2em]">
              紫云公司研发的轮轴超声波自动探伤机系列产品，在线检测、监控系统，轮轴、钩缓、轴承、制动阀检修工艺线等产品，销往全路车辆检修市场，得到了用户广泛好评。特别是轮轴超声波自动探伤机作为铁路客、货车辆检修的必备工装，覆盖了全路所有的客、货车车辆段，并在车辆工厂、地方铁路、城市轨道交通领域也得到了广泛应用紫云公司研发的轮轴超声波自动探伤机系列产品，在线检测、监控系统，轮轴、钩缓、轴承、制动阀检修工艺线等产品，销往全路车辆检修市场，得到了用户广泛好评。特别是轮轴超声波自动探伤机作为铁路客、货车辆检修的必备工装，覆盖了全路所有的客、货车车辆段，并在车辆工厂、地方铁路、城市轨道交通领域也得到了广泛应用。
            </p>
            <figure className="mx-auto max-w-3/4 space-y-1.5">
              <figcaption className="text-center text-xl font-semibold">
                产品销售网络分布图
              </figcaption>
              <img src={saleNet} alt="" className="aspect-video" />
            </figure>
            <figure className="mx-auto mt-3 max-w-3/4">
              <img src={customerHref} alt="" className="aspect-video" />
              <figcaption></figcaption>
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
};

const PageThree = () => {
  const list = [
    { image: out1, name: "一号库外" },
    { image: inner1, name: "一号库内" },
    { image: out2, name: "二号库外" },
    { image: inner2, name: "二号库内" },
    { image: out3, name: "三号库外" },
    { image: inner3, name: "三号库内" },
    { image: out4, name: "四号库外" },
    { image: inner4, name: "四号库内" },
    { image: out5, name: "五号库外" },
    { image: inner5, name: "五号库内" },
    { image: out6, name: "六号库外" },
    { image: inner6, name: "六号库内" },
    { image: out7, name: "七号库外" },
    { image: inner7, name: "七号库内" },
    { image: officeOutterHref, name: "办公区外部" },
    { image: officeInnerHref, name: "办公区内部" },
  ];

  return (
    <div className="box-border flex size-full flex-col">
      <div className="grid flex-1 grid-flow-col grid-cols-1 grid-rows-1 flex-col gap-3 overflow-hidden bg-linear-to-b from-blue-50 to-blue-200 p-3">
        <div className="flex flex-col gap-3">
          <h2 className="rounded bg-blue-400 text-center text-3xl text-white">
            紫云公司生产基地
          </h2>
          <div className="flex flex-1 flex-col overflow-hidden rounded">
            <div className="my-auto grid h-full grid-cols-4 grid-rows-4 gap-x-3.5">
              {list.map((item, i) => {
                return (
                  <div key={i} className="flex flex-col">
                    <div className="flex-1 overflow-hidden rounded">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <span className="text-center text-sm">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Component = () => {
  return (
    <Swiper
      spaceBetween={0}
      slidesPerView={1}
      modules={[Autoplay]}
      autoplay={{ delay: 1000 * 3 }}
      className="fixed inset-0 h-dvh w-dvw"
      loop
    >
      <SwiperSlide>
        <PageOne></PageOne>
      </SwiperSlide>
      <SwiperSlide>
        <PageTwo></PageTwo>
      </SwiperSlide>
      <SwiperSlide>
        <PageThree></PageThree>
      </SwiperSlide>
    </Swiper>
  );
};
