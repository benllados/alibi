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
import {castMarkup} from '../public/gameplay-cast.js';
import {ROUND_NAMES,roleState,scoreLines,revealComment,phaseGuide} from '../public/gameplay-ui.js';
import {qrSvg} from '../public/qr.js';

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
function renderHarness(search='',fetchImpl=async()=>{throw Error('Unexpected API request');}){
 const nodes=new Map(),saved=new Map(),streams=[],windowEvents=new Map(),documentEvents=new Map();let appWrites=0;
 const classes=()=>({add(){},remove(){},toggle(){}});
 const node=selector=>{
  const permanent=['#app','#overlays','#transition','#celebration','#toast'].includes(selector);
  if(!permanent&&selector.startsWith('#')&&![nodes.get('#app'),nodes.get('#overlays')].some(n=>n?.innerHTML.includes(`id="${selector.slice(1)}"`)))return null;
  if(!nodes.has(selector)){
   let html='';const n={dataset:{},value:'',maxLength:140,style:{},classList:classes(),firstElementChild:{classList:classes()},querySelectorAll:()=>[],querySelector:()=>({onclick:null,focus(){}}),focus(){},setAttribute(){},removeAttribute(){},replaceWith(){},getBoundingClientRect:()=>({left:0,top:0,width:320,height:240}),parentElement:{getBoundingClientRect:()=>({width:320,height:240})},setPointerCapture(){},getContext:()=>({fillRect(){},beginPath(){},moveTo(){},lineTo(){},arc(){},fill(){},stroke(){}})};
   if(['#answer','#lie','#second'].includes(selector))n.dataset.draft=selector==='#answer'?'text':selector.slice(1);
   Object.defineProperty(n,'innerHTML',{get:()=>html,set:v=>{html=v;if(selector==='#app')appWrites++;}});nodes.set(selector,n);
  }
  return nodes.get(selector);
 };
 const location={origin:'http://localhost',pathname:'/',search};
 const entries=[{url:'/'+search,state:null}];let index=0;
 const history={get state(){return entries[index].state;},get length(){return entries.length;},pushState(state,_,path){entries.splice(index+1);entries.push({url:path,state});index++;syncURL();},back(){if(index>0){index--;syncURL();windowEvents.get('popstate')?.();}},forward(){if(index<entries.length-1){index++;syncURL();windowEvents.get('popstate')?.();}}};
 function syncURL(){const url=new URL(entries[index].url,location.origin);location.pathname=url.pathname;location.search=url.search;}
 const eventSource=class{constructor(url){this.url=url;this.closed=false;streams.push(this);}close(){this.closed=true;}emit(snapshot){this.onmessage?.({data:JSON.stringify(snapshot)});}};
 const fetch=async(path,options)=>path==='/api/network'?{json:async()=>({addresses:[]})}:fetchImpl(path,options);
 const context=vm.createContext({console,PARTS,LABELS,COLORS,defaultCharacter,validateCharacter,characterSvg,randomCharacter,doodle,roleArt,wordmark,PartyAudio,playgroundMarkup,mountPlayground:()=>({destroy(){},setQuiet(){}}),castMarkup,mountGameCast:()=>({update(){},destroy(){}}),ROUND_NAMES,roleState,scoreLines,revealComment,phaseGuide,qrSvg,AbortController,
  document:{querySelector:selector=>selector.startsWith('.')?null:node(selector),querySelectorAll:selector=>selector==='[data-draft]'?['#answer','#lie','#second'].map(node).filter(Boolean):[],createElement:()=>({innerHTML:'',firstElementChild:{}}),body:{dataset:{},classList:classes()},documentElement:{style:{setProperty(){}}},activeElement:null,addEventListener:(k,fn)=>documentEvents.set(k,fn)},
  window:{addEventListener:(k,fn)=>windowEvents.set(k,fn)},history,location,EventSource:eventSource,fetch,
  sessionStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},
  localStorage:{getItem:()=>null},requestAnimationFrame:()=>0,confirm:()=>true,innerHeight:667,innerWidth:375,URLSearchParams,matchMedia:()=>({matches:true}),setInterval(){},setTimeout:()=>0,clearTimeout(){},Map,Set,
 });
 let source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 source=source.replace(/^import .*;\n/gm,'');
 vm.runInContext(source+`\nglobalThis.ui={set(s){state=s;optionPage=0;scorePage=0;resultTab='answers';},host:hostView,phone:phoneView,home:landing,options,route,navigate,back:backToMenu,saveAuth,action,getState:()=>state,snap:accept,strokeCount:()=>drawings.get(state.turn.id)?.length,open(which){modal=which;renderModal();},close:closeModal,role(){modal='role';renderModal();},size:pageSize,scoreView(page=0){resultTab='scores';scorePage=page;return phoneView();},height(value){innerHeight=value;},next(){optionPage++;},character(){editingCharacter=defaultCharacter();modal='character';renderModal();}};`,context);
 return {ui:context.ui,nodes,history,location,saved,streams,documentEvents,appWrites:()=>appWrites};
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

test('Host opens a new history entry; Back leaves cleanly, Forward reconnects to the same room',async()=>{
 const game=new Game(),host=game.create(),snapshot=game.snapshot(game.room(host.room),host.token);
 let created=0;
 const x=renderHarness('',async path=>{assert.equal(path,'/api/rooms');created++;return {ok:true,json:async()=>host};});
 const button=x.nodes.get('#create-room');await button.onclick({currentTarget:button});
 assert.equal(x.location.pathname,'/host');assert.equal(x.history.length,2);
 assert.match(x.nodes.get('#app').innerHTML,/Back to menu/);
 const first=x.streams[0];first.emit(snapshot);
 assert.equal(x.ui.getState().code,host.room);assert.match(x.nodes.get('#app').innerHTML,/Back to menu/);
 x.history.back();assert.equal(x.location.pathname,'/');assert.ok(first.closed);
 assert.equal(x.ui.getState(),null);assert.match(x.nodes.get('#app').innerHTML,/id="choose-join"/);
 first.emit({...snapshot,version:snapshot.version+5});
 assert.equal(x.ui.getState(),null);assert.match(x.nodes.get('#app').innerHTML,/id="choose-join"/);
 x.history.forward();assert.equal(x.location.pathname,'/host');assert.equal(created,1);
 assert.equal(x.streams.length,2);assert.equal(x.streams[1].url,first.url);
 x.streams[1].emit(snapshot);assert.equal(x.ui.getState().code,host.room);
 // The actual Back to menu anchor follows the same route as browser Back.
 let prevented=false;x.documentEvents.get('click')({button:0,target:{closest:()=>({target:''})},preventDefault(){prevented=true;}});
 assert.ok(prevented);assert.equal(x.location.pathname,'/');assert.ok(x.streams[1].closed);
});

test('Direct host links, reloads, and fresh player invitations preserve their intended destination',()=>{
 const x=renderHarness(),session={room:'WORM',token:'host-token'};
 x.saved.set('host-WORM',JSON.stringify(session));x.history.pushState(null,'','/host?room=WORM');x.ui.route();
 assert.equal(x.streams.length,1);x.ui.route();assert.ok(x.streams[0].closed);assert.equal(x.streams.length,2);
 x.ui.back();assert.equal(x.location.pathname,'/');assert.ok(x.streams[1].closed);
 x.saved.set('seat-WORM',JSON.stringify({room:'WORM',token:'player-token'}));
 x.ui.navigate('/join?room=WORM&fresh=1');assert.match(x.nodes.get('#app').innerHTML,/id="join-form"/);assert.equal(x.streams.length,2);
 x.ui.navigate('/join?room=WORM');assert.equal(x.streams.length,3);assert.match(x.streams[2].url,/token=player-token/);
 x.ui.back();assert.equal(x.location.pathname,'/');assert.ok(x.streams[2].closed);
});

test('Late room creation, action replies, and connection errors cannot restore a room after leaving',async()=>{
 const game=new Game(),host=game.create(),snapshot=game.snapshot(game.room(host.room),host.token);
 let respond;const pending=()=>new Promise(resolve=>{respond=resolve;});
 const x=renderHarness('',pending),button=x.nodes.get('#create-room');
 const creating=button.onclick({currentTarget:button});x.nodes.get('#choose-join').onclick();
 respond({ok:true,json:async()=>host});await creating;
 assert.equal(x.location.pathname,'/join');assert.equal(x.streams.length,0);
 x.ui.saveAuth(host,true);const stream=x.streams[0];stream.emit(snapshot);
 const action=x.ui.action('pause');x.ui.back();
 respond({ok:true,json:async()=>({...snapshot,version:99})});assert.equal(await action,false);
 assert.equal(x.ui.getState(),null);assert.match(x.nodes.get('#app').innerHTML,/id="choose-join"/);
 x.ui.navigate(`/host?room=${host.room}`);const reconnect=x.streams.at(-1),error=reconnect.onerror();x.ui.back();
 respond({status:400,json:async()=>({error:'expired'})});await error;
 assert.equal(x.ui.getState(),null);assert.match(x.nodes.get('#app').innerHTML,/id="choose-join"/);
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


test('Other players submitting and pause/reconnect snapshots keep the active text field mounted and restore its saved draft',()=>{
 const game=new Game(),host=game.create(),seats=Array.from({length:3},(_,i)=>game.join(host.room,`Player ${i}`)),room=game.room(host.room);game.action(host.room,host.token,{type:'start'});
 const writer=room.players.find(p=>p.id!==room.t.subject),x=renderHarness();x.ui.saveAuth(seats.find(s=>s.playerId===writer.id),false);x.streams[0].emit(game.snapshot(room,writer.token));
 const input=x.nodes.get('#answer');input.value='my unfinished brilliant lie';input.oninput();const writes=x.appWrites();
 game.action(host.room,room.players.find(p=>p.id===room.t.subject).token,{type:'answer',text:'the actual answer'});x.streams[0].emit(game.snapshot(room,writer.token));
 assert.equal(x.appWrites(),writes);assert.equal(x.nodes.get('#answer').value,'my unfinished brilliant lie');
 game.action(host.room,host.token,{type:'pause'});x.streams[0].emit(game.snapshot(room,writer.token));assert.equal(x.appWrites(),writes);assert.match(x.nodes.get('#pause-layer').innerHTML,/host paused/);
 game.action(host.room,host.token,{type:'pause'});x.streams[0].emit(game.snapshot(room,writer.token));assert.equal(x.appWrites(),writes);
 x.ui.back();input.value='';x.ui.navigate(`/join?room=${host.room}`);x.streams.at(-1).emit(game.snapshot(room,writer.token));assert.equal(x.nodes.get('#answer').value,'my unfinished brilliant lie');
});

test('Drawing stays mounted during peer submissions; Undo, Redo, Clear and restore keep actual stroke data',()=>{
 const game=new Game(),host=game.create(),seats=Array.from({length:4},(_,i)=>game.join(host.room,`Artist ${i}`)),room=game.room(host.room);
 game.action(host.room,host.token,{type:'start'});for(let round=0;round<2;round++){if(round)game.action(host.room,host.token,{type:'advance'});for(let i=0;i<4;i++){game.action(host.room,host.token,{type:'advance'});game.action(host.room,host.token,{type:'next'});}}
 game.action(host.room,room.players.find(p=>p.id===room.t.subject).token,{type:'truth',text:'my house'});
 const [artist,peer]=game.artists(room),x=renderHarness();x.ui.saveAuth(seats.find(s=>s.playerId===artist.id),false);x.streams[0].emit(game.snapshot(room,artist.token));
 const canvas=x.nodes.get('#drawing'),stroke=(id,a,b)=>{canvas.onpointerdown({button:0,pointerId:id,clientX:a,clientY:20,preventDefault(){}});canvas.onpointermove({clientX:b,clientY:100});canvas.onpointerup();};stroke(1,20,120);stroke(2,50,170);assert.equal(x.ui.strokeCount(),2);
 const writes=x.appWrites();game.action(host.room,peer.token,{type:'drawing',strokes:[{color:'#202031',size:5,points:[[.2,.2],[.6,.6]]}]});x.streams[0].emit(game.snapshot(room,artist.token));assert.equal(x.appWrites(),writes);assert.equal(x.ui.strokeCount(),2);
 x.nodes.get('#undo').onclick();assert.equal(x.ui.strokeCount(),1);x.nodes.get('#redo').onclick();assert.equal(x.ui.strokeCount(),2);x.nodes.get('#clear').onclick();assert.equal(x.ui.strokeCount(),0);x.nodes.get('#undo').onclick();assert.equal(x.ui.strokeCount(),2);
 x.ui.back();x.ui.navigate(`/join?room=${host.room}`);x.streams.at(-1).emit(game.snapshot(room,artist.token));assert.equal(x.ui.strokeCount(),2);
});


test('Automatic retry sends the exact original payload and request ID after a lost reply',async()=>{
 const game=new Game(),host=game.create(),room=game.room(host.room),payloads=[];let sent,reply;
 const notified=new Promise(resolve=>sent=resolve);
 const x=renderHarness('',async(_,options)=>{payloads.push(JSON.parse(options.body));if(payloads.length===1){sent();return new Promise((resolve,reject)=>reply=()=>reject(Error('connection lost')));}return {ok:true,json:async()=>game.snapshot(room,host.token)};});
 x.ui.saveAuth(host,true);x.streams[0].emit(game.snapshot(room,host.token));
 const strokes=[{color:'#202031',size:5,points:[[.1,.2]]}],pending=x.ui.action('drawing',{strokes});await notified;strokes[0].points.push([.9,.9]);reply();assert.equal(await pending,true);
 assert.equal(payloads.length,2);assert.deepEqual(payloads[0],payloads[1]);assert.equal(payloads[1].strokes[0].points.length,1);assert.ok(payloads[0].requestId);
});


test('Phone results keep point receipts separate from paged scores and show the next-step countdown',()=>{
 const {ui}=renderHarness(),game=new Game(),host=game.create(),seats=Array.from({length:8},(_,i)=>game.join(host.room,i?'Long player name '+i:'Mon')),room=game.room(host.room);
 game.action(host.room,host.token,{type:'start'});room.t.prompt='Where would Ben hide from a persistent duck?';
 for(const p of room.players)game.action(host.room,p.token,{type:'answer',text:p.id===room.t.subject?'my house':p.name});
 for(const p of game.eligible(room))game.action(host.room,p.token,{type:'vote',choices:[room.t.options.find(o=>o.truth).id]});
 const me=game.eligible(room)[0];ui.set(game.snapshot(room,me.token));let html=ui.scoreView();
 assert.match(html,/phone-score-results/);assert.ok(html.indexOf('class="score-receipt"')<html.indexOf('class="score-sheet"'));
 assert.match(html,/>Scores<\/button>/);assert.doesNotMatch(html,/My points &amp; scores|host starts the next turn/);assert.match(html,/Next question in 10s/);
 const allIds=[];for(let i=0;i<4;i++){html=ui.scoreView(i);const ids=[...html.matchAll(/data-score-player="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,2);allIds.push(...ids);assert.equal((html.match(/class="score-numbers"/g)||[]).length,2);}
 assert.equal(new Set(allIds).size,8);
 ui.height(900);assert.equal((ui.scoreView().match(/data-score-player=/g)||[]).length,4);
 ui.height(550);assert.equal((ui.scoreView().match(/data-score-player=/g)||[]).length,1);
 game.action(host.room,host.token,{type:'pause'});ui.set(game.snapshot(room,me.token));assert.match(ui.scoreView(),/Paused by host/);
 ui.set(game.snapshot(room,host.token));assert.match(ui.host(),/Next question now/);
 game.action(host.room,host.token,{type:'pause'});room.round=3;room.turnIndex=0;room.finalSubjects=[room.t.subject];ui.set(game.snapshot(room,me.token));assert.match(ui.scoreView(),/Final results/);
});
