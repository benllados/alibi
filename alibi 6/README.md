# Alibi · v0.4.1 — The notebook build

A real-time party game for 2–8 friends. One browser is the shared TV screen; every player joins from a separate phone or browser tab. Includes generated prompts, player-written questions, bluffing, secret roles, scoring, and a drawing finale.

## Publish online

See [DEPLOY.md](DEPLOY.md) for step-by-step Vercel + Render instructions. This patch adds the static-site configuration, an explicit `PUBLIC_ORIGIN` setting for forwarded API requests, and public invite links in hosted mode. Replace the placeholder Render destination in `vercel.json` before deploying. Nothing has been published yet.

## Update from the previous build

Stop the old server with Ctrl+C. Unzip this build, then launch `Start-Alibi.command` or run `npm start` in the new `alibi` folder. Open http://localhost:3000 and refresh any old host/player tabs. Start a new room; in-memory matches do not carry across server restarts. This build opens with a handwritten Alibi logo, notebook paper, and a “get in here” join sheet.

## What changed in v0.4

- **Notebook design:** Light ruled paper, grain, crooked stationery, tape, original doodles, and the supplied Smile Moon font. The browser tab still says Alibi and uses your smiley.
- **A little freak for everyone:** Pick a head, one of 12 hats, glasses, facial hair, an outfit, a pose, and a color. Customize before joining or in the lobby. Characters travel with names into the player wall, submission status, revealed votes, scores, and the winner screen. Choices are saved on the device and validated on the server.
- **Phone controllers:** Fixed-height pages, prominent actions, and page buttons for answers and scoreboards. Long answers get their own page. Roles open on a separate private sheet. The drawing canvas fits its available area and keeps pointer coordinates aligned.
- **Motion:** The logo’s two i dots become smiley eyes, a circle and smile draw on, and the screen zooms through the face. The finale adds cartoon flames. Reveals show everything at once, followed by score swoops, point counts, and paper confetti. The winner’s avatar gets a crown. Reduced-motion preferences are respected.
- **TV-only audio:** An original synthesized 88 BPM instrumental loop with small join, countdown, reveal, and victory cues. No music downloads or external audio services. It starts when the host creates a room; the music button controls mute and volume. Reconnected host tabs need a click to enable sound. Player devices stay silent. Music pauses when the game is paused or the host tab is hidden.
- **Writing:** Shorter instructions, absurd waiting jokes, teasing, and profanity throughout. This version is intentionally not family-friendly.

The existing three-round gameplay, secret powers, AI answer matching, and clarified drawing finale are carried forward. Avatar customization is for doodle characters; this version does not use selfies.

## Start locally

Requires **Node.js 20 or newer**. There are no dependencies to install. An API key is optional; see below to enable AI generation.

1. Unzip this folder.
2. Open a terminal in the `alibi` folder.
3. Run:

   ```sh
   npm start
   ```

4. Open **http://localhost:3000** on your computer and choose **Start a game**.
5. Keep the terminal open while you play. Press Ctrl+C to stop.

On macOS you can also double-click **Start-Alibi.command**. If macOS asks to open the downloaded script, use Terminal and `npm start` instead. On Windows, use **Start-Alibi.bat**.

If port 3000 is already occupied, macOS/Linux users can run `PORT=3001 npm start` and open http://localhost:3001. In Windows PowerShell, use `$env:PORT=3001; npm start`.

## Enable AI answer matching and computer drawings

1. Copy `.env.example` to a file named `.env` in the `alibi` folder. On macOS/Linux, run `cp .env.example .env`. On Windows PowerShell, run `Copy-Item .env.example .env`.
2. Open `.env` in a text editor and put your OpenAI API key after `OPENAI_API_KEY=`. Keep this key on your computer.
3. Leave `OPENAI_MODEL=gpt-4.1-mini` as provided, then restart the server. The terminal will print **House answers: AI enabled** when a key is configured. That message indicates configuration, not a successful API check.

AI needs an internet connection and uses your OpenAI API account. The server sends the question and unlabeled submitted answers for house bluffs, or the question and assigned answer descriptions for computer drawings. The key stays on the server; it is never served to players. Calls use `store: false`. Implementation references: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

House answers are generated only when extra options are needed in two- or three-player regular turns. The game briefly displays “Getting the choices ready,” then starts the full 30-second vote timer. Slow or invalid results fall back to local answers; late results cannot change an open ballot. If AI is unavailable, the terminal reports that local fallback is being used.

Computer sketches are prepared during the drawing timer. Local doodles cover common objects, animals, foods, and places. In a **two-player finale**, a free-form answer the local artist cannot recognize needs AI; without it, the featured player is asked to choose a concrete answer or replace the question. If AI cannot draw an unsupported answer, the game asks for a new answer rather than displaying an unrelated true drawing. Three-player games have a human informed artist, so this restriction does not apply.

## Test by yourself

Host a game. Click **player tab +** twice and join under two different names. Keep the host tab visible and switch between the two player tabs. Each tab has its own private session. Start the match from the host screen.

The host can **pause**, **end timer**, and choose **next mess** after each reveal. End timer skips missing submissions; if the truth or informed drawing is missing, the whole turn is skipped without points.

Refresh any tab to reconnect to the same seat. A submitted answer or drawing stays submitted. Unsubmitted form text/drawings survive ordinary live updates, but are not saved across a page refresh.

## Play on phones and a TV

1. Connect all devices to the same Wi-Fi as the computer running the server.
2. Use the **Phones on the same Wi-Fi** address printed in Terminal. The host lobby also shows it, for example `http://192.168.1.50:3000`.
3. Players open that address on their phones, enter the room code, and join.
4. Show the host screen on a TV using a cable or screen sharing, or open the network address in the TV browser and create the room there.

`localhost` on a phone points to that phone, not your computer. Use the computer’s network address on other devices. If devices cannot connect, check that the computer allows Node through its firewall and that the Wi-Fi does not isolate guests. If network discovery is unavailable, use your computer’s Wi-Fi IP address followed by `:3000`.

## Rules implemented

### Round 1 — The warm-up

Each player gets one spotlight turn. The game picks a personal question from a shuffled bank of 48 prompts. The featured player submits the truth; the others submit lies. Truths and lies are written simultaneously with a 30-second limit, then eligible players have 30 seconds to vote. Your own lie is never a valid vote.

A correct answer earns 500 points. Each person fooled earns the bluff’s author 250. The featured player does not vote. If identical lies are merged, each contributing author receives the lie points; matching the true answer never earns lie points.

### Round 2 — Your dirty questions

Players have 60 seconds to write one question about an assigned friend. Every player is assigned a different friend and receives exactly one question. Each question then becomes a normal spotlight turn with the same timers and scoring. Missing questions receive generated replacements. A featured player can request a new prompt before answering, without a penalty.

### Round 3 — Sketchy shit

One randomly selected person gets 30 seconds to privately answer a drawable prompt about themselves. They then watch the drawing and voting and explain their answer at the reveal.

In a game with 3–8 players, one **other** player secretly receives the exact answer. That person draws the real answer; every remaining player sees only the question and draws a believable guess. Artists have 90 seconds. No words or initials. The featured person and informed artist do not vote. Blind artists have 30 seconds to find the informed artist’s drawing, excluding their own.

For example: Ben answers “my house” to “What’s Ben’s favorite safe space?” Jac receives “my house” and draws it. Everyone except Ben and Jac only sees the question, draws a guess, then votes. Ben watches. The designated informed drawing is the correct option, even if a bluff artist happened to guess the same answer.

A correct guess earns 1,000. A fake drawing earns its human author 500 per fooled voter. The featured person and informed human artist each earn 500 per correct voter. Computers never receive points. There is one finale turn. The final leaderboard reveals secret roles and declares the highest score the winner, with shared wins for ties.

### Small groups

- **Three players:** Regular turns receive matching house decoys when available. In the finale, the featured person watches, another human is informed, and the third human draws blind and votes. Two computer bluff drawings bring the ballot to four pictures, with three eligible choices for the voter.
- **Two players:** On each normal turn, the featured player writes a truth and a lie. The opponent guesses among them and up to two matching house decoys. There is one turn per player in each of the first two rounds. In the single finale turn, the featured person answers and watches; a computer draws the truth. The other human draws blind and then guesses among the computer’s true drawing and two computer bluffs. Their own drawing is visible but cannot be selected. Correct guess: 1,000; featured person: 500.

### Secret roles

Every player receives a different role. Each role can be used once in Round 1 or 2 and expires before Round 3.

| Role | Power |
| --- | --- |
| Detective | Eliminate one wrong answer privately before voting. |
| Gambler | A correct guess earns 1,000; a wrong or missing guess loses 250 after activating the wager. |
| Forger | Submit two lies during one writing turn. |
| Accomplice | Pick another voter; get 500 if they find the truth. |
| Bounty Hunter | Pick another voter; get 500 extra if they choose your lie. |
| Mind Reader | Peek at another player’s locked vote before casting yours. |
| Showboat | Earn 500 per fooled voter for your lie on this turn. |
| Lucky Break | Choose up to two answers; get 500 once if either is true. Each selected lie can still earn its author points. |

Forger and Mind Reader are excluded from two-player games. Role controls appear only during eligible turns. Powers are private; the host never receives them before the final reveal.

## Current scope

- This is a prototype supporting local play or one hosted server. Rooms live in server memory and disappear when the server stops. Inactive rooms expire after 24 hours.
- Questions come from the built-in prompt banks and players. AI, when configured, generates house answers and small-group computer sketches. Local answer fallback may produce fewer choices when it cannot find enough relevant alternatives.
- Unrevealed answers, drawing assignments, vote ownership, and role powers are filtered by the server for each recipient.
- Drawing uses validated vector strokes and works with a mouse, touch, or a stylus.
- There is no public internet deployment, database, voice chat, moderation dashboard, or automated artwork judging. Players enforce the drawing rule together.
- 54 automated checks cover complete 2-, 3-, 4-, and 8-player games, real HTTP/SSE networking, private state, timers, simulated AI success/failure, character validation and synchronization, and rendering every game phase for eight players. They also check long-answer paging, that player clients cannot initialize music, trusted hosting origins, and hosted invite-address behavior.
- The actual vector logo, character combinations, and sticker artwork were rendered and visually inspected. The browser download was blocked in this environment, so real browser layout, touch, animation, and audio playback have not been verified here. Fixed-height phone behavior needs local testing, particularly with the keyboard open and on very short screens. Live OpenAI calls remain untested without a key.

## Development and tests

```sh
npm test
```

- `game.mjs`: authoritative state machine, timers, roles, visibility, and scoring.
- `prompts.mjs`: regular and drawing prompt banks.
- `decoys.mjs`: question-aware house answers and answer-style matching.
- `ai-decoys.mjs`: optional OpenAI house-answer generation with validation and timeout fallback.
- `sketches.mjs` / `ai-sketches.mjs`: local and optional AI computer drawings.
- `config.mjs`: optional local `.env` configuration loader.
- `hosting.mjs`: trusted public origin and local/hosted network behavior.
- `vercel.json` / `DEPLOY.md`: static frontend routing and deployment instructions.
- `server.mjs`: HTTP API, server-sent event updates, room authentication, static files.
- `public/app.js`: notebook views, character editor, private role sheets, paged ballots, submissions, transitions, scores, and touch canvas.
- `public/characters.js`: shared avatar vocabulary, validation, and vector rendering.
- `public/art.js` / `public/logo.js`: original doodles, role art, and outlined Smile Moon wordmark.
- `public/audio.js`: original host-only music and cues.
- `public/fonts/`: supplied Smile Moon font, served locally.
- `public/art/paper.svg`: lightweight procedural paper grain.
- `public/style.css`: notebook styling, fixed-height layouts, keyboard treatment, and animation.
- `test/`: full-match, scoring, privacy, role, timer, networking, AI fallback, avatar, and view-rendering tests.

The browser submits actions by HTTP POST and receives immediate state updates through a persistent server-sent events connection. EventSource automatically reconnects; a reconnect gets the current private snapshot. No polling or client-side score authority is used.
