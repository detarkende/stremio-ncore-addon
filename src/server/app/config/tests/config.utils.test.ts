import { db } from '@server/db';
import { configurationTable } from '@server/db/schema/configuration';
import type { UpdateConfigRequest } from '@server/exports';

import { configRequestToInsertStatement, getConfig } from '../config.utils';

describe('Config Utils', () => {
  describe('getConfig', () => {
    it('should return null if no configuration exists', () => {
      const config = getConfig();
      expect(config).toBeNull();
    });

    it('should return configuration with default values if configuration exists', async () => {
      await db.insert(configurationTable).values({ id: 1, localIp: '192.168.1.6' });

      expect(getConfig()).toEqual({
        id: 1,
        localIp: '192.168.1.6',
        localUrl: 'https://192-168-1-6.local-ip.medicmobile.org:3443',
        deleteAfterHitnrun: false,
        deleteAfterHitnrunCron: '0 2 * * *',
        remoteUrl: null,
      });
    });

    it('should return correct configuration when all config options are set', async () => {
      await db.insert(configurationTable).values({
        id: 1,
        localIp: '192.168.1.15',
        remoteUrl: 'https://example.com',
        deleteAfterHitnrun: true,
        deleteAfterHitnrunCron: '30 3 * * *',
      });

      expect(getConfig()).toEqual({
        id: 1,
        localIp: '192.168.1.15',
        localUrl: 'https://192-168-1-15.local-ip.medicmobile.org:3443',
        remoteUrl: 'https://example.com',
        deleteAfterHitnrun: true,
        deleteAfterHitnrunCron: '30 3 * * *',
      });
    });
  });

  describe('configRequestToInsertStatement', () => {
    it('should convert UpdateConfigRequest to insert statement format', () => {
      const request: UpdateConfigRequest = {
        localIp: '192.168.1.15',
        remoteUrl: 'https://example.com',
        deleteAfterHitnrun: {
          enabled: false,
          cron: '',
        },
      };

      const insertObject = configRequestToInsertStatement(request);

      expect(insertObject).toEqual({
        remoteUrl: 'https://example.com',
        localIp: '192.168.1.15',
        deleteAfterHitnrun: false,
        deleteAfterHitnrunCron: '',
      });
    });
  });
});
