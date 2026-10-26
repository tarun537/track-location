import { z } from 'zod';

export const LocationUpdateSchema = z.object({
  latitude: z
    .number({ required_error: 'latitude is required' })
    .min(-90.0, 'Latitude must be between -90 and 90')
    .max(90.0, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ required_error: 'longitude is required' })
    .min(-180.0, 'Longitude must be between -180 and 180')
    .max(180.0, 'Longitude must be between -180 and 180'),
  accuracy: z
    .number({ required_error: 'accuracy is required' })
    .min(0, 'Accuracy must be positive')
    .max(5000, 'Accuracy too coarse (>5000m) to broadcast'),
  heading: z
    .number()
    .min(0)
    .max(360)
    .nullable()
    .optional(),
  speed: z
    .number()
    .min(0)
    .max(150, 'Speed exceeds plausible threshold (150 m/s)')
    .nullable()
    .optional(),
  altitude: z
    .number()
    .nullable()
    .optional(),
  timestamp: z
    .union([z.number(), z.string(), z.date()])
    .optional(),
});

export type LocationUpdateInput = z.infer<typeof LocationUpdateSchema>;
