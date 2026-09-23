"""Mix the existing original 50-second music edit with small synthesized cues."""
from pathlib import Path
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter,sosfilt
root=Path(__file__).resolve().parents[1]
out=root/'tools/tour-work';out.mkdir(exist_ok=True)
sr=44100
raw=subprocess.run(['ffmpeg','-v','error','-i',str(root.parent/'Alibi-Paper-Trails-Video-50s.mp3'),'-f','f32le','-ar',str(sr),'-ac','2','pipe:1'],capture_output=True,check=True).stdout
music=np.frombuffer(raw,np.float32).reshape(-1,2).copy()*.80
rng=np.random.default_rng(223)
def put(x,at,pan=0):
 i=round(at*sr);n=min(len(x),len(music)-i)
 music[i:i+n]+=x[:n,None]*np.array([np.cos((pan+1)*np.pi/4),np.sin((pan+1)*np.pi/4)])
def tone(at,f=587.33,secs=.22,amp=.045,pan=0):
 t=np.arange(round(secs*sr))/sr
 x=(np.sin(2*np.pi*f*t)+.15*np.sin(4*np.pi*f*t))*np.exp(-t*15)*(1-np.exp(-t*700))
 x[-220:]*=np.linspace(1,0,220);put(x*amp,at,pan)
def paper(at,secs=.17,amp=.025):
 t=np.arange(round(secs*sr))/sr;n=rng.normal(size=len(t));n=sosfilt(butter(2,[500,4300],btype='bandpass',fs=sr,output='sos'),n)
 put(n*np.sin(np.pi*t/secs)**2*amp,at,.1)
for at in [0,5,10,19,22,25,32,36,44,47]:paper(at)
for i,at in enumerate([5.7,6.15,6.6,7.05]):tone(at,[440,493.88,587.33,739.99][i],amp=.033,pan=-.2+i*.13)
for at in [12.2,12.7,13.2,15.8,16.2,20.8,23.25,33.9,34.2]:tone(at,440,amp=.022)
for at in [17.1,34.9,44.65]:
 for j,f in enumerate([293.66,369.99,440,587.33]):tone(at+j*.07,f,amp=.033,secs=.4)
paper(9.15,.75,.035);paper(25,.75,.035)
for at in [29.9,30.2,30.45,30.75,31.1,31.4,31.7]:paper(at,.09,.013)
tone(40.75,369.99,amp=.025);tone(42.15,587.33,amp=.035)
for at in [47.4,48.15]:
 t=np.arange(round(.17*sr))/sr;f=420+800*np.sin(np.pi*t/.17);put(np.sin(2*np.pi*np.cumsum(f)/sr)*np.sin(np.pi*t/.17)**2*.025,at,-.1)
music[-round(.2*sr):]*=np.linspace(1,0,round(.2*sr))[:,None]
assert np.max(abs(music))<1
wavfile.write(out/'tour-mix.wav',sr,music)
print('50-second original soundtrack + paper, drawing, reveal, and frog cues mixed.')
