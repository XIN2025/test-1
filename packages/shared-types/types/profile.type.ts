import { z } from 'zod';
import { ProfileSchema } from '../schemas/profile.schema';

export type ProfileInput = z.infer<typeof ProfileSchema>;
