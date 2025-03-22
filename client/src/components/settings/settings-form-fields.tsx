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

export const SettingsFormFields = () => {
  const { control, watch, setValue, trigger } = useFormContext<
    UpdateConfigRequest | CreateConfigRequest
  >();
  const { addonLocation } = watch();
  return (
    <>
      <div className="space-y-6">
        <FormField
          control={control}
          name="addonLocation.local"
          render={({ field }) => (
            <RadioGroup
              value={field.value.toString()}
              onValueChange={async (value) => {
                const isLocal = value === 'true';
                setValue('addonLocation', { local: isLocal, location: '' });
                await trigger();
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="remotely-accessible" />
                <Label htmlFor="remotely-accessible">
                  Remotely accessible with custom domain
                </Label>
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
            name="addonLocation.location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {addonLocation.local ? 'Local network IP' : 'Addon URL'}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      addonLocation.local ? '192.168.x.x' : 'https://your-addon-url.com'
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  {addonLocation.local
                    ? 'The local IP of the host machine where the addon is running. Must be static.'
                    : 'The URL where the addon is hosted. Must not end with a slash.'}
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
