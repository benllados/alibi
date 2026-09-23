# Publish Alibi with Vercel + Render

This v0.9.0 package is prepared for a Vercel website backed by one Render Node web service. Vercel serves `public/` and forwards `/api/*` to Render. Render owns rooms, game timers, and live server-sent events. There is no build step or database.

The current game stores rooms in a single process. Moving `server.mjs` unchanged into Vercel Functions would not preserve one shared game state across instances or restarts. This deployment keeps the existing game architecture. Nothing has been deployed from this package yet.

For the existing `benllados/alibi` deployment, use [UPDATE.md](UPDATE.md). Its project folder is `alibi 6`, Render service is `https://alibi-wzrg.onrender.com`, and canonical website origin is `https://www.alib.app`. The API rewrite in this package already targets that Render service.

## 1. Put the project on GitHub

Use a personal GitHub account and GitHub Desktop:

1. Unzip the package. Open the included `alibi` folder.
2. In GitHub Desktop, sign in and choose **File → New Repository**. Name it `alibi`, choose a location you can find, and click **Create Repository**.
3. Choose **Repository → Show in Finder** (Windows: **Show in Explorer**).
4. Copy the **contents** of the downloaded `alibi` folder into this new repository folder, not the outer folder itself. Include `.gitignore` and `.env.example`. On a Mac, press **Command + Shift + .** to show hidden files while copying.
5. The repository root should now contain `package.json`, `server.mjs`, `vercel.json`, and the `public` folder. Do not copy a personal `.env` file or API key into the repository.
6. Back in GitHub Desktop, enter `Initial Alibi upload` in the Summary field and click **Commit to main**.
7. Click **Publish repository**, leave **Keep this code private** checked, and publish to your personal account.

If you already have an Alibi repository, update it with this package and commit/push the changes instead.

## 2. Create the multiplayer server on Render

1. Sign in at https://render.com and connect the GitHub account used above.
2. Choose **New → Web Service**, then select your `alibi` repository.
3. Set these fields:

| Setting | Value |
| --- | --- |
| Name | Any available name, such as `alibi-server` |
| Branch | `main` (or the branch you published) |
| Language / Runtime | Node |
| Root Directory | Leave blank when `package.json` is at the repository root |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Environment variable | `NODE_ENV` = `production` |
| Instances | One |

Choose a region near your players. Select Free for initial testing or a paid instance if you want to avoid free-tier idle sleep. You do not need a disk or database for this version. Render provides `PORT`; leave it managed by Render.

4. Click **Create Web Service** and wait for a successful deployment.
5. Copy its actual `https://...onrender.com` address. Open that address with `/api/health` appended. It should return `{"ok":true}`.

## 3. Point Vercel's API route at Render

Open `vercel.json`. The current destination is:

```text
https://alibi-wzrg.onrender.com/api/:path*
```

Keep it for Ben's existing service. For a different Render service, replace the hostname with that service's actual address.

Keep the `/api/:path*` suffix and JSON quotes. Leave the other configuration in place.

In GitHub Desktop, commit this edit with a message such as `Connect Render server`, then click **Push origin**.

## 4. Deploy the website on Vercel

1. Sign in at https://vercel.com using the same GitHub account.
2. Choose **Add New → Project**, select your `alibi` repository, and click **Import**. If it is missing, give the Vercel GitHub app access to this repository.
3. Use these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Root Directory | Repository root (`./`) |
| Build Command | Empty / no build command |
| Output Directory | `public` |
| Install Command | `npm install` (default is fine) |
| Environment Variables | None required on Vercel |

The supplied `vercel.json` already sets the framework, empty build command, and output directory. Do not set the root directory to `public`; Vercel must also read the root `vercel.json`. Do not use `npm start` as a Vercel build command.

4. Click **Deploy**.
5. Find your stable **production domain** in the project's Domains settings, such as `https://YOUR-PROJECT.vercel.app`. Use this address rather than a per-commit preview URL.

## 5. Authorize that website address on Render

1. Open your Render service's **Environment** settings.
2. Add `PUBLIC_ORIGIN` with your exact Vercel production origin, including `https://`, for example `https://YOUR-PROJECT.vercel.app`. Do not include `/join`, a room code, or any other path.
3. Save and redeploy/restart the service to apply the environment change. Wait until it is live.

This lets requests forwarded by Vercel create and join rooms. Preview URLs are intentionally not added automatically. If you later change your public domain, update `PUBLIC_ORIGIN` to match.

## 6. Optional: enable AI answers and computer drawings

On **Render**, add your own `OPENAI_API_KEY` environment variable and, if needed, `OPENAI_MODEL`. The current default is `gpt-4.1-mini`. Save and redeploy.

Keep the key out of GitHub, frontend files, and Vercel's frontend configuration. Without it, the game uses its built-in answer and drawing fallbacks. AI usage is billed separately by your API provider. The two-player drawing finale has limited truth choices without AI; three or more players have a human informed artist.

## 7. Test the public game

1. Open your Vercel production domain with `/api/health` appended; it should return `{"ok":true}`.
2. Open the main Vercel URL on your laptop and create a room.
3. Open that same website on two player devices, including a phone on cellular data. Join with the room code.
4. Confirm the players appear immediately on the host screen. Copy the invite and confirm it starts with the Vercel domain.
5. Play through a normal vote and the drawing finale, and test refreshing one player page to reconnect.

Your laptop no longer needs to run the local Node server. Share the Vercel production URL with your friends. If Vercel asks friends to sign in, review **Settings → Deployment Protection** for the production site and make the intended public game accessible.

## Limits and troubleshooting

- **Rooms disappear on server restart, redeploy, or idle sleep.** Keep Render at one instance. A paid instance avoids free-tier idle sleep but does not make rooms survive restarts. Do not deploy updates in the middle of a game.
- Render's free web services sleep after 15 minutes without inbound traffic and can take about a minute to wake. Open the game before inviting friends; the service may also restart for other reasons.
- **“Open the game from its own address.”** Check `PUBLIC_ORIGIN` on Render matches the domain actually in your browser. Apply the setting with a restart/redeploy, and use the stable production URL.
- **Vercel `/api/health` fails but Render `/api/health` works.** Check the actual Render destination in `vercel.json`, including `/api/:path*`, then commit/push and wait for Vercel's deployment.
- **Homepage works but `/join` is 404.** Check Vercel's root directory contains `vercel.json`, and that Output Directory is `public`.
- **Changes do not appear.** Commit and Push origin in GitHub Desktop, then check each service's deployment status. Both services are connected to the same repository.
- **Rooms split or are intermittently missing.** Verify you have exactly one Render instance and all clients are using the same production site. This prototype has no shared database or distributed room routing.

Local verification: 73 automated tests pass, including playground scenes and lifecycle, homepage navigation, video byte ranges, trusted/untrusted hosting origins, hosted invite-address behavior, server-sent events, private game state, complete matches, and the existing design checks. The actual Vercel-to-Render deployment must be verified after your accounts and URLs are configured.

## Official setup references

- Vercel function lifecycle: https://vercel.com/docs/functions
- Vercel Git imports: https://vercel.com/docs/git
- Vercel external rewrites: https://vercel.com/docs/routing/rewrites
- Vercel configuration: https://vercel.com/docs/project-configuration
- Render web service settings: https://render.com/docs/web-services
- Render free service limits: https://render.com/docs/free
- GitHub Desktop publishing: https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop
