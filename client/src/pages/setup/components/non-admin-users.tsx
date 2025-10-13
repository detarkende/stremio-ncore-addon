import { PlusCircle, Trash2 } from 'lucide-react';
import { useFieldArray } from 'react-hook-form';
import { languageValues as languageOptions } from '@server/db/schema/users';
import { SetupFormValues } from '../constants';
import { UserFields } from './user-fields';
import { Button } from '@/components/ui/button';

export const NonAdminUsers = () => {
  const { fields, append, remove } = useFieldArray<SetupFormValues>({
    name: 'nonAdminUsers',
  });
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Non-admin users</h3>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No non-admin users added yet.</p>
      ) : (
        fields.map((field, index) => (
          <div className="space-y-4 p-4 border rounded-md" key={field.id}>
            <UserFields baseName={`nonAdminUsers.${index}`} />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => remove(index)}
              className="mt-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove User
            </Button>
          </div>
        ))
      )}
      <Button
        type="button"
        onClick={() =>
          append({
            username: '',
            password: '',
            preferredResolutions: [],
            preferredLanguage: languageOptions[0],
          })
        }
        variant="outline"
        className="w-full"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Add Non-Admin User
      </Button>
    </div>
  );
};
