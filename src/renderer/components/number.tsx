import { type TextFieldProps, TextField } from "@mui/material";
import React from "react";

const renderNumberValue = (
  value: number,
  focusValue: string,
  focused: boolean,
) => {
  if (focused) {
    return focusValue;
  }

  if (Number.isNaN(value)) {
    return "";
  }

  return value;
};

const numberToFocusedValue = (value: number) => {
  if (Number.isNaN(value)) {
    return "";
  }

  return value.toString();
};

type NumberFieldProps = TextFieldProps & {
  field: {
    value: number;
    onChange: (value: number) => void;
    onBlur: () => void;
  };
  _step?: number;
};

export const NumberField = (props: NumberFieldProps) => {
  const { field, _step = 1, ...restProps } = props;

  const [focused, setFocused] = React.useState(false);
  const [focusedValue, setFocusedValue] = React.useState("");

  return (
    <TextField
      value={renderNumberValue(field.value, focusedValue, focused)}
      onChange={(e) => {
        setFocusedValue(e.target.value);
        const numberValue = Number.parseFloat(e.target.value);
        const isNan = Number.isNaN(numberValue);
        if (isNan) return;
        field.onChange(numberValue);
      }}
      onFocus={() => {
        setFocused(true);
        setFocusedValue(numberToFocusedValue(field.value));
      }}
      onBlur={(e) => {
        setFocused(false);
        field.onBlur();
        field.onChange(Number.parseFloat(e.target.value.trim()));
      }}
      onKeyDown={(e) => {
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            setFocusedValue((prev) => {
              const nextValue = (Number.parseFloat(prev) || 0) + _step;
              return nextValue.toString();
            });
            field.onChange(field.value + _step);
            break;
          case "ArrowDown":
            setFocusedValue((prev) => {
              const nextValue = (Number.parseFloat(prev) || 0) - _step;
              return nextValue.toString();
            });
            field.onChange(field.value - _step);
            break;
          default:
        }
      }}
      {...restProps}
    />
  );
};
