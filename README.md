# Taboo

A party companion for playing Taboo in person: card deck, turn timer, scoring, and scoreboard on one shared device.

## Run

npm install
npm run dev

Open the printed URL. With `--host` (default in the dev script) any phone on the same Wi-Fi can open the network URL.

## How to play

+1 per correct guess, -1 when buzzed for a taboo word, skips are free. Configure teams, decks, timer, and game mode on the setup screen. Decks live in `src/decks/*.ts`, add cards by editing those files (each card needs exactly 5 taboo words, validated by `npm run test`).

## Tests

npm run test
