import { rateList } from './rate-list';

describe('rateList', () => {
  it('should return items ordered by their combined rating', () => {
    const items = [
      { name: 'low', priority: 1 },
      { name: 'high', priority: 3 },
      { name: 'medium', priority: 2 },
    ];

    expect(rateList(items, [(item) => item.priority])).toEqual([
      items[1],
      items[2],
      items[0],
    ]);
  });

  it('should combine ratings and pass the original index to scorers', () => {
    const items = ['first', 'second', 'third'];
    const rateByLength = (item: string) => item.length;
    const rateByIndex = (_item: string, index: number) => index * 10;

    expect(rateList(items, [rateByLength, rateByIndex])).toEqual([
      'third',
      'second',
      'first',
    ]);
  });

  it('should return only the requested number of top-rated items', () => {
    const items = [1, 2, 3];

    expect(rateList(items, [(item) => item], 2)).toEqual([3, 2]);
  });

  it('should return an empty list when given no items', () => {
    expect(rateList([], [() => 1])).toEqual([]);
  });
});
