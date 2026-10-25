import { fetch } from 'undici';

export const fetchMock = vi.mocked(fetch as unknown as typeof global.fetch);
