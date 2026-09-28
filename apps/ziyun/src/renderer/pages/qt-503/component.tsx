import { fetchQT503 } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { CHR503 } from "#renderer/components/pdf/503";
import { resolveQT503 } from "#shared/functions/qt-503";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchQT503(params.id!));

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

    const { FACTORY_CLD, FACTORY_SYRQ, FACTORY_SBBH, FACTORY_SBXH } =
      query.data;
    const { rows } = resolveQT503(query.data.rows);
    const tmNow = rows.at(0)?.tmNow || "";

    return (
      <CHR503
        factory={FACTORY_CLD || ""}
        equipmentModel={FACTORY_SBXH || ""}
        equipmentNo={FACTORY_SBBH || ""}
        manufactureDate={FACTORY_SYRQ || ""}
        validateAt={tmNow}
        rows={rows}
      />
    );
  };

  return renderQuery();
};
