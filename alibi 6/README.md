# Alibi · v0.11.1 — Clear mobile results and automatic next turns

A real-time party game for 2–8 friends. One browser is the shared TV screen; every player joins from a separate phone or browser tab. Includes generated prompts, player-written questions, bluffing, secret roles, scoring, and a drawing finale.

## Publish online

See [UPDATE.md](UPDATE.md) for updating Ben's existing GitHub/Vercel/Render deployment, or [DEPLOY.md](DEPLOY.md) for setup from scratch. The API rewrite is configured for `https://alibi-wzrg.onrender.com`. The canonical production origin on Render is `https://www.alib.app` (the apex domain redirects there). These local changes have not been published to the live site.

## Update from the previous build

Stop the old server with Ctrl+C. Unzip this build, then launch `Start-Alibi.command` or run `npm start` in the new `alibi` folder. Open http://localhost:3000 and refresh any old host/player tabs. Start a new room; in-memory matches do not carry across server restarts. This build opens with the handwritten Alibi logo, a clear game premise, and separate Join / Host choices, with joining first. Room-code invitations still open the join form directly.

## What changed in v0.11.1

- Phone results stack your point receipt above a full-width leaderboard. Names stay on one line, point gains sit with totals, and shorter Answers / Scores tabs fit their buttons.
- Score pages show fewer rows on smaller screens, with paging to reach every player.
- Every reveal advances after 10 seconds: next question, next round, or final results as appropriate. The countdown is server-controlled and visible on the host and phones. Reconnecting does not restart it.
- The host can Pause to freeze the remaining time, or choose Next now to continue early. Final results stay up until Play again. The longer writing and drawing timers are unchanged.
- The reveal countdown is quiet and does not use the urgent submission-time flashing or ticking.

## What changed in v0.11.0

- Question writing now allows **90 seconds**; regular truth/lie writing and the finale truth allow **60 seconds**. Drawing remains **90 seconds** and voting **30 seconds**. Each submission phase advances immediately when all required people are done. Starting in v0.11.1, reveals advance automatically after 10 seconds.
- The lobby has a couch full of the players’ chosen characters, a locally generated room QR code, and live customization updates.
- The shared screen has a persistent animated cast: thinking, writing, waiting, celebrating, looking smug, and reacting to votes. The informed artist looks the same as every other artist until the reveal.
- Round introductions use the smiley transition and finale flames. The server reserves 1.8 seconds before each timed phase’s countdown, so presentation does not spend the advertised writing/voting time.
- Phone inputs and drawing canvases stay mounted during ordinary live updates. Draft text and the current drawing save in the tab’s session storage and survive refresh or leaving and returning to the room.
- Sending, received, reconnecting, and paused states are explicit. A lost reply gets one retry with the exact same request ID and payload; the server does not count accepted actions twice.
- Ballots have consistent letters, selected-answer summaries, disabled self-votes, and enlarged drawing previews. All answers, owners, voters, and truth appear together at reveal.
- Scores count upward, positions move, new leaders get highlighted, and point labels travel on the shared screen. Each player has a receipt explaining their points, including role bonuses or losses.
- Private role cards pair your character with its role illustration, explain availability, show eligible targets, and remind you to use an unused power in Round 2.
- Drawing now has Undo, Redo, an eraser, undoable Clear, and an enlarged gallery. The featured person’s and artists’ instructions explain their separate jobs.
- The winner wears a crown; real match statistics determine awards, ties are supported, and Play again keeps everyone in the room with their characters.
- Added 16 prompts, bringing the regular bank to 64. House answers now also follow shared endings, along with beginnings, capitalization, punctuation, and length.
- The cleaned-up menu, approved 80-second video, poster, captions, and original soundtrack remain included. No new dependencies or environment variables are required.

## What changed in v0.10.1

- **Join a game** is first, above **Host a game**. The short room-code and laptop/TV instructions remain.
- Removed the marked top labels, extra device description, button/footer arrow icons, preview subtitle, divider wording, footer smiley, and visible playground pause control. The music control, four animated characters, and approved 80-second video remain.
- Hosting now adds a browser-history entry. Browser Back returns to the menu; Forward reconnects to the same room using saved credentials. A visible **Back to menu** link is available on the host screen, including while connecting.
- Navigation closes the old room stream and ignores delayed replies, while preserving unfinished answers and room credentials for reconnecting. Join forms also participate in browser Back/Forward.
- Character animation still respects reduced motion and suspends when the page is hidden. Retired manual-pause preferences cannot leave the cast frozen.
- All 76 automated checks pass, including navigation, reconnecting, and delayed-response regression cases. No new environment variables or dependencies are needed. This package is ready to upload and has not been deployed from this workspace.

## What changed in v0.10.0

- The feature preview is now the approved **80-second character-led walkthrough**, with the four actual menu characters speaking in large text bubbles. It covers the premise, joining, character selection, normal bluffing/scoring, player questions, secret roles, the drawing finale, host coordination, reconnecting, and the winner.
- Uses the production articulated SVG rig, handwriting, logo-to-smiley transition, cartoon finale flames, progressive drawing strokes, anonymous voting, and the frog-hat closing joke.
- The exact approved simple-language dialogue is on screen. No profanity or GPT attribution appears in the video. The separately opened project case study is unchanged.
- An 80-second edit of the original Paper Trails stems is mixed with quiet paper, selection, customization, and reveal sounds. Dialogue works entirely through speech bubbles; there is no spoken narration.
- Export: H.264, 1920×1080, 24 fps, AAC stereo, exactly 80 seconds, with fast-start metadata. Native controls, click-to-play, a new poster, an optional English caption track, and the complete dialogue transcript are included.
- The walkthrough is labeled **Example game** and uses composed gameplay examples, rather than claiming to be a recorded live match. This update is prepared locally and has not been deployed.

## What changed in v0.8.0

- **Paper Trails:** An original two-minute, 96 BPM instrumental with plucked strings/thumb-piano tones, felt keys, soft bells, warm strings, flute, bass, and light percussion. Six eight-bar sections provide a theme, contrasting middle, quiet reprise, and return.
- The two synchronized music layers loop on one Web Audio clock. Menu/lobby/reveals get the full arrangement; writing and drawing lower the melody and bright percussion smoothly without restarting the song.
- The homepage has a **♫ music** control. Open it and select **play music**. Browser permission requires a click before audio; the page does not autoplay. Creating a host room also enables music unless the device was muted. Music carries continuously from menu to host.
- Join forms and player seats stay silent. Music stops while the game is paused, the tab is hidden, or the feature-video panel is open. Closing that panel resumes it only if it was already enabled.
- Mute and volume preferences are saved on the device. Slow or failed downloads cannot start music after joining as a player or after muting; failed loads have a retry.
- Small game cues are retuned to the soundtrack. Two bundled MP3 stems total about 3.9 MB and load only when music is enabled. No music service, API key, Python, or rendering dependency is needed to play or deploy.
- `tools/compose-theme.py` contains the authored score and instrument synthesis. It does not read, sample, or bundle the supplied reference recording. Optional renderer dependencies are documented in `tools/README.md`.
- At v0.8.0, the previous 44-second visual walkthrough remained in place, with a separate music edit prepared for the subsequent character-led video.

## What changed in v0.7.0

- Characters are roughly 20–25% larger on common desktop layouts, with a smaller increase on phones. Each has a different silhouette and physical personality.
- The sequential 103-second scene loop is replaced by overlapping authored action tracks in two alternating 48-second arrangements. Football, paper folding, and wand practice begin together. Magic starts at 7 seconds; the plane launches while the magician finishes his bow; a pencil-lifting attempt overlaps the flight. Star repair overlaps solo juggling.
- The rig now has separate torso movement, bent elbows and knees, planted walking steps, open/gripping/pointing/clapping hands, profile turns, expressive mouths and brows, nose/cheek details, and independent cape, glasses, flower, and hat movement.
- Magic includes the wrong object from a sleeve, hat-eye blink, sprouting legs, crouching and stretching frog jumps, head-patting panic, hat regrowth, and an exaggerated bow. The football impact, hat handoff, paper folds, pencil stop, and late reactions have sharper timing.
- Held objects are resolved against the final hand pose after overlapping actions run. The frog on Cowboy’s hat follows his moving head. State such as the crooked star survives across activities.
- Form/modal quiet mode preserves the scene clock; closing a panel resumes instead of restarting the opening. Pause, reduced-motion handling, hidden-tab suspension, and cleanup on game entry remain.
- No new runtime dependencies or environment settings. The existing gameplay, favicon, and professional feature walkthrough are preserved.

## What changed in v0.6.0

- A simpler front page: the large Alibi logo, “Your friends are the trivia,” one short explanation, player/device facts, and the Host / Join panel. The crossed-out tagline, sticker cluster, and round-summary strip are replaced by a four-character playground.
- Four articulated characters use the actual in-game avatar pieces: Frog in overalls, a mustached Cowboy, Flower in heart glasses, and Cape, who becomes a magician. Their eyes, expressions, heads, arms, feet, and hats move separately.
- Five connected scenes: a football accident and hat rescue; the frog-hat magic trick and regrowth; visible paper folding and a plane around the logo and panel; a borrowed-pencil ride; and repairing the star knocked crooked earlier.
- The first magic trick starts at 22 seconds. The 103-second sequence includes quiet gaps between scenes. The effects are silent and adapt their positions to the measured menu geometry.
- The join form and open panels put the cast into a quieter idle. The animation layers never accept pointer events, so buttons and fields stay clickable. Animation stops on game entry and while the page is hidden.
- A small pause control remembers the device’s preference. OS reduced-motion preferences show the four static characters. Mobile sizes use a compact stage; opening the phone keyboard hides the stage.
- No extra packages, API calls, or environment variables are required. The existing yellow icon, professional feature video, and game rules are preserved.

## What changed in v0.5.1

- The desktop homepage has a larger logo, wider action panel, larger buttons, and more prominent doodles. Compact layouts retain their own sizing.
- The homepage, project panel, video, and video poster use profanity-free copy. In-game copy is unchanged.
- The favicon is a tightly cropped yellow version of the original scribbled smiley. The page uses a new PNG filename to avoid the old cached icon.

## What changed in v0.5

- The homepage explains the premise and device setup before asking for a room code. Host and Join have separate paths; form drafts survive switching between them. The notebook, jokes, and doodles remain.
- **See it in action** opens a 44-second, 720p H.264 walkthrough. It uses the actual character, logo, and doodle SVG assets in animated example scenes. It is labeled as an animated walkthrough, not recorded gameplay. Captions are built into the picture; it is silent, does not autoplay, and has a text transcript. Closing it stops playback.
- The walkthrough covers character customization, room joining, the smiley transition, bluff voting, private drawing assignments, drawing strokes, the gallery reveal, and the crowned winner. Short captions explain the implementation.
- **About the project** describes the product problem, Ben's GPT-assisted iteration, the architecture, and the current single-server memory limitation.
- Native video seeking is supported by byte-range responses on the local/Render server. Vercel serves the video directly as a static asset. The file is about 1.2 MB.

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

4. Open **http://localhost:3000** on your computer and choose **Host a game**.
5. Keep the terminal open while you play. Press Ctrl+C to stop.

On macOS you can also double-click **Start-Alibi.command**. If macOS asks to open the downloaded script, use Terminal and `npm start` instead. On Windows, use **Start-Alibi.bat**.

If port 3000 is already occupied, macOS/Linux users can run `PORT=3001 npm start` and open http://localhost:3001. In Windows PowerShell, use `$env:PORT=3001; npm start`.

## Enable AI answer matching and computer drawings

1. Copy `.env.example` to a file named `.env` in the `alibi` folder. On macOS/Linux, run `cp .env.example .env`. On Windows PowerShell, run `Copy-Item .env.example .env`.
2. Open `.env` in a text editor and put your OpenAI API key after `OPENAI_API_KEY=`. Keep this key on your computer.
3. Leave `OPENAI_MODEL=gpt-4.1-mini` as provided, then restart the server. The terminal will print **House answers: AI enabled** when a key is configured. That message indicates configuration, not a successful API check.

AI needs an internet connection and uses your OpenAI API account. The server sends the question and unlabeled submitted answers for house bluffs, or the question and assigned answer descriptions for computer drawings. The key stays on the server; it is never served to players. Calls use `store: false`. Implementation references: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

House answers are generated only when extra options are needed in two- or three-player regular turns. The game briefly displays “Shuffling the papers…,” then starts the full 30-second vote timer. Slow or invalid results fall back to local answers; late results cannot change an open ballot. If AI is unavailable, the terminal reports that local fallback is being used.

Computer sketches are prepared during the drawing timer. Local doodles cover common objects, animals, foods, and places. In a **two-player finale**, a free-form answer the local artist cannot recognize needs AI; without it, the featured player is asked to choose a concrete answer or replace the question. If AI cannot draw an unsupported answer, the game asks for a new answer rather than displaying an unrelated true drawing. Three-player games have a human informed artist, so this restriction does not apply.

## Test by yourself

Host a game. Click **Open player tab** twice and join under two different names. Keep the host tab visible and switch between the two player tabs. Each tab has its own private session. Start the match from the host screen.

Reveals advance automatically after 10 seconds. The host can **Pause** to freeze that countdown or choose **Next question / Next round now** to continue early. During submission phases, **End timer** remains available. End timer skips missing submissions; if the truth or informed drawing is missing, the whole turn is skipped without points.

Refresh any tab to reconnect to the same seat. A submitted answer or drawing stays submitted. Unsubmitted text and the current drawing are saved in this tab’s session storage and restored after refresh. They are not transferred to another device or a new private browsing session.

## Play on phones and a TV

1. Connect all devices to the same Wi-Fi as the computer running the server.
2. Use the **Phones on the same Wi-Fi** address printed in Terminal. The host lobby also shows it, for example `http://192.168.1.50:3000`.
3. Players open that address on their phones, enter the room code, and join.
4. Show the host screen on a TV using a cable or screen sharing, or open the network address in the TV browser and create the room there.

`localhost` on a phone points to that phone, not your computer. Use the computer’s network address on other devices. If devices cannot connect, check that the computer allows Node through its firewall and that the Wi-Fi does not isolate guests. If network discovery is unavailable, use your computer’s Wi-Fi IP address followed by `:3000`.

## Rules implemented

### Round 1 — Our questions

Each player gets one spotlight turn. The game picks a personal question from a shuffled bank of 64 prompts. The featured player submits the truth; the others submit lies. Truths and lies are written simultaneously with a 60-second limit, then eligible players have 30 seconds to vote. Your own lie is never a valid vote.

A correct answer earns 500 points. Each person fooled earns the bluff’s author 250. The featured player does not vote. If identical lies are merged, each contributing author receives the lie points; matching the true answer never earns lie points.

### Round 2 — Your questions

Players have 90 seconds to write one question about an assigned friend. Every player is assigned a different friend and receives exactly one question. Each question then becomes a normal spotlight turn with the same timers and scoring. Missing questions receive generated replacements. A featured player can request a new prompt before answering, without a penalty.

### Round 3 — The drawing finale

One randomly selected person gets 60 seconds to privately answer a drawable prompt about themselves. They then watch the drawing and voting and explain their answer at the reveal.

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
- This package supports the existing Vercel/Render deployment; these changes have not been deployed from this workspace. There is no database, voice chat, moderation dashboard, or automated artwork judging. Players enforce the drawing rule together.
- 96 automated checks cover complete 2-, 3-, 4-, and 8-player games, real HTTP/SSE networking, private state, timers, simulated AI success/failure, character validation and synchronization, and rendering every game phase for eight players. New checks cover exact retry payloads, score receipts and privacy, automatic progression, preserved live inputs/canvas state, drawing undo/redo, public character reactions, and reference QR encoding. They also check the playground’s scene progression, prop attachment and continuity, simultaneous activities, alternate scene orders, desktop/phone geometry, animation lifecycle and reduced motion, static module delivery, homepage navigation, video seeking, long-answer paging, adaptive music levels, synchronized loop sources, menu-to-host continuity, remembered mute/volume, hidden-tab and preview suspension, download failure/race recovery, that player clients cannot initialize music, trusted hosting origins, and hosted invite-address behavior.
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
- `public/playground-scene.js`: deterministic choreography and character poses.
- `public/playground.js`: articulated SVG rendering, measured menu anchors, and animation lifecycle.
- `public/gameplay-cast.js` / `public/gameplay-ui.js` / `public/gameplay.css`: live character behavior, phase instructions, role availability, score receipts, and game layouts.
- `public/qr.js`: local room invitation QR encoding; no external image service.
- `public/playground.css`: simplified homepage layout and responsive stage.
- `public/art.js` / `public/logo.js`: original doodles, role art, and outlined Smile Moon wordmark.
- `public/audio.js` / `public/music/`: original menu/host soundtrack, adaptive playback, and game cues.
- `public/fonts/`: supplied Smile Moon font, served locally.
- `public/art/paper.svg`: lightweight procedural paper grain.
- `public/style.css`: notebook styling, fixed-height layouts, keyboard treatment, and animation.
- `test/`: full-match, scoring, privacy, role, timer, networking, AI fallback, avatar, and view-rendering tests.

The browser submits actions by HTTP POST and receives immediate state updates through a persistent server-sent events connection. EventSource automatically reconnects; a reconnect gets the current private snapshot. No polling or client-side score authority is used.
