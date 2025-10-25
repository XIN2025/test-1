import { z } from 'zod';
import { ProfileSchema } from '../schemas/profile.schema';
import { User, UserProfile } from '@repo/db';

export type ProfileType = UserProfile & {
  user: User;
};
export type ProfileInput = z.infer<typeof ProfileSchema>;
