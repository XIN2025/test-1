import { z } from 'zod';
import { LoginSchema } from '../schemas';
import { RegisterEmailSchema, SetPasswordSchema } from '../schemas/auth.schema';

export type AuthContextType = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean | undefined;
  horoscopeDetails: string;
  gender: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  redirectUrl: string | null;
};

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterEmailInput = z.infer<typeof RegisterEmailSchema>;
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;
