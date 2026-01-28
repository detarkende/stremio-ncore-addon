import { Checkbox, type CheckboxProps } from '@heroui/react';
import { useFieldContext } from '..';

type CheckboxFieldProps = Omit<CheckboxProps, 'checked' | 'onChange' | 'onBlur'> & {};

export function CheckboxField(props: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();

  return (
    <Checkbox
      {...props}
      isSelected={field.state.value}
      onValueChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={!field.state.meta.isValid}
    />
  );
}
