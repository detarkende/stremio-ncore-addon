export const clamp = (value: number, { min, max }: { min: number; max: number }) => {
	return Math.min(Math.max(value, min), max);
};
