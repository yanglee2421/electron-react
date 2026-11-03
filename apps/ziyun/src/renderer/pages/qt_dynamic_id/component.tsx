import { fetchDynamicById } from "#renderer/api/qt";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { Print } from "@mui/icons-material";
import { Button, Card, CardContent, CardHeader } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

export const Component = () => {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useQuery(fetchDynamicById(Number(id)));

  return (
    <>
      <ScrollToTopButton />
      <Card>
        <CardHeader title="Dynamic ID" />
        <CardContent>
          <Button
            startIcon={<Print />}
            variant="outlined"
            component={Link}
            to={`/qt/dynamic/${id}/print`}
          >
            Print
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
