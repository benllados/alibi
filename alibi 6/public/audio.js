// An original, synthesized 88 BPM doodling loop. No recordings or downloads.
// Instantiated by every client, but only a host gesture can start playback.
export class PartyAudio {
 constructor(){this.host=false;this.ctx=null;this.enabled=false;this.paused=false;this.volume=.24;this.step=0;this.next=0;this.tick=null;}
 async enable(){if(!this.host)return false;try{this.ctx??=new (window.AudioContext||window.webkitAudioContext)();if(!this.master){this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);}this.master.gain.value=this.volume;await this.ctx.resume();this.enabled=true;this.next=this.ctx.currentTime+.05;clearInterval(this.tick);this.tick=setInterval(()=>this.schedule(),80);return true;}catch{return false;}}
 stop(){this.enabled=false;clearInterval(this.tick);this.tick=null;if(this.ctx)this.ctx.suspend();}
 setVolume(v){this.volume=Math.max(0,Math.min(.6,v));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.1);}
 setHost(value){this.host=value;if(!value&&this.enabled)this.stop();}
 tone(freq,time,duration=.25,volume=.2,type='sine'){
  if(!this.ctx||!this.enabled)return;const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(freq,time);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);oscillator.connect(gain);gain.connect(this.master);oscillator.start(time);oscillator.stop(time+duration+.025);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
 }
 schedule(){if(!this.enabled||this.paused||document.hidden){if(this.ctx)this.next=this.ctx.currentTime+.06;return;}const bpm=88,beat=60/bpm/2;const chords=[[130.81,164.81,196,246.94],[110,130.81,164.81,196],[87.31,110,130.81,164.81],[98,123.47,146.83,196]];while(this.next<this.ctx.currentTime+.18){const step=this.step%64,chord=chords[Math.floor(step/16)],pos=step%16,t=this.next;if(pos%4===0)this.tone(chord[0]/2,t,.48,.22,'triangle');if([0,3,6,10,13].includes(pos)){const note=chord[[1,2,3,2,1][[0,3,6,10,13].indexOf(pos)]];this.tone(note*2,t,.65,.12);this.tone(note*4,t,.24,.025,'triangle');}if(pos%4===2){this.tone(660,t,.035,.018,'triangle');this.tone(1200,t+.014,.024,.009);}if(pos%8===0)this.tone(55,t,.1,.13);this.next+=beat*(this.step%2===0?1.08:.92);this.step++;}}
 effect(kind){if(!this.host||!this.enabled||this.paused)return;const t=this.ctx.currentTime;const notes={join:[392,523.25],submit:[440,554],reveal:[261.63,329.63,392,523.25],round:[329.63,392,523.25],finale:[164.81,196,246.94,329.63,392],win:[261.63,329.63,392,523.25,659.25,783.99],tick:[440]}[kind]||[440];notes.forEach((n,i)=>this.tone(n,t+i*.095,kind==='tick'?.07:.32,.2,'triangle'));}
}
