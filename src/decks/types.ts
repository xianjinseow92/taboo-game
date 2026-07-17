export type CategoryId = 'classic' | 'pop-culture' | 'food-drink' | 'tech-work';

export interface Card {
  word: string;
  taboo: [string, string, string, string, string];
  category: CategoryId;
}
