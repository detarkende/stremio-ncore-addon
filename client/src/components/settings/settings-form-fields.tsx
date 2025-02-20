import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DeleteAfterHitnrun } from './delete-after-hitnrun';
import { useFormContext } from 'react-hook-form';
import { CreateConfigRequest, UpdateConfigRequest } from '@server/schemas/config.schema';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '../ui/separator';

export const SettingsFormFields = ({ localUrl }: { localUrl: string | undefined }) => {
  const { control, watch, setValue, trigger } = useFormContext<
    UpdateConfigRequest | CreateConfigRequest
  >();
  const { addonUrl } = watch();
  return (
    <>
      <div className="space-y-6">
        <FormField
          control={control}
          name="addonUrl.local"
          render={({ field }) => (
            <RadioGroup
              value={field.value.toString()}
              onValueChange={async (value) => {
                const isLocal = value === 'true';
                setValue(
                  'addonUrl',
                  isLocal ? { local: true, url: '' } : { local: false, url: '' },
                );
                await trigger();
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="remotely-accessible" />
                <Label htmlFor="remotely-accessible">Remotely accessible</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="locally-accessible" />
                <Label htmlFor="locally-accessible">
                  Only accessible on local network
                </Label>
              </div>
            </RadioGroup>
          )}
        />
        <div className="space-y-4">
          <FormField
            control={control}
            name="addonUrl.url"
            disabled={addonUrl.local}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Addon URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder={addonUrl.local ? localUrl : 'https://your-addon-url.com'}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  Which URL is your addon reachable through from the outside internet?
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Delete after hit'n'run</h3>
          <DeleteAfterHitnrun />
        </div>
      </div>
    </>
  );
};
