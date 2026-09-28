import { fetchCHR503Data } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import { CHR503 } from "#renderer/components/pdf/503";
import { resolveCHR503 } from "#shared/functions/chr503";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchCHR503Data(params.id!));

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

    const { corporation } = query.data;
    const { rows } = resolveCHR503(query.data.rows);
    const validateAt = rows.at(0)?.tmNow || "";

    return (
      <CHR503
        factory={corporation.Factory || ""}
        equipmentModel={corporation.DeviceType || ""}
        equipmentNo={corporation.DeviceNO || ""}
        manufactureDate={corporation.prodate}
        validateAt={validateAt}
        rows={rows}
      />
    );
  };

  return renderQuery();
};
