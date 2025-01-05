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

export const SettingsFormFields = () => {
  const { control } = useFormContext<UpdateConfigRequest | CreateConfigRequest>();
  return (
    <>
      <div className="space-y-6">
        <FormField
          control={control}
          name="addonUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Addon URL</FormLabel>
              <FormControl>
                <Input placeholder="https://your-addon-url.com" {...field} />
              </FormControl>
              <FormMessage />
              <FormDescription>
                Which URL is your addon reachable through from the outside internet?
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Delete after hit'n'run</h3>
          <DeleteAfterHitnrun />
        </div>
      </div>
    </>
  );
};
