import { Resolution } from '@sna/server';
import type { SelectOption } from '@/components/form/fields/select';

export const resolutionLabelMap: Record<Resolution, string> = {
  [Resolution.R480P]: '480p',
  [Resolution.R540P]: '540p',
  [Resolution.R576P]: '576p',
  [Resolution.R720P]: '720p',
  [Resolution.R1080P]: '1080p',
  [Resolution.R2160P]: '2160p',
};

export const resolutionOptions: SelectOption<Resolution>[] = Object.values(
  Resolution,
).map((value) => ({
  label: resolutionLabelMap[value],
  value,
}));
