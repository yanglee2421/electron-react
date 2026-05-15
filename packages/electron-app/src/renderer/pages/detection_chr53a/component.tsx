import { PageFooter, PageHeader, ReportTitle } from "#renderer/components/pdf";
import { styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer, View } from "@react-pdf/renderer";
import { useLocation } from "react-router";

export const Component = () => {
  const location = useLocation();
  const ids = location.state.ids;

  console.log(ids);

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
          </View>
          <PageFooter center>1页/1页</PageFooter>
        </Page>
      </Document>
    </PDFViewer>
  );
};
