import { Session } from '@/db/schema/sessions';
import { User } from './user';

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
