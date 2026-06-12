import { fetchExternalDBAnniversary } from "#renderer/api/external-db";
import { Loading } from "#renderer/components/Loading";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

export const Component = () => {
  const query = useQuery(fetchExternalDBAnniversary());

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return <>{query.error.message}</>;
    }

    return (
      <ul>
        {query.data.rows.map((item) => (
          <li key={item.recId}>
            <Link to={{ pathname: `/qt/anniversary/${item.recId}` }}>
              {item.recId}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return renderQuery();
};
