import { watchHistoryTable } from '@/db/schema/watch-history';
import { Database } from '@/db/client';
import { eq, desc, and } from 'drizzle-orm';

export class WatchHistoryService {
  constructor(private db: Database) {}

  public async recordWatchHistory(
    userId: number,
    type: string,
    imdbId: string,
  ): Promise<void> {
    this.db.insert(watchHistoryTable).values({ userId, type, imdbId }).run();
  }

  public async getLastWatchedByType(userId: number, type: string): Promise<string[]> {
    const records = await this.db
      .select({ imdbId: watchHistoryTable.imdbId })
      .from(watchHistoryTable)
      .where(and(eq(watchHistoryTable.userId, userId), eq(watchHistoryTable.type, type)))
      .orderBy(desc(watchHistoryTable.watchedAt))
      .limit(3)
      .all();
    return records.map((record: { imdbId: string }) => record.imdbId);
  }
}
