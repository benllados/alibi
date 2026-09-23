# Update Alibi to v0.11.1

This update fixes the mobile results screen and adds automatic progression after reveals. It includes the complete game and is ready to upload; it has not been deployed from this workspace.

## What changed

- Your points receipt now sits above the leaderboard on phones instead of squeezing beside it.
- Player names and score totals stay on one line. Point gains are grouped above each total, rather than overlapping names or scores.
- Tabs are now **Answers** and **Scores**, sized to fit. The leaderboard uses compact rows and fewer rows per page on smaller phones.
- Every reveal has a **10-second countdown**, visible on the host and phones. At zero, everyone moves to the next question, next round, or final results.
- The countdown is controlled by the server, so reconnecting or backgrounding the host does not restart it.
- **Pause** freezes the remaining countdown. **Next now** continues early. The final winner screen stays open until the host chooses Play again.
- Question writing remains 90 seconds, truths/lies 60 seconds, drawing 90 seconds, and voting 30 seconds. Submission phases still advance as soon as everyone required has submitted.

The menu, video, captions, poster, music, characters, and previous gameplay improvements are included. No new dependencies or environment settings are needed.

## Update your local copy

1. Stop the running server with Ctrl+C.
2. Unzip the update and open its `alibi` folder. Keep your local `.env` if you use one.
3. Run `npm start` in this new folder, or use `Start-Alibi.command` / `Start-Alibi.bat`.
4. Open `http://localhost:3000`, refresh the host and phone pages, and start a new room. Phones should use the computer's Wi-Fi address shown by the server.

## Update GitHub and the website

Your repository is `benllados/alibi`; Vercel and Render use `alibi 6` as Root Directory.

1. Open the ZIP's `alibi` folder until `public`, `package.json`, and `server.mjs` appear together.
2. Open `benllados/alibi` → `alibi 6` on GitHub.
3. Choose **Add file → Upload files** and upload the **contents** of that local folder into `alibi 6`, replacing existing files. Do not create another nested `alibi` folder.
4. Commit with `Fix mobile results and auto-advance reveals`.
5. Wait for both Vercel and Render to deploy, then refresh `https://www.alib.app` and start a new room. Do this between games, because a server restart clears active rooms.

The included `vercel.json` still uses `https://alibi-wzrg.onrender.com`; Render's `PUBLIC_ORIGIN` stays `https://www.alib.app`.

## Verification

All 96 automated checks pass. New regression checks cover complete two- and eight-player matches with automatic reveal progression, the exact 10-second deadline, synchronized snapshots, pause/resume, continuing early, stale host clicks, missing-answer reveals, final results remaining open, phone score paging, and countdown labels.

No real browser is available in this environment, so phone layout still needs a device check. After updating:

- On your phone, open Scores after the drawing reveal. The receipt should sit above a full-width table with readable names and totals.
- Let one reveal count down without touching the host; all devices should advance together after 10 seconds.
- Pause another reveal, wait, then resume. It should finish the remaining time.
- Continue early once; the next question must not be skipped when the old countdown would have ended.
