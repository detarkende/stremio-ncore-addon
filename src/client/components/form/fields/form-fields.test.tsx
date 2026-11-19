import { render } from '@client/test-utils/render';

vi.mock('../index', () => ({
  useFieldContext: () => ({
    name: 'field',
    state: {
      value: 'one',
      meta: { isDirty: true, isValid: true, errors: [] },
    },
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
  }),
}));

import { CheckboxField } from './checkbox';
import { MultiSelectField, SelectField } from './select';
import { TextField } from './text-field';

describe('form fields', () => {
  it('should render a text field from its context', async () => {
    const screen = await render(<TextField label="Name" />);

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
  });

  it('should render single and multi select options', async () => {
    const screen = await render(
      <>
        <SelectField label="Single" options={[{ label: 'One', value: 'one' }]} />
        <MultiSelectField label="Multiple" options={[{ label: 'One', value: 'one' }]} />
      </>,
    );

    expect(screen.getByText('Single', { exact: true })).toBeVisible();
    expect(screen.getByText('Multiple', { exact: true })).toBeVisible();
  });

  it('should render a checkbox from its context', async () => {
    const screen = await render(<CheckboxField>Accept terms</CheckboxField>);

    expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toBeVisible();
  });
});
