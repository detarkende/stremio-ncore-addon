import { commands } from 'vitest/browser';
import { CopyToClipboard } from './copy-to-clipboard';
import { render } from '@/test-utils/render';

describe('CopyToClipboard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await commands.allowClipboard();
  });

  it('should render the text and button correctly', async () => {
    const screen = await render(<CopyToClipboard text="abcdefghijklmnopqrstuvwxyz" />);
    const button = screen.getByRole('button', { name: 'Copy to clipboard' });
    const icon = screen.getByTestId('icon-default');

    expect(icon).toBeVisible();
    expect(button).toBeVisible();
  });

  it('should copy text to clipboard on button click', async () => {
    const screen = await render(<CopyToClipboard text="test text" />);
    const button = screen.getByRole('button', { name: 'Copy to clipboard' });

    await button.click();
    await expect.element(screen.getByTestId('icon-copied')).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe('test text');
  });

  it('should show copied icon after successful copy', async () => {
    const screen = await render(<CopyToClipboard text="test" />);
    const button = screen.getByRole('button', { name: 'Copy to clipboard' });

    await button.click();
    await expect.element(screen.getByTestId('icon-copied')).toBeVisible();
  });

  it('should show error icon on clipboard failure', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('Failed'));
    const screen = await render(<CopyToClipboard text="test" />);
    const button = screen.getByRole('button', { name: 'Copy to clipboard' });

    await button.click();
    await expect.element(screen.getByTestId('icon-error')).toBeVisible();
  });

  it('should reset to default state after 2 seconds', async () => {
    const screen = await render(<CopyToClipboard text="test" />);
    const button = screen.getByRole('button', { name: 'Copy to clipboard' });

    await button.click();
    await expect.element(screen.getByTestId('icon-copied')).toBeVisible();

    await new Promise((resolve) => setTimeout(resolve, 2100));
    await expect.element(screen.getByTestId('icon-default')).toBeVisible();
  });
});
