import {
  Description,
  FieldError,
  Input,
  Label,
  TextField as HeroTextField,
} from '@heroui/react';
import type { ComponentProps, ReactNode, Ref } from 'react';

import { defaultFieldProps } from '../default-props';
import { useFieldContext } from '../index';

type TextFieldProps = Omit<
  ComponentProps<typeof HeroTextField>,
  'children' | 'isInvalid' | 'ref'
> & {
  label?: ReactNode;
  description?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function TextField({ label, description, ref, ...props }: TextFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isDirty && !field.state.meta.isValid;
  return (
    <HeroTextField
      {...defaultFieldProps}
      {...props}
      name={field.name}
      isInvalid={isInvalid}
    >
      {label && <Label>{label}</Label>}
      <Input
        className="text-base"
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        ref={ref}
      />
      {description && <Description>{description}</Description>}
      <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
    </HeroTextField>
  );
}
