import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game} from '../game.mjs';
import {PARTS,LABELS,COLORS,defaultCharacter,validateCharacter,characterSvg,randomCharacter} from '../public/characters.js';
import {doodle,roleArt} from '../public/art.js';
import {wordmark} from '../public/logo.js';
import {PartyAudio} from '../public/audio.js';
import {playgroundMarkup} from '../public/playground.js';

test('Character choices survive joining, lobby edits, private snapshots, and reconnects',()=>{
 const game=new Game(),host=game.create();
 const character={...defaultCharacter(3),hat:'frog',glasses:'heart',pose:'peace',hair:'handlebar'};
 const first=game.join(host.room,'Ben',character),second=game.join(host.room,'Jac');
 const room=game.room(host.room);
 for(const token of [host.token,first.token,second.token])assert.deepEqual(game.snapshot(room,token).players[0].character,character);
 game.action(host.room,first.token,{type:'character',character:{...character,outfit:'overalls'}});
 assert.equal(game.snapshot(room,second.token).players[0].character.outfit,'overalls');
 assert.equal(game.snapshot(room,host.token).players[0].token,undefined);
 assert.throws(()=>game.action(host.room,host.token,{type:'character',character}),/player device/);
 game.action(host.room,host.token,{type:'start'});
 assert.throws(()=>game.action(host.room,first.token,{type:'character',character}),/locked/);
 assert.equal(game.snapshot(room,second.token).players[0].role,undefined);
});

test('Malformed avatar values cannot inject markup, mutate other players, or allocate arbitrary assets',()=>{
 for(const value of [null,[],{hat:'<script>alert(1)</script>'},{color:'#fff'},{__html:'x'},{head:{}},{pose:42}])assert.throws(()=>validateCharacter(value));
 const game=new Game(),host=game.create(),a=game.join(host.room,'A'),b=game.join(host.room,'B');
 const old=game.snapshot(game.room(host.room),a.token).players[1].character;
 game.action(host.room,a.token,{type:'character',playerId:b.playerId,character:{hat:'crown'}});
 assert.deepEqual(game.snapshot(game.room(host.room),a.token).players[1].character,old);
 assert.doesNotMatch(characterSvg({hat:'<script>'}),/<script|onerror|href=/);
 for(const [part,values] of Object.entries(PARTS))for(const value of values)assert.match(characterSvg({...defaultCharacter(),[part]:value}),/^<svg/);
});

// Template checks exercise every live phase with real server snapshots. They do
// not simulate browser layout, canvas pointer interaction, or audio playback.
function renderHarness(search=''){
 const nodes=new Map();
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',dataset:{},classList:{add(){},remove(){},toggle(){}},querySelectorAll:()=>[],querySelector:()=>({onclick:null,focus(){}}),focus(){}});return nodes.get(selector);};
 const context=vm.createContext({console,PARTS,LABELS,COLORS,defaultCharacter,validateCharacter,characterSvg,randomCharacter,doodle,roleArt,wordmark,PartyAudio,playgroundMarkup,mountPlayground:()=>({destroy(){},setQuiet(){}}),
  document:{querySelector:node,querySelectorAll:()=>[],body:{dataset:{}},activeElement:null},
  localStorage:{getItem:()=>null},innerHeight:667,innerWidth:375,URLSearchParams,location:{search,origin:'http://localhost'},setTimeout:()=>0,clearTimeout(){},Map,Set,
 });
 let source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 source=source.replace(/^import .*;\n/gm,'');source=source.slice(0,source.indexOf('function viewport()'));
 vm.runInContext(source+`\nglobalThis.ui={set(s){state=s;optionPage=0;scorePage=0;resultTab='answers';},host:hostView,phone:phoneView,home:landing,options,open(which){modal=which;renderModal();},close:closeModal,role(){modal='role';renderModal();},size:pageSize,next(){optionPage++;},character(){editingCharacter=defaultCharacter();modal='character';renderModal();}};`,context);
 return {ui:context.ui,nodes};
}
test('Redesigned templates render a complete eight-player game with private role sheets',()=>{
 const {ui,nodes}=renderHarness();ui.home();assert.match(nodes.get('#app').innerHTML,/get in here/);assert.match(nodes.get('#app').innerHTML,/choose-join/);assert.doesNotMatch(nodes.get('#app').innerHTML,/join-form/);
 const game=new Game(),host=game.create(),seats=Array.from({length:8},(_,i)=>game.join(host.room,`Friend ${i+1}`,defaultCharacter(i))),room=game.room(host.room);
 function renderEveryone(){
  ui.set(game.snapshot(room,host.token));const hostHtml=ui.host();assert.match(hostHtml,/class="shell host/);assert.doesNotMatch(hostHtml,/id="use-power"|id="submission"/);
  for(const seat of seats){const state=game.snapshot(room,seat.token);ui.set(state);const html=ui.phone();assert.match(html,/class="shell phone/);assert.doesNotMatch(html,/undefined|null/);if(state.me.role&&state.round<3){ui.role();assert.match(nodes.get('#overlays').innerHTML,/role-description/);}}
 }
 renderEveryone();ui.character();assert.match(nodes.get('#overlays').innerHTML,/character-editor/);
 game.action(host.room,host.token,{type:'start'});
 let turns=0;
 while(room.phase!=='finished'){
  renderEveryone();
  if(room.phase==='write'){for(const p of room.players)game.action(host.room,p.token,{type:'answer',text:p.id===room.t.subject?'my toaster':`a secret item ${p.name}`});}
  else if(room.phase==='questions'){for(const p of room.players)game.action(host.room,p.token,{type:'question',text:'Which object could blackmail this person?'});}
  else if(room.phase==='truth')game.action(host.room,room.players.find(p=>p.id===room.t.subject).token,{type:'truth',text:'my house'});
  else if(room.phase==='draw'){for(const p of game.artists(room))game.action(host.room,p.token,{type:'drawing',strokes:[{color:'#202031',size:5,points:[[.1,.1],[.8,.8]]}]});}
  else if(room.phase==='vote'){for(const p of game.eligible(room)){const choice=room.t.options.find(o=>o.truth);game.action(host.room,p.token,{type:'vote',choices:[choice.id]});}}
  else if(room.phase==='reveal'){game.action(host.room,host.token,{type:'next'});turns++;}
  else assert.fail(room.phase);
 }
 renderEveryone();assert.equal(turns,17);
});

test('Phone ballots page through every answer and escape player text without exposing ownership',()=>{
 const {ui}=renderHarness(),game=new Game(),host=game.create();for(let i=0;i<8;i++)game.join(host.room,`Player ${i}`);
 const room=game.room(host.room);game.action(host.room,host.token,{type:'start'});
 for(const p of room.players)game.action(host.room,p.token,{type:'answer',text:p.id===room.t.subject?'The truth is a sandwich':`${p.name} <script>alert(1)</script> ${'x'.repeat(80)}`});
 const voter=game.eligible(room)[0],snapshot=game.snapshot(room,voter.token);ui.set(snapshot);assert.equal(ui.size(),1);
 for(let i=0;i<8;i++){const html=ui.options(false,true);assert.equal((html.match(/data-option=/g)||[]).length,1);assert.ok(html.includes(snapshot.turn.options[i].id));assert.doesNotMatch(html,/<script>/);assert.doesNotMatch(html,/truth-stamp/);if(snapshot.turn.options[i].owned)assert.match(html,/disabled/);ui.next();}
});

test('Music never initializes from a player client and creates no audio until enabled',async()=>{
 const audio=new PartyAudio();assert.equal(audio.host,false);assert.equal(audio.ctx,null);assert.equal(await audio.enable(),false);assert.equal(audio.ctx,null);audio.effect('win');assert.equal(audio.ctx,null);
});

test('Logo keeps separate i dots for the smile transition while preserving compound glyph paths',()=>{
 const markup=wordmark();assert.equal((markup.match(/class="logo-eye"/g)||[]).length,2);assert.equal((markup.match(/class="logo-letter"/g)||[]).length,5);assert.match(markup,/class="face-circle"/);assert.match(markup,/class="face-smile"/);
});


test('Home separates Host and Join, while invitations and draft identity survive navigation',()=>{
 const {ui,nodes}=renderHarness();ui.home();
 let html=nodes.get('#app').innerHTML;
 assert.match(html,/id="create-room"/);assert.match(html,/id="choose-join"/);
 assert.doesNotMatch(html,/<form/);
 nodes.get('#choose-join').onclick();
 html=nodes.get('#app').innerHTML;assert.match(html,/id="join-form"/);assert.doesNotMatch(html,/id="create-room"/);
 nodes.get('#room').oninput({target:{value:'WORM'}});nodes.get('#name').oninput({target:{value:'<Ben & Jac>'}});
 nodes.get('#back-home').onclick();nodes.get('#choose-join').onclick();
 html=nodes.get('#app').innerHTML;assert.match(html,/value="WORM"/);assert.match(html,/value="&lt;Ben &amp; Jac&gt;"/);assert.doesNotMatch(html,/<Ben/);
 const invited=renderHarness('?room=ABCD');invited.ui.home();
 assert.match(invited.nodes.get('#app').innerHTML,/id="join-form"/);assert.match(invited.nodes.get('#app').innerHTML,/value="ABCD"/);
});

test('Preview does not autoplay or create a room and pauses when closed',()=>{
 const {ui,nodes}=renderHarness();ui.home();nodes.get('#watch-preview').onclick();
 const html=nodes.get('#overlays').innerHTML;assert.match(html,/<video[^>]+controls[^>]+playsinline[^>]+preload="none"/);assert.doesNotMatch(html,/autoplay/);
 assert.match(html,/animated walkthrough/);assert.match(html,/Read the walkthrough/);
 let paused=0;nodes.set('#feature-video',{pause:()=>paused++});
 ui.close();assert.equal(paused,1);assert.equal(nodes.get('#overlays').innerHTML,'');
 ui.open('about');assert.match(nodes.get('#overlays').innerHTML,/server restart clears games/);
 nodes.get('#about-preview').onclick();assert.match(nodes.get('#overlays').innerHTML,/id="feature-video"/);
});
