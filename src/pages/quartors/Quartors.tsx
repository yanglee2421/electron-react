import {
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";

export const Quartors = () => {
  return (
    <Card>
      <CardHeader title="季度校验" />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>#1</TableCell>
              <TableCell>{new Date().toLocaleDateString()}</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <TablePagination
        component={"div"}
        count={0}
        page={0}
        rowsPerPage={20}
        rowsPerPageOptions={[20, 50, 100]}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        labelRowsPerPage="每页行数"
      />
    </Card>
  );
};
