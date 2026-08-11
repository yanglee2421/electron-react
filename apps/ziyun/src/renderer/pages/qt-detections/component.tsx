import { fetchQtDetections } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { Card, CardContent, CardHeader } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

export const Component = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get("date") || "";

  const query = useQuery(fetchQtDetections({ date }));

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return <>{query.error.message}</>;
    }

    return null;
  };

  return (
    <>
      <Card>
        <CardHeader title="" />
        <CardContent>{renderQuery()}</CardContent>
      </Card>
    </>
  );
};