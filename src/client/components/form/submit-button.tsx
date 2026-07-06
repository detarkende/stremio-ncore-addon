import { Button, type ButtonProps } from '@heroui/react';
import { useStore } from '@tanstack/react-form';

import { useFormContext } from './index';

type SubmitButtonProps = Omit<ButtonProps, 'type' | 'disabled' | 'isLoading'> & {
  buttonMode?: 'create' | 'update';
};

export function SubmitButton({ buttonMode = 'create', ...props }: SubmitButtonProps) {
  const form = useFormContext();
  const [isSubmitting, canSubmit, isDirty] = useStore(form.store, (store) => [
    store.isSubmitting,
    store.canSubmit,
    store.isDirty,
  ]);
  const isEnabled = buttonMode === 'create' ? canSubmit : canSubmit && isDirty;
  return (
    <Button {...props} type="submit" isDisabled={!isEnabled} isLoading={isSubmitting} />
  );
}
