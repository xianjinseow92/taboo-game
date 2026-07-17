# Taboo

A fast, party-ready Taboo companion for in-person game nights: big cards, a built-in timer, live scoring, turn recaps, and a clean shared-device flow that keeps the game moving.

## What it is

- A browser-based Taboo sidekick built for loud, fast, pass-the-phone party rounds
- Designed for one shared device so the clue-giver can grab it, play the turn, and hand it off
- Packed with the essentials: curated decks, countdown timer, scoring, recaps, and a winner screen

## Features

- Fast shared-device flow with setup, get-ready, play, recap, and winner screens
- Built-in turn timer and live score tracking
- Multiple decks and configurable game settings
- Auto-save using browser `localStorage`
- Resume game after a refresh or accidental close on the same device/browser
- Safe fallback when saved state is missing or corrupted: the app starts fresh instead of crashing
- Local-first architecture with no backend required

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL on the host machine.

The dev server uses `vite --host`, so other devices on the same Wi-Fi can also open the printed network URL and load the app in their browser.

Important:

- This does not create a shared multiplayer session.
- This computer only serves the HTML, CSS, and JavaScript files.
- Each device runs its own separate copy of the app.
- Each device keeps its own local game state in its own browser storage.
- Access from outside the local network is not set up by default.

## How hosting works

- The host machine acts as a simple web server during development.
- Other devices on the same local network can request the frontend files from it.
- There is no backend, shared database, or realtime sync layer in this project.
- If multiple people open the URL on different devices, they do not join the same game session.

## Gameplay

- `+1` per correct guess
- `-1` when buzzed for saying a taboo word
- Skips are free
- Teams, decks, timer, and game mode are configured on the setup screen

## Decks

Decks live in `src/decks/*.ts`.

To add cards, edit those files directly. Each card must have exactly 5 taboo words. This is validated by the test suite.

## Development

```bash
npm run test
npm run build
npm run preview
```

- `npm run test` runs the Vitest suite
- `npm run build` creates a production build
- `npm run preview` serves the built app locally for preview
