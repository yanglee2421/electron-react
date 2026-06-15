import { fetchExternalDBAnniversaryDetail } from "#renderer/api/external-db";
import { Loading } from "#renderer/components/Loading";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchExternalDBAnniversaryDetail(params.id!));

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return <>{query.error.message}</>;
    }

    return (
      <>
        <Link to={{ pathname: `/qt/anniversary/${params.id}/503` }}>
          printer
        </Link>
        {query.data.rows.length}
      </>
    );
  };

  return renderQuery();
};
