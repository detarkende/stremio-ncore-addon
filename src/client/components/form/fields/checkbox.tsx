import { Checkbox, FieldError } from '@heroui/react';
import type { ComponentProps } from 'react';

import { useFieldContext } from '../index';

type CheckboxFieldProps = Omit<
  ComponentProps<typeof Checkbox>,
  'children' | 'isSelected' | 'onChange'
> & {
  children?: React.ReactNode;
};

export function CheckboxField({ children, ...props }: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();

  return (
    <Checkbox
      {...props}
      isSelected={field.state.value}
      onChange={field.handleChange}
      isInvalid={!field.state.meta.isValid}
    >
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {children}
      </Checkbox.Content>
      <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
    </Checkbox>
  );
}
