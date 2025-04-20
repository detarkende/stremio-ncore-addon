import type { User } from './user';
import type { Session } from '@/db/schema/sessions';

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
