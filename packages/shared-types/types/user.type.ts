import { User, UserChatStat } from '@repo/db';

export type UserType = User & {
  chatStats?: UserChatStat | null;
};
