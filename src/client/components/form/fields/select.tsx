import { FieldError, Label, ListBox, Select } from '@heroui/react';
import type { ComponentProps, Key, ReactNode } from 'react';

import { defaultFieldProps } from '../default-props';
import { useFieldContext } from '../index';

type DisallowedSelectProps =
  | 'children'
  | 'name'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'selectionMode';

export interface SelectOption<TValue extends string> {
  label: string;
  value: TValue;
}

type SelectFieldProps<TValue extends string> = Omit<
  ComponentProps<typeof Select>,
  DisallowedSelectProps
> & {
  label?: ReactNode;
  options: SelectOption<TValue>[];
};

export function SelectField<TValue extends string = string>({
  options,
  label,
  ...selectProps
}: SelectFieldProps<TValue>) {
  const field = useFieldContext<TValue>();
  const isInvalid = field.state.meta.isDirty && !field.state.meta.isValid;
  return (
    <Select
      {...defaultFieldProps}
      {...selectProps}
      selectionMode="single"
      name={field.name}
      value={field.state.value}
      onChange={(selectedKey) => {
        if (selectedKey !== null && !Array.isArray(selectedKey)) {
          field.handleChange(selectedKey as TValue);
        }
      }}
      onBlur={field.handleBlur}
      isInvalid={isInvalid}
    >
      {label && <Label>{label}</Label>}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
    </Select>
  );
}

type MultiSelectFieldProps<TValue extends string> = Omit<
  ComponentProps<typeof Select>,
  DisallowedSelectProps
> & {
  label?: ReactNode;
  options: SelectOption<TValue>[];
};

export function MultiSelectField<TValue extends string = string>({
  options,
  label,
  ...selectProps
}: MultiSelectFieldProps<TValue>) {
  const field = useFieldContext<TValue[]>();
  const isInvalid = field.state.meta.isDirty && !field.state.meta.isValid;
  return (
    <Select
      {...defaultFieldProps}
      {...selectProps}
      selectionMode="multiple"
      name={field.name}
      value={field.state.value}
      onChange={(selectedKeys) => {
        if (Array.isArray(selectedKeys)) {
          field.handleChange(selectedKeys as TValue[]);
        }
      }}
      onBlur={field.handleBlur}
      isInvalid={isInvalid}
    >
      {label && <Label>{label}</Label>}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox selectionMode="multiple">
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
    </Select>
  );
}
