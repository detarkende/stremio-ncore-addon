import type { ScheduledTask } from 'node-cron';
import type { Configuration } from 'src/db/schema/configuration';
import nodeCron from 'node-cron';

export class DeleteOldTorrentsScheduler {
  private task: ScheduledTask | null = null;

  public schedule(config: Configuration | null, fn: () => void) {
    if (!config) {
      return;
    }
    if (this.task) {
      this.task.destroy();
      this.task = null;
    }
    if (config.deleteAfterHitnrun && config.deleteAfterHitnrunCron) {
      this.task = nodeCron.schedule(config.deleteAfterHitnrunCron, fn);
      this.task.start();
    }
  }
}

export const deleteOldTorrentsScheduler = new DeleteOldTorrentsScheduler();
