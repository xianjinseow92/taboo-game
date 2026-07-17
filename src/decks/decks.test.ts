import { describe, expect, it } from 'vitest';
import { DECKS, buildDrawPile } from './index';

const entries = Object.values(DECKS);

describe('deck registry', () => {
  it('exposes all four decks', () => {
    expect(entries.map((d) => d.id).sort()).toEqual(
      ['classic', 'food-drink', 'pop-culture', 'tech-work'],
    );
  });

  it('buildDrawPile concatenates selected decks', () => {
    const pile = buildDrawPile(['classic', 'food-drink']);
    expect(pile.length).toBe(DECKS.classic.cards.length + DECKS['food-drink'].cards.length);
  });
});

describe.each(entries.map((d) => [d.id, d] as const))('deck %s', (_id, deck) => {
  it('has at least 60 valid cards', () => {
    expect(deck.cards.length).toBeGreaterThanOrEqual(60);
    const words = new Set<string>();
    for (const card of deck.cards) {
      const lower = card.word.trim().toLowerCase();
      expect(lower.length).toBeGreaterThan(0);
      expect(words.has(lower)).toBe(false);
      words.add(lower);
      expect(card.taboo).toHaveLength(5);
      for (const t of card.taboo) {
        expect(t.trim().length).toBeGreaterThan(0);
        expect(t.trim().toLowerCase()).not.toBe(lower);
      }
      expect(card.category).toBe(deck.id);
    }
  });
});
