import dayjs from "dayjs";
import React from "react";

const initDayjs = () => dayjs();
export const useDayjs = () => React.useState<dayjs.Dayjs | null>(initDayjs);
