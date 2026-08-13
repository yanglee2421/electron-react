import {
  CheckBoxOutlineBlankOutlined,
  CheckBoxOutlined,
} from "@mui/icons-material";

interface CheckBoxCellProps {
  value: boolean | null;
}

export const CheckBoxCell = ({ value }: CheckBoxCellProps) => {
  return value ? <CheckBoxOutlined /> : <CheckBoxOutlineBlankOutlined />;
};
