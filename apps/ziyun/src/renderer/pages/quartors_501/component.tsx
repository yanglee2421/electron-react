import { fetchQuartorCHR501Data } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import { CHR501, resolvedFlaws } from "#renderer/components/pdf/501";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchQuartorCHR501Data(params.id!));

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Alert>
          <AlertTitle>错误</AlertTitle>
          {query.error.message}
        </Alert>
      );
    }

    const { detectors, datas, record, corporation, images } = query.data;
    const map = resolvedFlaws(datas, detectors);

    return (
      <CHR501
        zh={record.szIDsWheel || ""}
        zx={record.szWHModel || ""}
        factoryName={corporation.Factory || ""}
        validateAt={record.tmnow || ""}
        equipmentModel={corporation.DeviceType || ""}
        equipmentNo={corporation.DeviceNO || ""}
        imageLXH={images.lxh}
        imageRXH={images.rxh}
        imageLLZ={images.llz}
        imageRLZ={images.rlz}
        imageLCT={images.lct}
        imageRCT={images.rct}
        user={record.szUsername || ""}
        boardDatas={map}
      />
    );
  };

  return renderQuery();
};
