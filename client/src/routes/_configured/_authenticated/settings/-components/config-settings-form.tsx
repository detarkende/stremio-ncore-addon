import {
  updateConfigSchema,
  type Configuration,
  type UpdateConfigRequest,
} from '@sna/server';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addToast } from '@heroui/react';
import { useAppForm } from '@/components/form';
import { AddonSettingsFields } from '@/components/form/field-groups/addon-settings-fields';
import { apiClient } from '@/integrations/api';
import { handleHttpError } from '@/utils/http';
import { configQueryOptions } from '@/integrations/tanstack-query/queries/config';

export function ConfigSettingsForm({ config }: { config: Configuration }) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async (values: UpdateConfigRequest) => {
      const response = await apiClient.api.config.$put({ json: values });
      if (!response.ok) {
        await handleHttpError(response);
      }
    },
  });
  const form = useAppForm({
    defaultValues: {
      localIp: config.localIp,
      remoteUrl: config.remoteUrl ?? '',
      deleteAfterHitnrun: {
        enabled: config.deleteAfterHitnrun,
        cron: config.deleteAfterHitnrunCron,
      },
    },
    onSubmit: async ({ value }) => {
      try {
        await mutateAsync(value);
        addToast({
          title: 'Configuration updated successfully.',
          color: 'success',
          timeout: 5000,
        });
        await queryClient.refetchQueries(configQueryOptions);
        form.reset(value);
      } catch (error) {
        addToast({
          title: 'Failed to update configuration.',
          description: (error as Error).message,
          color: 'danger',
          timeout: 8000,
        });
      }
    },
    validators: {
      onChange: updateConfigSchema,
    },
  });

  return (
    <form.AppForm>
      <form
        // validationBehavior="native"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <AddonSettingsFields
          form={form}
          fields={{
            localIp: 'localIp',
            remoteUrl: 'remoteUrl',
            deleteAfterHitnrun: 'deleteAfterHitnrun',
          }}
        />
        <form.SubmitButton buttonMode="update" color="primary" className="w-fit">
          Save settings
        </form.SubmitButton>
      </form>
    </form.AppForm>
  );
}
