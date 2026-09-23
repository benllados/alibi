// Paper Trails: original 96 BPM, two-minute score, rendered from tools/compose-theme.py.
// One shared transport keeps the two layers aligned. Player seats never play audio.
export const THEME = Object.freeze({seconds:120,bed:'/music/paper-trails-bed.mp3',spark:'/music/paper-trails-spark.mp3'});
const PREF = 'alibi-audio-v1';
const LEVELS = {menu:1,lobby:.85,questions:.22,write:.28,truth:.2,draw:.34,vote:.55,reveal:1,finished:1};

export class PartyAudio {
 constructor(environment=globalThis){
  this.env=environment;this.host=false;this.mode='player';this.ctx=null;this.enabled=false;
  this.volume=.42;this.muted=false;this.error='';this.loading=false;this.phase='menu';
  this._paused=false;this.preview=false;this.sources=[];this.buffers=null;this.pending=null;this.generation=0;
  try{const p=JSON.parse(this.env.localStorage?.getItem(PREF)||'null');if(p){this.muted=p.muted===true;if(Number.isFinite(p.volume))this.volume=Math.max(0,Math.min(.6,p.volume));}}catch{}
  this.visibility=()=>this.sync();
  this.env.document?.addEventListener?.('visibilitychange',this.visibility);
 }
 get paused(){return this._paused;}
 set paused(value){this._paused=!!value;this.sync();}
 get permitted(){return this.mode==='host'||this.mode==='menu';}
 get audible(){return this.permitted&&this.enabled&&!this.paused&&!this.preview&&!this.env.document?.hidden;}
 notify(){this.onChange?.();}
 remember(){try{this.env.localStorage?.setItem(PREF,JSON.stringify({muted:this.muted,volume:this.volume}));}catch{}}
 setMode(mode){
  if(!['menu','host','player'].includes(mode))throw Error('Unknown audio mode');
  this.mode=mode;this.host=mode==='host';
  if(!this.permitted){this.generation++;this.enabled=false;this.loading=false;}
  this.sync();this.notify();
 }
 setHost(value){this.setMode(value?'host':'player');}
 setMenu(){this.setMode('menu');this.setPhase('menu');this.paused=false;}
 setPhase(phase){
  this.phase=phase;
  if(this.sparkGain&&this.ctx){const g=this.sparkGain.gain;g.cancelScheduledValues(this.ctx.currentTime);g.setTargetAtTime(LEVELS[phase]??.4,this.ctx.currentTime,.7);}
 }
 setPreview(value){this.preview=!!value;this.sync();}
 setVolume(value){
  if(!Number.isFinite(value))return;
  this.volume=Math.max(0,Math.min(.6,value));this.remember();
  if(this.master)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.08);
 }
 createContext(){
  if(this.ctx)return;
  const win=this.env.window||this.env,Constructor=win.AudioContext||win.webkitAudioContext;
  if(!Constructor)throw Error('This browser does not support game audio.');
  this.ctx=new Constructor();
  this.master=this.ctx.createGain();this.master.gain.value=this.volume;this.master.connect(this.ctx.destination);
  this.bedGain=this.ctx.createGain();this.bedGain.gain.value=1;this.bedGain.connect(this.master);
  this.sparkGain=this.ctx.createGain();this.sparkGain.gain.value=LEVELS[this.phase]??.4;this.sparkGain.connect(this.master);
 }
 async load(){
  if(this.buffers)return this.buffers;
  if(!this.pending){
   this.pending=Promise.all([THEME.bed,THEME.spark].map(async url=>{
    const response=await this.env.fetch(url);if(!response.ok)throw Error('Music could not load. Please try again.');
    return this.ctx.decodeAudioData(await response.arrayBuffer());
   })).then(buffers=>{
    if(buffers.some(b=>b.duration<THEME.seconds-.03))throw Error('Music download was incomplete. Please try again.');
    this.buffers=buffers;return buffers;
   }).finally(()=>{this.pending=null;});
  }
  return this.pending;
 }
 async enable({automatic=false}={}){
  if(!this.permitted||(automatic&&this.muted))return false;
  if(this.loading)return false;
  const request=++this.generation;
  this.error='';this.enabled=true;this.loading=true;this.notify();
  try{
   this.createContext();
   // Resume inside the button gesture, before fetching/decoding any media.
   await this.ctx.resume();
   if(request!==this.generation||!this.permitted||!this.enabled)return false;
   this.sync();
   const buffers=await this.load();
   if(request!==this.generation||!this.permitted||!this.enabled)return false;
   if(!this.sources.length){
    const time=this.ctx.currentTime+.04;
    this.sources=buffers.map((buffer,i)=>{
     const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;
     source.loopStart=0;source.loopEnd=Math.min(THEME.seconds,buffer.duration);
     source.connect(i?this.sparkGain:this.bedGain);source.start(time,0);return source;
    });
   }
   this.muted=false;this.remember();this.sync();return true;
  }catch(error){
   if(request===this.generation){this.enabled=false;this.error=error?.message||'Music could not start. Please try again.';this.sync();}
   return false;
  }finally{if(request===this.generation){this.loading=false;this.notify();}}
 }
 stop(){this.generation++;this.loading=false;this.enabled=false;this.muted=true;this.remember();this.sync();this.notify();}
 sync(){
  if(!this.ctx)return;
  if(!this.audible){if(this.ctx.state!=='suspended')this.ctx.suspend().catch(()=>{});}
  else if(this.ctx.state==='suspended'){
   const request=this.generation;
   this.ctx.resume().then(()=>{
    // A late resume must not let a newly joined player or muted tab make sound.
    if(!this.audible||request!==this.generation)this.sync();
   }).catch(()=>{if(request===this.generation){this.enabled=false;this.error='Tap music to resume playback.';this.notify();}});
  }
 }
 tone(freq,time,duration=.25,volume=.12,type='sine'){
  if(!this.ctx||!this.audible)return;
  const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(freq,time);
  gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  oscillator.connect(gain);gain.connect(this.master);oscillator.start(time);oscillator.stop(time+duration+.025);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
 }
 effect(kind){
  if(!this.host||!this.audible||!this.ctx)return;
  const t=this.ctx.currentTime;
  const notes={join:[440,587.33],submit:[493.88,587.33],reveal:[293.66,369.99,440,587.33],round:[369.99,440,587.33],finale:[185,220,293.66,369.99,440],win:[293.66,369.99,440,587.33,739.99,880],tick:[493.88]}[kind]||[440];
  notes.forEach((n,i)=>this.tone(n,t+i*.095,kind==='tick'?.065:.32,kind==='tick'?.07:.12,'sine'));
 }
 destroy(){
  this.generation++;this.enabled=false;this.loading=false;
  this.env.document?.removeEventListener?.('visibilitychange',this.visibility);
  this.sources.forEach(source=>{source.stop();source.disconnect();});this.sources=[];
  this.ctx?.close();this.ctx=null;
 }
}
