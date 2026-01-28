import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { TextField } from './fields/text-field';
import { MultiSelectField, SelectField } from './fields/select';
import { SubmitButton } from './submit-button';
import { CheckboxField } from './fields/checkbox';

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
