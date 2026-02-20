import { clamp } from "#renderer/lib/utils";
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
  _min?: number;
  _max?: number;
};

export const NumberField = (props: NumberFieldProps) => {
  const { field, _step = 1, ...restProps } = props;

  const [focused, setFocused] = React.useState(false);
  const [focusedValue, setFocusedValue] = React.useState("");

  const changeValue = (value: number) => {
    const nextValue = clamp(
      value,
      props._min ?? Number.NEGATIVE_INFINITY,
      props._max ?? Number.POSITIVE_INFINITY,
    );

    field.onChange(nextValue);
  };

  return (
    <TextField
      value={renderNumberValue(field.value, focusedValue, focused)}
      onChange={(e) => {
        setFocusedValue(e.target.value);
        const numberValue = Number.parseFloat(e.target.value);
        const isNan = Number.isNaN(numberValue);
        if (isNan) return;
        changeValue(numberValue);
      }}
      onFocus={() => {
        setFocused(true);
        setFocusedValue(numberToFocusedValue(field.value));
      }}
      onBlur={(e) => {
        setFocused(false);
        field.onBlur();
        changeValue(Number.parseFloat(e.target.value.trim()));
      }}
      onKeyDown={(e) => {
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            setFocusedValue((prev) => {
              const nextValue = (Number.parseFloat(prev) || 0) + _step;

              return clamp(
                nextValue,
                props._min ?? Number.NEGATIVE_INFINITY,
                props._max ?? Number.POSITIVE_INFINITY,
              ).toString();
            });
            changeValue(field.value + _step);
            break;
          case "ArrowDown":
            setFocusedValue((prev) => {
              const nextValue = (Number.parseFloat(prev) || 0) - _step;

              return clamp(
                nextValue,
                props._min ?? Number.NEGATIVE_INFINITY,
                props._max ?? Number.POSITIVE_INFINITY,
              ).toString();
            });
            changeValue(field.value - _step);
            break;
          default:
        }
      }}
      {...restProps}
    />
  );
};
