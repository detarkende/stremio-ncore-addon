export const validations = {
  required: 'This field is required',
  invalidUrl: 'Invalid URL',
  email: 'Invalid email',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be at most ${max} characters`,
};
