import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  usersTable: {
    sessions: r.many.sessionsTable({
      from: r.usersTable.id,
      to: r.sessionsTable.userId,
    }),
    torrents: r.many.usersTorrentsTable({
      from: r.usersTable.id.through(r.usersTorrentsTable.userId),
      to: r.torrentsTable.infoHash.through(r.usersTorrentsTable.torrentInfoHash),
    }),
  },
  torrentsTable: {
    users: r.many.usersTorrentsTable({
      from: r.torrentsTable.infoHash.through(r.usersTorrentsTable.torrentInfoHash),
      to: r.usersTable.id.through(r.usersTorrentsTable.userId),
    }),
  },
  sessionsTable: {
    user: r.one.usersTable({
      from: r.sessionsTable.userId,
      to: r.usersTable.id,
    }),
  },
}));
