import test from 'node:test';
import assert from 'node:assert/strict';
import {PartyAudio,THEME} from '../public/audio.js';

function setup({saved=null,fetcher}={}){
 const events=new Map(),storage=new Map(saved?[['alibi-audio-v1',JSON.stringify(saved)]]:[]),requests=[];
 const parameter=()=>({value:0,targets:[],setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){},setTargetAtTime(v){this.value=v;this.targets.push(v);}});
 class Context {
  constructor(){this.state='suspended';this.currentTime=5;this.destination={};this.started=[];this.oscillators=[];}
  createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
  createBufferSource(){const n={connect(){},disconnect(){},start:(time,offset)=>this.started.push({node:n,time,offset}),stop(){}};return n;}
  createOscillator(){const n={frequency:parameter(),connect(){},disconnect(){},start(){},stop(){}};this.oscillators.push(n);return n;}
  async resume(){this.state='running';}
  async suspend(){this.state='suspended';}
  async close(){this.state='closed';}
  async decodeAudioData(){return {duration:120};}
 }
 const env={AudioContext:Context,document:{hidden:false,addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)},
  localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
  fetch:async url=>{requests.push(url);return fetcher?fetcher(url):{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};}};
 return {audio:new PartyAudio(env),env,requests,events,storage};
}

test('Player seats cannot create an audio context, download tracks, or play cues',async()=>{
 const {audio,requests}=setup();assert.equal(await audio.enable(),false);audio.effect('win');
 assert.equal(audio.ctx,null);assert.deepEqual(requests,[]);audio.destroy();
});

test('Menu loads only after a music gesture and the host inherits one aligned looping transport',async()=>{
 const {audio,requests}=setup();audio.setMenu();assert.equal(audio.ctx,null);assert.deepEqual(requests,[]);
 assert.equal(await audio.enable(),true);assert.deepEqual(requests,[THEME.bed,THEME.spark]);
 const ctx=audio.ctx;assert.equal(ctx.started.length,2);assert.equal(ctx.started[0].time,ctx.started[1].time);
 for(const {node,offset} of ctx.started){assert.equal(offset,0);assert.equal(node.loop,true);assert.equal(node.loopStart,0);assert.equal(node.loopEnd,120);}
 audio.setHost(true);audio.setPhase('lobby');assert.equal(await audio.enable({automatic:true}),true);
 assert.equal(audio.ctx,ctx);assert.equal(ctx.started.length,2);assert.equal(requests.length,2);audio.destroy();
});

test('Writing and drawing soften the melody and reveal restores it without restarting the track',async()=>{
 const {audio}=setup();audio.setHost(true);await audio.enable();
 audio.setPhase('write');const quiet=audio.sparkGain.gain.value;assert.ok(quiet<.4);
 audio.setPhase('draw');assert.ok(audio.sparkGain.gain.value<.5);
 audio.setPhase('reveal');assert.equal(audio.sparkGain.gain.value,1);assert.equal(audio.ctx.started.length,2);audio.destroy();
});

test('Hidden tab, game pause, and preview each keep music and cues silent until all blockers clear',async()=>{
 const {audio,env,events}=setup();audio.setHost(true);await audio.enable();
 env.document.hidden=true;events.get('visibilitychange')();assert.equal(audio.ctx.state,'suspended');
 audio.paused=true;env.document.hidden=false;events.get('visibilitychange')();assert.equal(audio.ctx.state,'suspended');
 audio.setPreview(true);audio.paused=false;assert.equal(audio.ctx.state,'suspended');
 audio.effect('win');assert.equal(audio.ctx.oscillators.length,0);
 audio.setPreview(false);await Promise.resolve();assert.equal(audio.ctx.state,'running');
 audio.effect('win');assert.equal(audio.ctx.oscillators.length,6);assert.equal(audio.ctx.started.length,2);audio.destroy();
});

test('User mute survives host creation and volume survives a new controller',async()=>{
 const {audio,env}=setup();audio.setMenu();await audio.enable();audio.setVolume(.31);audio.stop();audio.setHost(true);
 assert.equal(await audio.enable({automatic:true}),false);assert.equal(audio.ctx.state,'suspended');
 const restored=new PartyAudio(env);assert.equal(restored.volume,.31);assert.equal(restored.muted,true);
 restored.setHost(true);assert.equal(await restored.enable({automatic:true}),false);assert.equal(restored.ctx,null);
 assert.equal(await restored.enable(),true);assert.equal(restored.muted,false);
 restored.setVolume(NaN);assert.equal(restored.volume,.31);restored.setVolume(8);assert.equal(restored.volume,.6);
 audio.destroy();restored.destroy();
});

test('Choosing Join after listening on the menu silences playback without storing a user mute',async()=>{
 const {audio}=setup();audio.setMenu();await audio.enable();audio.setHost(false);
 assert.equal(audio.enabled,false);assert.equal(audio.ctx.state,'suspended');assert.equal(audio.muted,false);
 assert.equal(await audio.enable(),false);audio.effect('join');assert.equal(audio.ctx.oscillators.length,0);audio.destroy();
});

test('A slow download cannot start audio after the user joins as a player or mutes',async()=>{
 for(const cancel of [a=>a.setHost(false),a=>a.stop()]){
  const releases=[];
  const {audio}=setup({fetcher:()=>new Promise(resolve=>{releases.push(()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));})});
  audio.setMenu();const enabling=audio.enable();await Promise.resolve();await Promise.resolve();assert.equal(releases.length,2);
  cancel(audio);releases.forEach(release=>release());assert.equal(await enabling,false);
  assert.equal(audio.ctx.started.length,0);assert.equal(audio.enabled,false);assert.equal(audio.ctx.state,'suspended');audio.destroy();
 }
});

test('Failed downloads expose a retry and cannot leave the sound control falsely enabled',async()=>{
 let fail=true;const {audio}=setup({fetcher:async()=>({ok:!fail,arrayBuffer:async()=>new ArrayBuffer(8)})});
 audio.setMenu();assert.equal(await audio.enable(),false);assert.equal(audio.enabled,false);assert.equal(audio.loading,false);assert.match(audio.error,/could not load/);
 fail=false;assert.equal(await audio.enable(),true);assert.equal(audio.error,'');assert.equal(audio.ctx.started.length,2);audio.destroy();
});
