import { describe, expect, it } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('is deterministic with an injected rng', () => {
    // rng always 0 swaps each element to the front in turn
    expect(shuffle([1, 2, 3, 4, 5], () => 0)).toEqual([2, 3, 4, 5, 1]);
  });

  it('returns a new array with the same members', () => {
    const input = ['a', 'b', 'c'];
    const out = shuffle(input, () => 0.99);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual(['a', 'b', 'c']);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});
