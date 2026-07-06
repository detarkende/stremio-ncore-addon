import { db } from '@server/db';
import { configurationTable } from '@server/db/schema/configuration';
import { configureApp } from '@server/test-utils/config';
import { eq } from 'drizzle-orm';

import { DeleteOldTorrentsScheduler } from '../config.schedule';
import { getConfig } from '../config.utils';

describe('DeleteOldTorrentsScheduler', () => {
  let deleteOldTorrentsScheduler: DeleteOldTorrentsScheduler;
  beforeEach(() => {
    deleteOldTorrentsScheduler = new DeleteOldTorrentsScheduler();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should schedule a cron job if configuration is valid', async () => {
    const deleteAfterHitnrunCron = '*/1 * * * * *'; // Every second for testing
    configureApp({
      deleteAfterHitnrun: true,
      deleteAfterHitnrunCron,
    });
    const config = getConfig();

    const task = vi.fn();

    deleteOldTorrentsScheduler.schedule(config, task);

    await vi.advanceTimersByTimeAsync(2000);

    expect(deleteOldTorrentsScheduler['task']).not.toBeNull();
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('should not schedule a cron job if configuration is missing', () => {
    const task = vi.fn();
    const config = getConfig();

    deleteOldTorrentsScheduler.schedule(config, task);

    expect(deleteOldTorrentsScheduler['task']).toBeNull();
    expect(task).not.toHaveBeenCalled();
  });

  it('should not schedule a cron job if deleteAfterHitnrun is false', async () => {
    configureApp({
      deleteAfterHitnrun: false,
      deleteAfterHitnrunCron: '*/1 * * * * *',
    });

    const task = vi.fn();
    const config = getConfig();

    deleteOldTorrentsScheduler.schedule(config, task);

    await vi.advanceTimersByTimeAsync(2000);

    expect(deleteOldTorrentsScheduler['task']).toBeNull();
    expect(task).not.toHaveBeenCalled();
  });

  it('should destroy existing cron task when called again', async () => {
    const deleteAfterHitnrunCron = '*/1 * * * * *'; // Every second for testing
    configureApp({
      deleteAfterHitnrun: true,
      deleteAfterHitnrunCron,
    });
    const config = getConfig();

    const firstTask = vi.fn();
    const secondTask = vi.fn();

    deleteOldTorrentsScheduler.schedule(config, firstTask);

    db.update(configurationTable)
      .set({ deleteAfterHitnrun: false }) // Every 2 seconds
      .where(eq(configurationTable.id, 1))
      .run();

    const updatedConfig = getConfig();
    deleteOldTorrentsScheduler.schedule(updatedConfig, secondTask);
    await vi.advanceTimersByTimeAsync(2000);

    expect(deleteOldTorrentsScheduler['task']).toBeNull();
    expect(secondTask).not.toHaveBeenCalled();
  });
});
