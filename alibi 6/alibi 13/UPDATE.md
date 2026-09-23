# Update the existing Alibi website

This package is v0.9.0, adding the 50-second character-led feature video with speech bubbles and the original soundtrack. It includes the Paper Trails menu/host music and animated playground. The yellow smiley icon and profanity-free homepage and feature video are retained. It is ready to upload; it has not been pushed to GitHub or deployed from this workspace.

## Your current setup

- Repository: `benllados/alibi`, branch `main`
- Project folder inside the repository: `alibi 6`
- Vercel and Render Root Directory: `alibi 6`
- Website: `https://www.alib.app` (`https://alib.app` redirects there)
- Render backend: `https://alibi-wzrg.onrender.com`
- Render `PUBLIC_ORIGIN`: `https://www.alib.app`

## Upload this update

1. Unzip the download. Open the `alibi` folder.
2. Open your local GitHub checkout in Finder/Explorer. Inside it, open **alibi 6**.
3. Copy the **contents** of the downloaded `alibi` folder into **alibi 6**, replacing existing files. Keep your existing local `.env` if you have one; the package does not contain an `.env` file. Do not add another nested `alibi` folder.
4. In GitHub Desktop, review the changed files, commit with `Add character-led feature video with speech bubbles and music`, then **Push origin**.
5. Wait for both Vercel and Render to finish deploying. A Render restart clears existing game rooms, so do this between games.
6. Open `https://www.alib.app` and refresh.

If you use GitHub's website instead of GitHub Desktop: navigate into **alibi 6** first, choose **Add file → Upload files**, and drag in the extracted folder's contents. Commit to `main`. Preserve the paths: for example, the video must be at `alibi 6/public/media/alibi-preview.mp4`.

The supplied `vercel.json` already points to your actual Render service. Keep `PUBLIC_ORIGIN` as `https://www.alib.app` in Render's Environment settings; it must match the browser's Origin, including `www`. No new environment variables are needed.

## Check the update

- Click **See it in action**: the new tour should run for 50 seconds, with the four characters speaking in text bubbles. Try the optional English captions, read the transcript, and confirm background menu music stops while the panel is open.

- On the main menu, open **♫ music**, then **play music**. Listen to the two-minute Paper Trails theme. Adjust the volume and mute; these preferences should survive a refresh.
- With menu music playing, create a host room. The same track should continue, with a softer arrangement during writing and drawing and a fuller one at reveals.
- Choose **Join a game** from the menu. Its form and the joined player phone must stay silent. On the host screen, pause the game or hide the tab; music should stop and resume without restarting. Open the feature preview; background music should pause until it closes.
- Allow more than two minutes of listening to check the loop on your browser. The two layers must stay aligned. Browser playback, subjective sound quality, and phone behavior still need your local listening check.
- Upload the entire `public/music` folder as well as the changed scripts. No new environment variables or dependencies are required.

- The browser tab shows the large yellow smiley. If an old tab keeps its prior icon, close that tab and reopen the site.
- The homepage has the large logo, short premise, and **Host a game**, **Join a game**, and **See it in action**. The old tagline, sticker cluster, and round-summary strip are gone.
- Watch the opening: Frog and Cowboy play football while Flower folds paper and Cape practices. The first impact is around 2.7 seconds; magic starts at 7 seconds; the plane launches around 15 seconds while Cape finishes his bow. The pencil ride begins at 23 seconds and star repair at 31.5 seconds in the first arrangement. Those last two swap order in the next 48-second arrangement.
- In the magic trick, the hat blinks and sprouts legs, the frog jumps onto Cowboy’s hat and then the menu sheet, and Frog’s hat grows back. Look for the bad wand reveal, hand gestures, body compression, cape movement, and different facial reactions.
- Try **pause the nonsense**, refresh, then resume. Pause preference should persist. OS reduced motion keeps the cast still.
- **Join a game** and the preview/about panels should put the cast into quiet idle. All buttons and form fields should remain clickable.
- Check both desktop and phone sizes. On phones, all four characters should fit in a compact bottom row; the stage hides while the keyboard is open.
- Click **See it in action**, then use the video Play control. Scrub to the smiley transition (~9s) and drawing finale (~25s). Close the panel; playback should stop.
- **About the project** opens a short explanation with the source link.
- Host a room and join on two devices. A copied room invite should still open the prefilled join form.
- Start a fresh game and confirm live updates arrive on every device.

The walkthrough is a 50-second, 1080p animation built from Alibi's production character rig and illustrative turns. It has simple speech bubbles, original music, small synthesized sound effects, and an optional English caption track. The **Example game** label identifies its composed scenes. Upload `public/media/alibi-preview.mp4`, `preview-poster.webp`, and `alibi-preview.vtt` together. The MP4 can also be shared separately.

Local verification: 73 automated tests, including complete matches, privacy, room events, homepage navigation, video seeking, animation scheduling and cleanup, prop continuity, and desktop/phone scene geometry. Eighteen animation frames were rendered and reviewed, and a separate 48-second motion preview was rendered from the actual character code against a staged menu backdrop. These checks do not simulate browser layout. Browser layout, native phone video controls, and the deployed Vercel/Render connection still need a check in your browser.

## Music deliverables

`public/music/paper-trails-bed.mp3` and `paper-trails-spark.mp3` are synchronized looping stems, not alternate complete songs. The two-minute listening MP3 and 50-second music edit are supplied separately. The original reference recording is not part of the website package. The fifty-second edit is now used in the new character-led feature video, mixed with small synthesized effects.

## v0.9.0 video verification

The 50-second final MP4 was fully decoded without errors. It contains 1920×1080 H.264 video at 24 fps and 44.1 kHz stereo AAC audio; both streams are exactly 50 seconds. Twenty-two storyboard frames and frames extracted from the encoded video were inspected. All 1,200 generated frames were checked for invalid geometry. The 19 speech cues contain 115 words. All 73 existing game, networking, UI, and audio checks pass. Browser layout and native playback still require a local check; this build has not been deployed.
