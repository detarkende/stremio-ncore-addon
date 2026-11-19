import { withFieldGroup } from '../index';

export const AddonSettingsFields = withFieldGroup({
  defaultValues: {
    localIp: '',
    remoteUrl: '',
    deleteAfterHitnrun: {
      enabled: true,
      cron: '0 2 * * *',
    },
  },
  props: {},
  render: function AddonSettingsFields({ group }) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <group.AppField name="localIp">
          {(field) => (
            <field.TextField
              isRequired
              label="Local IP address"
              description="Enter the local IP address of the addon"
            />
          )}
        </group.AppField>
        <group.AppField name="remoteUrl">
          {(field) => <field.TextField label="Remote URL (optional)" />}
        </group.AppField>
        <group.AppField name="deleteAfterHitnrun.enabled">
          {(field) => (
            <field.CheckboxField>
              Enable delete after hit&apos;n&apos;run
            </field.CheckboxField>
          )}
        </group.AppField>
        <group.Subscribe selector={(state) => state.values.deleteAfterHitnrun.enabled}>
          {(enabled) =>
            enabled ? (
              <group.AppField name="deleteAfterHitnrun.cron">
                {(field) => <field.TextField isRequired label="Cron schedule" />}
              </group.AppField>
            ) : null
          }
        </group.Subscribe>
      </div>
    );
  },
});
