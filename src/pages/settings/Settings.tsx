import {
  FileDownloadOutlined,
  FileUploadOutlined,
  FindInPageOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardHeader,
  Grid2,
  TextField,
  InputAdornment,
  IconButton,
  CardActions,
  Button,
} from "@mui/material";
import React from "react";

export const Settings = () => {
  const [path, setPath] = React.useState("");
  return (
    <Card>
      <CardHeader title="Settings" action={null} />
      <CardContent>
        <Grid2 container spacing={6}>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
              }}
              fullWidth
              label="Database"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton component="label">
                        <input
                          type="file"
                          accept="application/msaccess,application/vnd.ms-access,.mdb,.accdb"
                          hidden
                          value={""}
                          onChange={(e) => {
                            console.log();
                            const file = e.target.files?.item(0);
                            if (!file) return;
                            setPath(file.path);
                          }}
                        />
                        <FindInPageOutlined />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid2>
        </Grid2>
      </CardContent>
      <CardActions>
        <Button variant="contained" startIcon={<SaveOutlined />}>
          Save
        </Button>
        <Button
          component="label"
          startIcon={<FileDownloadOutlined />}
          variant="outlined"
        >
          <input
            type="file"
            accept="application/json,.json"
            hidden
            value={""}
            onChange={(e) => {
              console.log();
              const file = e.target.files?.item(0);
              if (!file) return;
            }}
          />
          Import
        </Button>
        <Button
          onClick={() => {
            // 创建 JSON 数据
            const data = {
              name: "John Doe",
              age: 30,
              email: "john.doe@example.com",
            };

            // 将 JSON 数据转换为字符串
            const jsonString = JSON.stringify(data);

            // 创建 Blob 对象
            const blob = new Blob([jsonString], { type: "application/json" });

            // 创建下载链接
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "data.json"; // 下载的文件名

            // 触发下载
            document.body.appendChild(link); // 将链接添加到 DOM
            link.click(); // 自动点击链接
            document.body.removeChild(link); // 下载后移除链接
          }}
          startIcon={<FileUploadOutlined />}
          variant="outlined"
        >
          export
        </Button>
      </CardActions>
    </Card>
  );
};
// Joney
