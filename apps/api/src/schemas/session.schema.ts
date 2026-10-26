import { z } from 'zod';

export const CreateSessionSchema = z.object({
  durationMinutes: z
    .number({ invalid_type_error: 'durationMinutes must be a number' })
    .int('durationMinutes must be an integer')
    .min(5, 'Minimum duration is 5 minutes')
    .max(480, 'Maximum duration is 480 minutes (8 hours)')
    .default(30),
  title: z
    .string()
    .trim()
    .max(60, 'Title cannot exceed 60 characters')
    .optional()
    .nullable(),
  passcode: z
    .string()
    .regex(/^\d{4,8}$/, 'Passcode must be between 4 and 8 digits')
    .optional()
    .nullable(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

export const VerifyPasscodeSchema = z.object({
  passcode: z
    .string({ required_error: 'Passcode is required' })
    .regex(/^\d{4,8}$/, 'Passcode must be between 4 and 8 numeric digits'),
});

export const ExtendSessionSchema = z.object({
  additionalMinutes: z
    .number({ required_error: 'additionalMinutes is required' })
    .int('additionalMinutes must be an integer')
    .min(5, 'Minimum extension is 5 minutes')
    .max(120, 'Maximum single extension is 120 minutes'),
});

export const SessionIdParamSchema = z.object({
  sessionId: z.string().min(6).max(64),
});

