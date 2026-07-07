import { createFormHook, createFormHookContexts } from '@tanstack/react-form';

import { CheckboxField } from './fields/checkbox';
import { MultiSelectField, SelectField } from './fields/select';
import { TextField } from './fields/text-field';
import { SubmitButton } from './submit-button';

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

const { useAppForm, withFieldGroup } = createFormHook({
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

export { useAppForm, withFieldGroup, useFieldContext, useFormContext };
