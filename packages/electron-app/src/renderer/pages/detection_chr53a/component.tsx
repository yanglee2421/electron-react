import { PageFooter, PageHeader, ReportTitle } from "#renderer/components/pdf";
import { styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer, View } from "@react-pdf/renderer";

export const Component = () => {
  return (
    <PDFViewer>
      <Document>
        <Page style={[styles.page]} size={"A4"}>
          <PageHeader>车统-53A</PageHeader>
          <View>
            <ReportTitle>
              铁路货车轮轴（轮对、车轴、车轮）超声波 探伤记录
            </ReportTitle>
          </View>
          <PageFooter></PageFooter>
        </Page>
      </Document>
    </PDFViewer>
  );
};
