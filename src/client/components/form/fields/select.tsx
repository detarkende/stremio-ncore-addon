import { Select, SelectItem, type SelectProps } from '@heroui/react';

import { defaultFieldProps } from '../default-props';
import { useFieldContext } from '../index';

type DisallowedSelectProps =
  | 'name'
  | 'children'
  | 'value'
  | 'onChange'
  | 'selectionMode'
  | 'selectedKeys'
  | 'onSelectionChange'
  | 'onBlur';

export interface SelectOption<TValue extends string> {
  label: string;
  value: TValue;
}

type SelectFieldProps<TValue extends string> = Omit<
  SelectProps,
  DisallowedSelectProps
> & {
  options: SelectOption<TValue>[];
};

export function SelectField<TValue extends string = string>({
  options,
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
      selectedKeys={new Set([field.state.value])}
      onSelectionChange={([selectedKey]) => field.handleChange(selectedKey as TValue)}
      onBlur={field.handleBlur}
      isInvalid={isInvalid}
      errorMessage={field.state.meta.errors[0]?.message}
    >
      {options.map((option) => (
        <SelectItem key={option.value}>{option.label}</SelectItem>
      ))}
    </Select>
  );
}

type MultiSelectFieldProps<TValue extends string> = Omit<
  SelectProps,
  DisallowedSelectProps
> & {
  options: SelectOption<TValue>[];
};

export function MultiSelectField<TValue extends string = string>({
  options,
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
      selectedKeys={new Set(field.state.value)}
      onSelectionChange={(selectedKeys) =>
        field.handleChange(Array.from(selectedKeys) as TValue[])
      }
      onBlur={field.handleBlur}
      isInvalid={isInvalid}
      errorMessage={field.state.meta.errors[0]?.message}
    >
      {options.map((option) => (
        <SelectItem key={option.value}>{option.label}</SelectItem>
      ))}
    </Select>
  );
}
