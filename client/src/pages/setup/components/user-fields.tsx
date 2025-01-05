import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useFormContext } from 'react-hook-form';
import { languageLabelLookup } from '../constants';
import {
  languageValues as languageOptions,
  resolutionValues as resolutionOptions,
} from '@server/db/schema/users';
import { CreateUserRequest } from '@server/types/user';

type UserFieldsProps = {
  baseName: 'admin' | `nonAdminUsers.${number}` | 'user';
  hidePassword?: boolean;
};

export const UserFields = ({ baseName, hidePassword = false }: UserFieldsProps) => {
  const { control } = useFormContext<{ [K in typeof baseName]: CreateUserRequest }>();

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 justify-stretch w-full">
      <FormField
        control={control}
        name={`${baseName}.username`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="username" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {hidePassword ? (
        <div />
      ) : (
        <FormField
          control={control}
          name={`${baseName}.password`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={control}
        name={`${baseName}.preferredResolutions`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred resolutions</FormLabel>
            <Select
              onChange={field.onChange}
              onBlur={field.onBlur}
              value={field.value}
              options={resolutionOptions.map((resolution) => ({
                label: resolution,
                value: resolution,
              }))}
              multiple
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${baseName}.preferredLanguage`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred language</FormLabel>
            <Select
              onChange={field.onChange}
              value={field.value}
              options={languageOptions.map((language) => ({
                label: languageLabelLookup[language],
                value: language,
              }))}
            ></Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
