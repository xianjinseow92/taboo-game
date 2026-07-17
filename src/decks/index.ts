import type { Card, CategoryId } from './types';
import { classic } from './classic';
import { popCulture } from './pop-culture';
import { foodDrink } from './food-drink';
import { techWork } from './tech-work';

export interface Deck {
  id: CategoryId;
  label: string;
  cards: Card[];
}

export const DECKS: Record<CategoryId, Deck> = {
  classic: { id: 'classic', label: 'Classic', cards: classic },
  'pop-culture': { id: 'pop-culture', label: 'Pop Culture', cards: popCulture },
  'food-drink': { id: 'food-drink', label: 'Food & Drink', cards: foodDrink },
  'tech-work': { id: 'tech-work', label: 'Tech & Work', cards: techWork },
};

export function buildDrawPile(deckIds: CategoryId[]): Card[] {
  return deckIds.flatMap((id) => DECKS[id].cards);
}
