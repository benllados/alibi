"""Mix an 80-second edit of original Paper Trails with quiet, event-timed effects.
Uses the game stems already in public/music; never uses reference-song audio.
"""
from pathlib import Path
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter,sosfilt
root=Path(__file__).resolve().parents[1]
out=root/'tools/tour-work';out.mkdir(exist_ok=True)
sr=44100;duration=80
music=np.zeros((sr*duration,2),np.float32)
for name in ['bed','spark']:
 raw=subprocess.run(['ffmpeg','-v','error','-i',str(root/'public/music'/f'paper-trails-{name}.mp3'),'-t',str(duration),'-f','f32le','-ar',str(sr),'-ac','2','pipe:1'],capture_output=True,check=True).stdout
 stem=np.frombuffer(raw,np.float32).reshape(-1,2)
 assert len(stem)==len(music)
 music+=stem*.79
music[:round(.22*sr)]*=np.linspace(0,1,round(.22*sr))[:,None]
music[76*sr:]*=np.linspace(1,.07,4*sr)[:,None]
rng=np.random.default_rng(223)
def put(x,at,pan=0):
 i=round(at*sr);n=min(len(x),len(music)-i)
 music[i:i+n]+=x[:n,None]*np.array([np.cos((pan+1)*np.pi/4),np.sin((pan+1)*np.pi/4)])
def tone(at,f=587.33,secs=.22,amp=.04,pan=0,decay=15):
 t=np.arange(round(secs*sr))/sr
 x=(np.sin(2*np.pi*f*t)+.15*np.sin(4*np.pi*f*t))*np.exp(-t*decay)*(1-np.exp(-t*700))
 x[-220:]*=np.linspace(1,0,220);put(x*amp,at,pan)
def paper(at,secs=.17,amp=.018):
 t=np.arange(round(secs*sr))/sr;n=rng.normal(size=len(t));n=sosfilt(butter(2,[500,4300],btype='bandpass',fs=sr,output='sos'),n)
 put(n*np.sin(np.pi*t/secs)**2*amp,at,.1)
for at in [0,6,12,18,24,30,35,41,46,52,58,64,70,75]:paper(at)
for i,at in enumerate([6.3,7.1,7.9,8.7]):tone(at,[440,493.88,587.33,739.99][i],amp=.028,pan=-.3+i*.18)
for i,at in enumerate([12.6,13.5,14.4,15.3]):
 for j,f in enumerate([587.33,739.99,880]):tone(at+j*.055,f,amp=.022,secs=.3,pan=-.3+i*.2)
 paper(at,.3,.016)
for at in [21,22.4,27.5,38,43.2,54]:tone(at,440,amp=.02)
for at in [30.2,68.4,75.6]:
 for j,f in enumerate([293.66,369.99,440,587.33]):tone(at+j*.1,f,amp=.027,secs=.45)
paper(17.3,.95,.025);paper(46,.7,.026)
for at in [58.4,59.2,60,60.8,61.6,62.4,63.1]:paper(at,.12,.012)
tone(72.1,369.99,amp=.023);tone(73.3,587.33,amp=.034)
for j,f in enumerate([293.66,369.99,440,587.33]):tone(77.6+j*.06,f,secs=2.2-j*.06,amp=.045,decay=1.8)
music[-round(.4*sr):]*=np.linspace(1,0,round(.4*sr))[:,None]
assert np.isfinite(music).all() and np.max(abs(music))<1
wavfile.write(out/'tour-mix.wav',sr,music)
print(f'80-second soundtrack mixed; peak {20*np.log10(np.max(abs(music))):.1f} dBFS')
