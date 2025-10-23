import z from 'zod';
import { GenderEnum } from '../enums/auth.enum';

export const ProfileSchema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    dateOfBirth: z.string().date(),
    timeOfBirth: z.string().optional(),
    placeOfBirth: z.string().min(1, 'Place of birth is required'),
    gender: z.string().min(1, 'Gender is required'),
  })
  .refine((d) => Object.values(GenderEnum).includes(d.gender as GenderEnum), {
    message: 'Invalid gender value',
    path: ['gender'],
  });
