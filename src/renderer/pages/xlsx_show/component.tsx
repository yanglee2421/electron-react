import { fetchSqliteXlsxSize } from "#renderer/api/fetch_preload";
import { Loading } from "#renderer/components/Loading";
import { EditOutlined, WestOutlined } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";

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

    const row = query.data.rows.at(0);

    if (!row) {
      return <CardContent>无可用数据</CardContent>;
    }

    return (
      <CardContent>
        <List disablePadding>
          <ListItem>
            <ListItemText primary={row.xlsxName} secondary={"xlsx文件"} />
          </ListItem>
          <ListItem>
            <ListItemText primary={row.type} secondary={"行/列"} />
          </ListItem>
          <ListItem>
            <ListItemText primary={row.index} secondary={"索引"} />
          </ListItem>
          <ListItem>
            <ListItemText primary={row.size} secondary={"列宽/行高"} />
          </ListItem>
        </List>
      </CardContent>
    );
  };

  return (
    <Card>
      <CardHeader
        title={`#${currentId}`}
        action={
          <IconButton component={Link} to={`/xlsx/${currentId}/edit`}>
            <EditOutlined />
          </IconButton>
        }
      />
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
