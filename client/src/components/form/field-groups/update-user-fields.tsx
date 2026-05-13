import { Language, type UpdateUserRequest } from '@sna/server';

import { languageOptions } from '@/constants/languages';
import { resolutionOptions } from '@/constants/resolutions';

import { withFieldGroup } from '..';

const updateUserFormDefaultValues: Partial<UpdateUserRequest> = {
  username: '',
  preferredLanguage: '' as Language,
  preferredResolutions: [],
};

export const UpdateUserFields = withFieldGroup({
  defaultValues: updateUserFormDefaultValues,
  props: {},
  render: function UserFields({ group }) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <group.AppField name="username">
          {(field) => <field.TextField isRequired label="Username" />}
        </group.AppField>
        <group.AppField name="preferredLanguage">
          {(field) => (
            <field.SelectField isRequired options={languageOptions} label="Language" />
          )}
        </group.AppField>
        <group.AppField name="preferredResolutions">
          {(field) => (
            <field.MultiSelectField
              isRequired
              options={resolutionOptions}
              label="Resolutions"
            />
          )}
        </group.AppField>
      </div>
    );
  },
});
