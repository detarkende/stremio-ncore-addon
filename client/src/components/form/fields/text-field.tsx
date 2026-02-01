import { Input, type InputProps } from '@heroui/react';
import { defaultFieldProps } from '../default-props';
import { useFieldContext } from '..';

type TextFieldProps = Omit<
  InputProps,
  'value' | 'onChange' | 'onBlur' | 'name' | 'isInvalid' | 'errorMessage' | 'classNames'
>;

export function TextField(props: TextFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isDirty && !field.state.meta.isValid;
  return (
    <Input
      {...defaultFieldProps}
      {...props}
      classNames={{
        input: 'text-base',
      }}
      name={field.name}
      value={field.state.value}
      onValueChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={isInvalid}
      errorMessage={field.state.meta.errors[0]?.message}
    />
  );
}
