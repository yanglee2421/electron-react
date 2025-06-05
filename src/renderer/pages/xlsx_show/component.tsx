import { fetchSqliteXlsxSize } from "@/api/fetch_preload";
import { Loading } from "@/components/Loading";
import { WestOutlined } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";

export const Component = () => {
  const navigate = useNavigate();
  const params = useParams();

  const currentId = Number(params.id);

  const query = useQuery({ ...fetchSqliteXlsxSize({ id: currentId }) });

  const renderBody = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return <></>;
    }

    return <CardContent>{JSON.stringify(query.data)}</CardContent>;
  };

  return (
    <Card>
      <CardHeader title={`#${currentId}`} />
      {renderBody()}
      <CardActions>
        <Button
          startIcon={<WestOutlined />}
          onClick={() => {
            navigate(-1);
          }}
        >
          返回
        </Button>
      </CardActions>
    </Card>
  );
};
