import { render } from '@client/test-utils/render';
import { handleHttpError } from '@client/utils/http';

import { AddonUrl } from './addon-url';
import { Text } from './text';

describe('basic client components', () => {
  it('should render text with the requested element and variant', async () => {
    const screen = await render(
      <Text as="h1" variant="heading-lg" data-testid="heading">
        Example heading
      </Text>,
    );

    const heading = screen.getByTestId('heading');
    expect(heading.element().tagName).toBe('H1');
    expect(heading).toHaveTextContent('Example heading');
  });

  it('should render addon links and toggle URL wrapping', async () => {
    const url = 'https://addon.example/manifest.json?token=test value';
    const screen = await render(<AddonUrl url={url} label="Addon URL" />);

    expect(screen.getByRole('button', { name: 'Stremio App' })).toHaveAttribute(
      'href',
      'stremio://addon.example/manifest.json?token=test value',
    );
    expect(screen.getByRole('button', { name: /Stremio Web/ })).toHaveAttribute(
      'href',
      `https://web.stremio.com/#/addons?addon=${encodeURIComponent(url)}`,
    );

    const code = screen.getByText(url);
    await code.click();
    expect(code).toHaveClass('wrap-break-word');
  });

  it('should throw the response body from handleHttpError', async () => {
    await expect(
      handleHttpError(new Response('Request failed', { status: 500 })),
    ).rejects.toThrow('Request failed');
  });

  it('should fall back to the status when the response body cannot be read', async () => {
    const response = new Response(null, { status: 503 });
    vi.spyOn(response, 'text').mockRejectedValueOnce(new Error('read failed'));

    await expect(handleHttpError(response)).rejects.toThrow('HTTP error. Status: 503');
  });
});
