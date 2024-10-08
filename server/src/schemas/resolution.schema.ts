import { Resolution as ResolutionEnum } from '@ctrl/video-filename-parser';
import { z } from 'zod';

export const resolutionSchema = z.nativeEnum(ResolutionEnum, {
  required_error: 'Resolution is required',
  message: `Invalid resolution value. Only the following values are allowed: ${Object.values(
    ResolutionEnum,
  ).join(', ')}`,
});

export { ResolutionEnum as Resolution };
