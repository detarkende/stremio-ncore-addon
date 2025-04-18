import { useController, useFormContext, useWatch } from 'react-hook-form';
import { UpdateConfigRequest } from '@server/schemas/config.schema';
import { DEFAULT_HITNRUN_CRON, SetupFormValues } from '../../pages/setup/constants';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Input } from '@/components/ui/input';

type FormType = SetupFormValues | UpdateConfigRequest;

export const DeleteAfterHitnrun = () => {
  const { trigger } = useFormContext<FormType>();
  const { field: enabledField } = useController<FormType, 'deleteAfterHitnrun.enabled'>({
    name: 'deleteAfterHitnrun.enabled',
  });
  const { field: cronField } = useController<FormType, 'deleteAfterHitnrun.cron'>({
    name: 'deleteAfterHitnrun.cron',
  });

  const enabled = useWatch<FormType>({
    name: 'deleteAfterHitnrun.enabled',
  });

  const isSwitchOn = Boolean(enabled);
  return (
    <>
      <div>
        <div className="flex items-center space-x-2">
          <FormControl>
            <Switch
              checked={isSwitchOn}
              onBlur={enabledField.onBlur}
              onCheckedChange={(checked) => {
                enabledField.onChange(checked);
                cronField.onChange(checked ? DEFAULT_HITNRUN_CRON : '');
                trigger('deleteAfterHitnrun');
              }}
            />
          </FormControl>
          <FormLabel>
            Should delete torrents when hit&apos;n&apos;run period is over
          </FormLabel>
        </div>
        <FormMessage />
      </div>
      {isSwitchOn && (
        <FormItem>
          <FormLabel>
            Cron expression for deletion
            <InfoTooltip>
              This text defines when the addon checks which torrents are ready to be
              deleted. Generate your own{' '}
              <a
                className="underline"
                href="https://crontab.guru/#0_2_*_*_*"
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
              .
            </InfoTooltip>
          </FormLabel>
          <FormControl>
            <Input type="text" {...cronField} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    </>
  );
};
