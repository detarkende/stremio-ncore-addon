import { db } from 'src/db';
import { configurationTable } from 'src/db/schema/configuration';
import type { UpdateConfigRequest } from 'src/exports';
import { configRequestToInsertStatement, getConfig } from '../config.utils';

describe('Config Utils', () => {
  describe('getConfig', () => {
    it('should return null if no configuration exists', () => {
      const config = getConfig();
      expect(config).toBeNull();
    });

    it('should return configuration with computed addonUrl and default values if configuration exists', async () => {
      await db
        .insert(configurationTable)
        .values({ id: 1, addonLocation: 'http://example.com' });

      expect(getConfig()).toEqual({
        id: 1,
        addonLocation: 'http://example.com',
        deleteAfterHitnrun: false,
        deleteAfterHitnrunCron: '0 2 * * *',
        localOnly: false,
        addonUrl: 'http://example.com',
      });
    });

    it('should return configuration with local IP addonUrl if localOnly is true', async () => {
      await db
        .insert(configurationTable)
        .values({ id: 1, addonLocation: '192.168.1.15', localOnly: true });

      expect(getConfig()).toEqual({
        id: 1,
        addonLocation: '192.168.1.15',
        deleteAfterHitnrun: false,
        deleteAfterHitnrunCron: '0 2 * * *',
        localOnly: true,
        addonUrl: 'https://192-168-1-15.local-ip.medicmobile.org:3443',
      });
    });
  });

  describe('configRequestToInsertStatement', () => {
    it('should convert UpdateConfigRequest to insert statement format', () => {
      const request: UpdateConfigRequest = {
        addonLocation: {
          location: 'https://example.com',
          local: false,
        },
        deleteAfterHitnrun: {
          enabled: false,
          cron: '',
        },
      };

      const insertObject = configRequestToInsertStatement(request);

      expect(insertObject).toEqual({
        addonLocation: 'https://example.com',
        localOnly: false,
        deleteAfterHitnrun: false,
        deleteAfterHitnrunCron: '',
      });
    });
  });
});
