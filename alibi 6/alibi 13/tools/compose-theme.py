#!/usr/bin/env python3
"""Render Alibi's original Paper Trails score, without samples or external services.

Requires Python + numpy/scipy and ffmpeg, only when rebuilding music.
The reference recording is not read by this program. Every note is authored below;
all instruments and room responses are synthesized. Game deployment needs no Python.
"""
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/music'
WORK = ROOT / 'tools/audio-work'
OUT.mkdir(exist_ok=True)
WORK.mkdir(exist_ok=True)
SR, BPM, BARS = 44100, 96, 48
BEAT = 60 / BPM
DURATION = BARS * 4 * BEAT
N = round(SR * DURATION)
RNG = np.random.default_rng(2192026)
stems = {k: np.zeros((N, 2), np.float32) for k in ('bed', 'spark')}
events = []


def hz(note):
    return 440 * 2 ** ((note - 69) / 12)


def filtered(x, cutoff, kind='lowpass', order=2):
    return sosfilt(butter(order, cutoff, btype=kind, fs=SR, output='sos'), x).astype(np.float32)


def instrument(kind, note, seconds, velocity):
    t = np.arange(round(seconds * SR), dtype=np.float32) / SR
    f = hz(note) * 2 ** (RNG.normal(0, 1.9) / 1200)
    phase = 2 * np.pi * f * t
    if kind == 'pluck':
        # A warm, short nylon-string/thumb-piano hybrid, with soft pick noise.
        x = np.zeros_like(t)
        for h in range(1, 10):
            env = np.exp(-t * (1.75 + h * .71))
            x += .83 ** (h - 1) / h * np.sin(phase * h * (1 + .00008*h*h)) * env
        x += .032 * filtered(RNG.normal(size=len(t)), 3500) * np.exp(-t * 95)
        x *= 1 - np.exp(-t * 680)
        x = filtered(x, 4100)
    elif kind == 'felt':
        x = np.sin(phase + .31 * np.sin(phase * 2) * np.exp(-t * 5)) * np.exp(-t * 1.45)
        x += .22 * np.sin(phase * 2.002) * np.exp(-t * 4.6)
        x += .09 * np.sin(phase * 3.001) * np.exp(-t * 7)
        x *= (1 - np.exp(-t * 320))
    elif kind == 'bell':
        x = (np.sin(phase)*np.exp(-t*1.1) + .20*np.sin(phase*2.756)*np.exp(-t*2.9)
             + .095*np.sin(phase*5.404)*np.exp(-t*4.7))
        x *= 1 - np.exp(-t * 240)
    elif kind == 'bass':
        x = (np.sin(phase) + .21 * np.sin(phase*2) + .085*np.sin(phase*3))
        x *= (1-np.exp(-t*90)) * np.exp(-t*2.0)
        x = filtered(x, 650)
    elif kind == 'pad':
        x = np.zeros_like(t)
        for h, level in [(1, .60), (2, .22), (3, .10), (4, .025)]:
            for cents in [-4.2, 4.2]:
                x += level/2 * np.sin(phase*h*2**(cents/1200) + .025*np.sin(2*np.pi*.31*t))
        x *= np.minimum(t/.58, 1) * np.minimum((seconds-t)/1.1, 1)
        x = filtered(x, 1700)
    elif kind == 'flute':
        phase += .016 * f * np.sin(2*np.pi*4.7*t) * np.minimum(t*2, 1)
        x = np.sin(phase) + .075*np.sin(2*phase) + .09*np.sin(3*phase)
        x += .018 * filtered(RNG.normal(size=len(t)), [700, 3000], 'bandpass')
        x *= np.minimum(t/.12, 1) * np.minimum((seconds-t)/.3, 1)
    else:
        raise ValueError(kind)
    # Stop residual tails smoothly; natural tails wrap over the loop boundary.
    fade = min(round(.045*SR), len(x)//2)
    x[-fade:] *= np.linspace(1, 0, fade)
    return (x * velocity).astype(np.float32)


def add(stem, x, time, pan=0):
    i = round(time * SR) % N
    p = np.clip(pan, -.9, .9)
    stereo = x[:, None] * np.array([math.cos((p+1)*math.pi/4), math.sin((p+1)*math.pi/4)], np.float32)
    count = min(len(x), N-i)
    stems[stem][i:i+count] += stereo[:count]
    if count < len(x):
        stems[stem][:len(x)-count] += stereo[count:]


def play(stem, kind, note, beat, duration, velocity, pan=0, human=True):
    time = beat * BEAT + (RNG.normal(0, .006) if human else 0)
    vel = velocity * RNG.uniform(.94, 1.06)
    add(stem, instrument(kind, note, duration, vel), time, pan)
    events.append([stem, kind, note, round(beat, 3), duration, round(vel, 4)])


def drum(kind, velocity):
    seconds = {'kick':.25, 'brush':.15, 'wood':.105, 'shaker':.065}[kind]
    t = np.arange(round(seconds*SR))/SR
    if kind == 'kick':
        phase = 2*np.pi*(48*t + 28*(1-np.exp(-t*35))/35)
        x = np.sin(phase)*np.exp(-t*19)*(1-np.exp(-t*700))
    elif kind == 'wood':
        x = (.65*np.sin(2*np.pi*780*t)+.3*np.sin(2*np.pi*1280*t)) * np.exp(-t*105)
        x *= (1-np.exp(-t*1800))
    else:
        x = filtered(RNG.normal(size=len(t)), [2600, 7400] if kind=='shaker' else [700, 5500], 'bandpass')
        x *= np.exp(-t*(72 if kind=='shaker' else 29)) * (1-np.exp(-t*1300))
    return (x*velocity).astype(np.float32)


# D major with suspended and added-note voicings; 8-bar harmonic sentences.
CHORDS = [
    (38, [62, 66, 69, 73, 76]),  # Dmaj9
    (35, [62, 66, 69, 71, 74]),  # Bm7
    (31, [59, 62, 66, 69, 74]),  # Gmaj9
    (33, [61, 64, 67, 71, 74]),  # A9sus colour
    (30, [57, 62, 66, 69, 73]),  # D/F#
    (28, [55, 59, 62, 66, 71]),  # Em9
    (31, [59, 62, 66, 69, 74]),  # Gmaj9
    (33, [57, 61, 64, 66, 71]),  # A6/9, returns gently to D
]
# Original, deliberately spacious melody: call, response, and two contrasting bridges.
MELODY = [
    [(0,74,.8),(.75,78,.65),(1.5,76,.8),(3,69,.95)],
    [(.5,71,.85),(1.5,74,1.1),(3,78,.8)],
    [(0,74,1.0),(1.5,71,.9),(2.5,69,.65),(3.25,66,.8)],
    [(.5,71,.65),(1.25,73,.8),(2.5,76,1.3)],
    [(0,78,1.0),(1.5,76,.7),(2.5,74,1.2)],
    [(.75,71,1.0),(2,66,.9),(3.25,69,.6)],
    [(0,71,.9),(1.5,74,1),(3,78,.6)],
    [(.25,76,1),(1.5,73,.8),(2.75,69,.9)],
]
BRIDGE = [
    [(.5,81,1.2),(2.25,78,1.1)],[(0,78,1),(1.5,74,1.4),(3.25,71,.5)],
    [(.5,74,.8),(1.5,78,.7),(2.75,81,1.0)],[(0,79,.7),(1,76,1.1),(2.75,73,1.0)],
    [(.5,78,.8),(1.75,81,1.1),(3.25,78,.6)],[(0,78,1.0),(1.5,76,1.1),(3,71,.7)],
    [(.5,74,1.0),(2,71,1.4)],[(0,73,.9),(1.5,71,.8),(3,69,.6)],
]

for bar in range(BARS):
    base = bar*4
    root, chord = CHORDS[bar%8]
    section = bar//8
    # A less busy fifth section creates breathing room on repeated listens.
    quiet = section == 4
    play('bed','bass',root,base,1.55,.22, -.02)
    play('bed','bass',root+7 if bar%4==3 else root,base+2.5,1.12,.105,-.02)
    # Hand-played broken chords with varied space and subtle swing.
    steps = [(0,1),(.55,3),(1.5,2),(2.05,4),(2.75,1),(3.5,3)]
    if quiet:
        steps = [(0,1),(1.55,3),(2.75,2),(3.55,4)]
    for j,(off,tone) in enumerate(steps):
        play('bed','pluck',chord[tone],base+off,1.65,.095 if j%2==0 else .061,-.36+ .045*(j%3))
    # Sustained warm strings under the little wooden instruments.
    if bar%2==0:
        for j,note in enumerate(chord[:4]):
            play('bed','pad',note-12,base,4*BEAT,.025 if quiet else .037,(j-1.5)*.3)
    melody = (BRIDGE if section in [2,3] else MELODY)[bar%8]
    for j,(off,note,hold) in enumerate(melody):
        # End with a pickup into bar 1 rather than an obvious fade/restart.
        if section==5 and bar%8>=6:
            note -= 12 if j==0 else 0
        play('spark','felt',note,base+off,max(.9,hold*BEAT+1.25),.13 if not quiet else .085,.12)
        if (bar+j)%5==0 and not quiet:
            play('spark','bell',note+12,base+off+.04,2.2,.028,.48)
    # Sparse answering wind phrase instead of constant lead doubling.
    if section in [1,3,5] and bar%2==1:
        play('spark','flute',chord[2]+12,base+.75,1.1,.032,-.3)
        play('spark','flute',chord[1]+12,base+2.75,.75,.026,-.25)
    # Muted percussion in the bed, brighter rhythm in the adaptive layer.
    for off in [0,2]:
        add('bed',drum('kick',.11 if not quiet else .08),(base+off)*BEAT)
    for off in [1,3]:
        add('bed',drum('brush',.021),(base+off+.015)*BEAT,.24)
        add('spark',drum('wood',.035 if not quiet else .022),(base+off+.012)*BEAT,.32)
    for eighth in range(8):
        off=eighth*.5+(.048 if eighth%2 else 0)
        add('spark',drum('shaker',.028 if eighth%2 else .018),(base+off)*BEAT,-.38)
    if bar%8==7:
        for j,off in enumerate([3,3.3,3.55,3.8]):
            play('spark','pluck',CHORDS[(bar+1)%8][1][j],base+off,.9,.045,.25-j*.13)


def room(signal, amount):
    # Circular convolution: the room's tail continues across the loop join.
    length=round(SR*2.45)
    t=np.arange(length)/SR
    result=signal.copy()
    for ch in range(2):
        impulse=filtered(RNG.normal(size=length), 3700) * np.exp(-t*3.3)
        impulse[:round(.019*SR)]=0
        impulse*=.035 / np.sqrt(np.sum(impulse*impulse))
        for delay,level in [(0.031,.19),(.057,.12),(.093,.073),(.143,.048)]:
            impulse[round((delay+ch*.003)*SR)]+=level
        mono=.7*signal[:,ch]+.3*signal[:,1-ch]
        wet=fftconvolve(mono,impulse).astype(np.float32)
        wet[:len(wet)-N]+=wet[N:]
        result[:,ch]+=wet[:N]*amount
    return result


for key in stems:
    stems[key] = room(stems[key], .9 if key=='bed' else 1.4)
    # Gentle DC/high-frequency cleanup, cyclic settling to preserve the seam.
    for ch in range(2):
        x=stems[key][:,ch]
        extended=np.r_[x[-SR*2:],x]
        x=filtered(filtered(extended, 35, 'highpass'), 7800)[SR*2:]
        stems[key][:,ch]=x

full=stems['bed']+stems['spark']
# One common gain preserves the two layers' phase and intended balance.
gain=min(.87/np.max(abs(full)), .105/np.sqrt(np.mean(full*full)))
for key in stems:
    stems[key]*=gain
    wavfile.write(WORK/f'{key}.wav',SR,stems[key])
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(WORK/f'{key}.wav'),
        '-c:a','libmp3lame','-b:a','128k','-write_xing','1',
        '-metadata','title=Paper Trails — '+key,'-metadata','artist=Alibi',
        str(OUT/f'paper-trails-{key}.mp3')],check=True)

full=stems['bed']+stems['spark']
wavfile.write(WORK/'paper-trails-loop.wav',SR,full)
# Listening copy has a gentle beginning and an ending; deployment stems stay seamless.
listen=full.copy()
listen[:round(.22*SR)]*=np.linspace(0,1,round(.22*SR))[:,None]
listen[-SR*3:]*=np.linspace(1,0,SR*3)[:,None]
wavfile.write(WORK/'paper-trails-listening.wav',SR,listen)
dest=ROOT.parent/'Alibi-Paper-Trails.mp3'
subprocess.run(['ffmpeg','-y','-v','error','-i',str(WORK/'paper-trails-listening.wav'),
    '-c:a','libmp3lame','-b:a','192k','-metadata','title=Paper Trails',
    '-metadata','artist=Alibi','-metadata','album=Alibi — Original Game Music',str(dest)],check=True)
# A separate fifty-second edit for the approved future character walkthrough.
video=full[:50*SR].copy()
video[46*SR:]*=np.linspace(1,.2,4*SR)[:,None]
for j,note in enumerate([62,66,69,74]):
    sound=instrument('felt',note,2.45-j*.055,.078)*gain
    start=round((47.5+j*.055)*SR);count=min(len(sound),len(video)-start)
    video[start:start+count]+=sound[:count,None]*.707
video[:round(.12*SR)]*=np.linspace(0,1,round(.12*SR))[:,None]
video[-round(.3*SR):]*=np.linspace(1,0,round(.3*SR))[:,None]
wavfile.write(WORK/'paper-trails-video-50s.wav',SR,video)
subprocess.run(['ffmpeg','-y','-v','error','-i',str(WORK/'paper-trails-video-50s.wav'),
    '-c:a','libmp3lame','-b:a','192k','-metadata','title=Paper Trails — 50 second video edit',
    '-metadata','artist=Alibi',str(ROOT.parent/'Alibi-Paper-Trails-Video-50s.mp3')],check=True)
metadata={'title':'Paper Trails','bpm':BPM,'bars':BARS,'seconds':DURATION,
          'sampleRate':SR,'loopStart':0,'loopEnd':DURATION,
          'bed':'/music/paper-trails-bed.mp3','spark':'/music/paper-trails-spark.mp3',
          'composition':'Original authored score; fully synthesized instruments; no sampled reference audio.',
          'form':'Six eight-bar sections: theme, answer, bridge, bridge variation, quiet reprise, return.',
          'instruments':['nylon/kalimba pluck','felt keys','soft bells','warm strings','breathy flute','round bass','brushes','wood taps','shakers']}
(OUT/'theme.json').write_text(json.dumps(metadata,indent=2)+'\n')
(WORK/'score.json').write_text(json.dumps(events))
print(json.dumps({'seconds':DURATION,'events':len(events),'peak_dbfs':round(float(20*np.log10(np.max(abs(full)))),2),
 'rms_dbfs':round(float(20*np.log10(np.sqrt(np.mean(full*full)))),2),
 'seam_delta':float(np.max(abs(full[-1]-full[0]))),'listening_copy':str(dest)},indent=2))
