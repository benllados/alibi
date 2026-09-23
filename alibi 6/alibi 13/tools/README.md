# Optional feature-video renderer

`tour-scene.mjs` defines the approved 50-second character tour and dialogue. `build-preview.mjs` renders the scenes from the production character rig, avatar parts, wordmark, and glyph outlines. These are illustrative gameplay scenes labeled **Example game**, rather than a browser capture.

The finished MP4, poster, and WebVTT captions are already in `public/media/`. No rendering dependencies are needed to run or deploy Alibi.

To rebuild, with Python fontTools/numpy/scipy, Node sharp, system DejaVu fonts, and ffmpeg available:

```sh
python tools/export-preview-fonts.py
python tools/compose-theme.py
python tools/mix-tour-audio.py
node tools/build-preview.mjs --stills
node tools/build-preview.mjs
```

The stills command produces 22 review frames and a contact sheet. The final command encodes 1920×1080, 24 fps H.264 video with AAC audio and fast-start metadata. It also creates a poster, English WebVTT captions, and `../Alibi-Character-Tour-50s.mp4`. Music is the original Paper Trails edit with synthesized effects; there is no voiceover. The approved script is rendered as readable speech bubbles, with a matching website transcript.

`tools/tour-stills/` and `tools/tour-work/` are build intermediates excluded from the game archive and server routes. Character identity and private-information rules must stay consistent across the example scenes.

## Optional playground artwork check

`check-playground.mjs` renders 18 poses from the actual `playground-scene.js` model and `playground.js` character rig into `tools/playground-qa/`. Run it with `sharp` available to Node. The contact sheet checks character artwork and scene poses in both alternating arrangements; it does not reproduce the browser’s HTML/CSS layout. This output is excluded from the deployment archive. The game itself needs no rendering dependencies.

`render-playground-preview.mjs` renders a 48-second, silent H.264 motion study from the actual character model. The backdrop is a labeled, staged menu layout; this is not a browser capture. Run `node tools/render-playground-preview.mjs path/to/motion.mp4` with sharp and ffmpeg available. The motion study is separate from the existing 44-second feature tour shown on the homepage.

## Original soundtrack renderer

`compose-theme.py` builds **Paper Trails**, an authored 48-bar, D-major instrumental at 96 BPM (exactly 120 seconds). Every instrument and reverberation response is synthesized; the script never reads the uploaded reference song. The melody, harmonic voicings, rhythm, and six-section arrangement are in the script.

Rebuild with Python 3, numpy, scipy, and ffmpeg with libmp3lame:

```sh
python tools/compose-theme.py
```

Outputs:
- `public/music/paper-trails-bed.mp3`: plucked accompaniment, pads, bass, and brushes.
- `public/music/paper-trails-spark.mp3`: melody, bells, flute responses, wood taps, and shaker.
- `public/music/theme.json`: tempo, loop region, instrumentation, and provenance.
- `../Alibi-Paper-Trails.mp3`: complete two-minute listening mix with a short fade-in/out.
- `../Alibi-Paper-Trails-Video-50s.mp3`: fifty-second music edit with a closing chord for the planned walkthrough.
- `tools/audio-work/`: floating-point loop masters, listening/video masters, and note events; excluded from the game download and public routes.

Both MP3 stems decode to 5,292,000 stereo frames at 44.1 kHz. Loop end is 120 seconds. Reverb tails are folded over the loop boundary. The game loads both tracks lazily, starts them on the same Web Audio clock, and changes the second layer's gain between phases. Browsers require a music/host-button gesture; player seats never initialize playback. No Python, ffmpeg, or synthesis libraries are required at runtime.

Verification covers decoded duration, finite samples, headroom, wrap-boundary continuity, asset delivery, and controller behavior. These checks do not replace listening and testing playback in the target browser.
