import { fetchQTQuartors } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { useQuery } from "@tanstack/react-query";

export const Component = () => {
  const query = useQuery(fetchQTQuartors());

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return <>{query.error.message}</>;
    }

    return null;
  };

  return <>{renderQuery()}</>;
};