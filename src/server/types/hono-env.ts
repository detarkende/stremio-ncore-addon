import type { Session } from '@server/db/schema/sessions';

import type { User } from './user';

export type HonoEnv = {
  Variables:
    | {
        user: User;
        session: Session;
      }
    | {
        user: null;
        session: null;
      };
};
