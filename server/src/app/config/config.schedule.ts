import type { ScheduledTask } from 'node-cron';
import nodeCron from 'node-cron';
import type { Configuration } from 'src/db/schema/configuration';

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

  public destroy() {
    if (!this.task) {
      return;
    }

    this.task.destroy();
    this.task = null;
  }
}

export const deleteOldTorrentsScheduler = new DeleteOldTorrentsScheduler();
