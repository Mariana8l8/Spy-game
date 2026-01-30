# SPY GAME

A lightweight web version of the board game “Spyfall.” Players get hidden roles; spies try to guess the location based on conversation hints.

## What’s inside
- Onboarding slider with rules on the start page (index.html).
- Settings menu: player count, spy count, round duration, player names.
- Role generation and random location from a JSON file; config stored in sessionStorage.
- Per-player role reveal screens, auto-start timer, and final spy reveal.
- Responsive HTML/CSS layout, plain JavaScript logic.

## How to run
1) Open [index.html](index.html) in a browser (double-click or via a local server).
2) Browse the rules slider and move to the menu.
3) Set up players/spies/time/names and click “LET'S PLAY!!!”.
4) On the game page, reveal roles for each player in turn. After the last one, the timer starts automatically.

## Settings and data
- Locations are in [locations.json](locations.json). Add a new one like:
	```json
	{ "name": "New location", "hint": "Short hint for locals" }
	```
- Player names persist only for the session and update when the player count changes.
- Defaults: 3–12 players, 1–(players–1) spies, timer 3–40 minutes.

## Structure
- Start/rules: [index.html](index.html)
- Settings menu: [menu.html](menu.html)
- Game page: [game.html](game.html)
- Logic: [script.js](script.js)
- Styles: [style.css](style.css)
- Location data: [locations.json](locations.json)

## Technical notes
- Pure HTML/CSS/JS; no external dependencies or build step.
- Game state saved in `sessionStorage` under `spyGameConfig`.
- Timer and role flow run fully client-side; no backend required.

## Ideas for improvements
- “New game” button after the timer ends with fresh role generation.
- Persist settings between sessions via localStorage.
- WebRTC/WebSocket sync for remote play.
- Timer-end sound and clearer visual cues for spies/locals.