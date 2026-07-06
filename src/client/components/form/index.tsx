import { createFormHook, createFormHookContexts } from '@tanstack/react-form';

import { CheckboxField } from './fields/checkbox';
import { MultiSelectField, SelectField } from './fields/select';
import { TextField } from './fields/text-field';
import { SubmitButton } from './submit-button';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withFieldGroup, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    SelectField,
    MultiSelectField,
    CheckboxField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
