import type { InputProps, SelectProps } from '@heroui/react';

type FieldProps = SelectProps & InputProps;

export const defaultFieldProps: Partial<FieldProps> = {
  variant: 'bordered',
  labelPlacement: 'outside-top',
};
