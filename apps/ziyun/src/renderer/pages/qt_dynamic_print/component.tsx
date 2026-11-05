import { fetchDynamicById } from "#renderer/api/qt";
import { styles } from "#shared/instances/styles";
import { Document, Page, PDFViewer } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

export const Component = () => {
  const params = useParams<{ id: string }>();
  const id = params.id;
  useQuery(fetchDynamicById(Number(id)));

  return (
    <PDFViewer
      showToolbar
      style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
    >
      <Document
        title="CHR503"
        creator="超声波自动探伤机"
        producer="武铁紫云接口面板"
      >
        <Page size={"A4"} style={[styles.page]}></Page>
      </Document>
    </PDFViewer>
  );
};
