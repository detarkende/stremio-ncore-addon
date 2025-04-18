import { Configuration } from '@server/db/schema/configuration';
import { UpdateConfigRequest, updateConfigSchema } from '@server/schemas/config.schema';
import { FormProvider, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { getUpdateAddonSettingsDefaultValues } from './constants';
import { MutationKeys } from '@/constants/mutation-keys';
import { api } from '@/api';
import { handleError, HttpError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { SettingsFormFields } from '@/components/settings/settings-form-fields';

export const UpdateAddonSettingsForm = ({ config }: { config: Configuration }) => {
  const { mutateAsync, isPending } = useMutation({
    mutationKey: [MutationKeys.UPDATE_SETTINGS],
    mutationFn: async (data: UpdateConfigRequest) => {
      const req = await api.config.$put({ json: data });
      if (!req.ok) {
        throw new HttpError(req);
      }
      const res = await req.json();
      return res;
    },
    onError: (error) => handleError(error, 'Failed to update addon settings'),
  });
  const form = useForm<UpdateConfigRequest>({
    mode: 'all',
    resolver: zodResolver(updateConfigSchema),
    defaultValues: getUpdateAddonSettingsDefaultValues(config),
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const newConfig = await mutateAsync(data);
    form.reset(getUpdateAddonSettingsDefaultValues(newConfig));
    toast.success('Addon settings updated');
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-12 max-w-[600px]">
        <SettingsFormFields />
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => form.reset(getUpdateAddonSettingsDefaultValues(config))}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isDirty || !form.formState.isValid}
          >
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
