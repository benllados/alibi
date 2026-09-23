import test from 'node:test';
import assert from 'node:assert/strict';
import {CAST,CYCLE,PROGRAM,schedule,cueAt,sceneFrame,point,headPoint} from '../public/playground-scene.js';
import {mountPlayground,renderSceneSvg} from '../public/playground.js';
import {castMarkup,mountGameCast} from '../public/gameplay-cast.js';
import {validateCharacter} from '../public/characters.js';

const desktop={width:1280,height:740,mobile:false,stage:{x:65,y:507,width:1130,height:176},logo:{x:90,y:95,width:470,height:240},sheet:{x:770,y:132,width:400,height:370},star:{x:1180,y:214},pencil:{x:1193,y:517}};
const phone={width:359,height:651,mobile:true,stage:{x:29,y:503,width:305,height:88},logo:{x:110,y:43,width:139,height:69},sheet:{x:34,y:200,width:292,height:283},star:{x:334,y:248},pencil:{x:327,y:483}};

test('The cast uses valid game pieces and independent simultaneous action tracks',()=>{
 for(const {name,...config} of CAST)assert.deepEqual(validateCharacter(config),config);
 for(const part of ['head','hat','outfit'])assert.equal(new Set(CAST.map(c=>c[part])).size,4);
 assert.deepEqual(cueAt(1).active.map(e=>e.name),['football','paper craft','wand practice']);
 assert.equal(PROGRAM.find(e=>e.name==='magic').start,7);
 assert.ok(cueAt(16).active.some(e=>e.name==='magic'));assert.ok(cueAt(16).active.some(e=>e.name==='plane'));
 assert.ok(cueAt(20).active.some(e=>e.name==='pencil audition'));
 const frame=sceneFrame(desktop,1.5);assert.equal(new Set(frame.actors.map(a=>a.action)).size,4);assert.ok(frame.props.ball);assert.ok(frame.props.paper);assert.ok(frame.props.receipt);
 assert.ok(sceneFrame(desktop,34).props.ball);assert.match(sceneFrame(desktop,34).actors[0].action,/climbing/);
 assert.ok(schedule(0).find(e=>e.name==='pencil').start<schedule(0).find(e=>e.name==='repair').start);
 assert.ok(schedule(1).find(e=>e.name==='pencil').start>schedule(1).find(e=>e.name==='repair').start);
});

test('Magic sprouts legs, transfers one frog to the hat and sheet, and regrows the original',()=>{
 for(const L of [desktop,phone]){
  const start=7;
  assert.ok(sceneFrame(L,start+3.1).props.frogFeet);
  const airborne=sceneFrame(L,start+3.5);assert.ok(airborne.actors[0].hatHidden);assert.ok(airborne.props.frog);
  const perched=sceneFrame(L,start+4.1),hat=headPoint(perched.actors[1],108,7);
  // The late facial reaction changes the head by only a few drawing units.
  assert.ok(Math.hypot(perched.props.frog.x-hat.x,perched.props.frog.y-hat.y)<15);
  const ledge=sceneFrame(L,start+5.7);assert.ok(Math.abs(ledge.props.frog.y-(L.sheet.y+L.sheet.height+5*(L.stage.height-7)/242))<1);
  const sprout=sceneFrame(L,start+7.75),grown=sceneFrame(L,start+9.2);
  assert.equal(sprout.actors[0].hatHidden,false);assert.ok(sprout.actors[0].hatScale<.3);assert.equal(grown.actors[0].hatScale,1);
  assert.equal(grown.props.frog,undefined);assert.equal(sceneFrame(L,18.7).actors[3].magic,0);
 }
});

test('Running jokes retain state across activities and both authored scene orders',()=>{
 for(const base of [0,CYCLE]){
  const variant=base/CYCLE,repair=schedule(variant).find(e=>e.name==='repair').start,pencil=schedule(variant).find(e=>e.name==='pencil').start;
  assert.equal(sceneFrame(desktop,base+4).starTilt,0);assert.equal(sceneFrame(desktop,base+5).starTilt,19);
  assert.equal(sceneFrame(desktop,base+19).starTilt,19);assert.ok(sceneFrame(desktop,base+repair+3).starTilt<0);
  assert.equal(sceneFrame(desktop,base+repair+6).starTilt,0);
  assert.ok(sceneFrame(desktop,base+pencil+4).props.pencil);assert.equal(sceneFrame(desktop,base+pencil+4).pencilAway,true);
  assert.equal(sceneFrame(desktop,base+pencil+8.6).pencilAway,false);
 }
 assert.ok(sceneFrame(desktop,16.6).backPlane);assert.equal(sceneFrame(desktop,19).backPlane,false);
});

test('Held objects attach to the rendered hands; two carriers support the same pencil',()=>{
 for(const L of [desktop,phone])for(const time of [1.5,8.3,15.3,21.7,25,27]){
  const f=sceneFrame(L,time);
  for(const p of Object.values(f.props))if(p.owner!==undefined){const hand=point(f.actors[p.owner],...f.actors[p.owner].hands[p.hand]);assert.ok(Math.hypot(p.x-hand.x,p.y-hand.y)<.01,`detached object at ${time}`);}
  if(time===25||time===27){const pen=f.props.pencil,angle=pen.angle*Math.PI/180;for(const [id,side,offset] of [[0,1,-85],[1,0,83]]){const hand=point(f.actors[id],...f.actors[id].hands[side]);assert.ok(Math.hypot(hand.x-(pen.x+offset*pen.scale*Math.cos(angle)),hand.y-(pen.y+offset*pen.scale*Math.sin(angle)))<.01);}}
 }
});

test('Two complete cycles stay finite and on the notebook at laptop and phone sizes',()=>{
 for(const L of [desktop,phone])for(let time=0;time<CYCLE*2;time+=.05){
  const f=sceneFrame(L,time);
  const numbers=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v),`${time}: ${v}`);else if(v&&typeof v==='object')Object.values(v).forEach(numbers);};numbers(f);
  assert.equal(f.actors.length,4);
  for(const p of f.actors){assert.ok(p.x>0&&p.x<L.width,`${time}: character outside notebook`);assert.ok(p.s>0);}
  const quiet=sceneFrame(L,time,{quiet:true});assert.deepEqual(quiet.props,{});assert.equal(quiet.pencilAway,false);
 }
 const svg=renderSceneSvg(desktop,sceneFrame(desktop,11));assert.doesNotMatch(svg,/NaN|undefined|Infinity/);assert.equal((svg.match(/data-actor=/g)||[]).length,4);
});

// A small DOM fixture exercises scheduling and cleanup without pretending to
// measure browser layout. Bounds above are explicit test inputs.
class Node {
 constructor(tag='div',attrs={}){this.tag=tag;this.attrs={...attrs};this.children=[];this.dataset=Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));this.style={setProperty(){},removeProperty(){}};}
 set innerHTML(source){this.children=[];this.insertAdjacentHTML('beforeend',source);}
 getAttribute(k){return this.attrs[k]??null;} setAttribute(k,v){this.attrs[k]=String(v);}
 matches(s){if(s.startsWith('.'))return (this.attrs.class||'').split(' ').includes(s.slice(1));if(s.startsWith('['))return Object.hasOwn(this.attrs,s.slice(1,-1));return this.tag===s;}
 querySelectorAll(s){const [parent,child]=s.split(' ');const all=this.children.flatMap(n=>[n,...n.querySelectorAll('*')]);return child?all.filter(n=>n.matches(parent)).flatMap(n=>n.querySelectorAll(child)):all.filter(n=>s==='*'||n.matches(s));}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
 append(n){n.parent=this;this.children.push(n);return n;}
 insertAdjacentHTML(_,source){const stack=[this];for(const match of source.matchAll(/<(\/)?([\w-]+)([^>]*)>/g)){const [,close,tag,rest]=match;if(close){stack.pop();continue;}const attrs=Object.fromEntries([...rest.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));const n=stack.at(-1).append(new Node(tag,attrs));if(!rest.endsWith('/'))stack.push(n);}}
}
function fixture(){
 const eventTarget=()=>{const listeners=new Map();return {listeners,addEventListener(k,v){listeners.set(k,v);},removeEventListener(k){listeners.delete(k);},fire(k){listeners.get(k)?.();}};};
 const doc={...eventTarget(),hidden:false};const media={...eventTarget(),matches:false};
 const frames=new Map(),saved=new Map();let id=0,disconnected=false;
 const env={...eventTarget(),document:doc,matchMedia:()=>media,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:k=>frames.delete(k),ResizeObserver:class{observe(){}disconnect(){disconnected=true;}}};
 const home=new Node();home.ownerDocument=doc;home.getBoundingClientRect=()=>({left:0,top:0,width:1280,height:740});
 const rect=(className,r)=>{const n=home.append(new Node('div',{class:className}));n.getBoundingClientRect=()=>({left:r.x,top:r.y,width:r.width,height:r.height});return n;};
 rect('playground-space',desktop.stage);rect('home-logo',desktop.logo);rect('join-sheet',desktop.sheet);
 rect('home-star',{x:1160,y:194,width:40,height:40});rect('home-pencil',{x:1173,y:497,width:40,height:40});
 return {home,env,doc,media,frames,saved,disconnected:()=>disconnected,step(now){const work=[...frames.values()];frames.clear();work.forEach(fn=>fn(now));}};
}

test('Animation works without a pause button and stops while hidden or reduced; quiet forms clear props; leaving tears everything down',()=>{
 const x=fixture(),p=mountPlayground(x.home,{env:x.env});
 assert.equal(x.frames.size,1);
 for(let t=100;t<8000;t+=100)x.step(t);
 const actor=x.home.querySelector('[data-actor]'),position=actor.getAttribute('transform');
 x.doc.hidden=true;x.doc.fire('visibilitychange');assert.equal(x.frames.size,0);
 x.step(900000);assert.equal(actor.getAttribute('transform'),position);
 x.doc.hidden=false;x.doc.fire('visibilitychange');x.step(900100);assert.equal(actor.getAttribute('transform'),position);
 p.setQuiet(true);for(const n of x.home.querySelectorAll('[data-prop]'))assert.equal(n.getAttribute('opacity'),'0');
 p.setQuiet(false);assert.equal(x.frames.size,1);
 x.media.matches=true;x.media.fire('change');assert.equal(x.frames.size,0);
 x.media.matches=false;x.media.fire('change');assert.equal(x.frames.size,1);
 p.destroy();p.destroy();assert.equal(x.frames.size,0);assert.ok(x.disconnected());assert.equal(x.doc.listeners.size,0);assert.equal(x.env.listeners.size,0);assert.equal(x.media.listeners.size,0);assert.equal(x.home.querySelectorAll('svg').length,0);
});

test('A retired pause preference cannot leave the menu characters permanently frozen',()=>{
 const x=fixture();x.saved.set('alibi-playground-paused','true');const p=mountPlayground(x.home,{env:x.env});assert.equal(x.frames.size,1);assert.equal(x.home.querySelector('.playground-toggle'),null);p.destroy();
});


test('Live match rigs use chosen appearances, react to submissions, pause, and clean up their animation loop',()=>{
 const x=fixture();let s={phase:'lobby',players:CAST.map(({name,...character},i)=>({id:String(i),name,character,color:i,score:0,ready:false}))};
 x.home.innerHTML=castMarkup(s.players,{couch:true});
 const cast=mountGameCast(x.home,s,{env:x.env});assert.equal(x.frames.size,1);
 const seats=x.home.querySelectorAll('[data-cast-player]');assert.equal(seats.length,4);
 s={...s,phase:'write',turn:{writers:s.players.map(p=>p.id)}};cast.update(s);for(const seat of seats){assert.equal(seat.dataset.mood,'writing');assert.equal(seat.querySelector('.rig-paper').getAttribute('opacity'),'1');}
 x.step(100);x.step(300);const head=seats[0].querySelectorAll('[data-part]').find(n=>n.dataset.part==='head'),before=head.getAttribute('transform');x.step(600);assert.notEqual(head.getAttribute('transform'),before);
 s.players[0].ready=true;cast.update(s);assert.equal(seats[0].dataset.mood,'done');assert.equal(seats[0].querySelector('.rig-paper').getAttribute('opacity'),'0');
 const oldSvg=seats[1].querySelector('.live-character');s.players[1].character={...s.players[1].character,hat:'crown'};cast.update(s);assert.notEqual(seats[1].querySelector('.live-character'),oldSvg);
 s.paused=true;cast.update(s);assert.equal(x.frames.size,0);s.paused=false;cast.update(s);assert.equal(x.frames.size,1);
 x.doc.hidden=true;x.doc.fire('visibilitychange');assert.equal(x.frames.size,0);x.doc.hidden=false;x.doc.fire('visibilitychange');assert.equal(x.frames.size,1);
 x.media.matches=true;x.media.fire('change');assert.equal(x.frames.size,0);cast.destroy();assert.equal(x.doc.listeners.size,0);assert.equal(x.media.listeners.size,0);assert.equal(x.frames.size,0);
});
