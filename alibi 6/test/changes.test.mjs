import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../game.mjs';
import {generateDecoys} from '../decoys.mjs';
const drawing=[{color:'#202031',size:5,points:[[.1,.1],[.5,.8]]}];
function setup(n=4){let now=1000000;const game=new Game({now:()=>now});const host=game.create();const seats=Array.from({length:n},(_,i)=>game.join(host.room,['Ben','Ada','Jay','Sam'][i]||`P${i}`));const r=game.room(host.room);const act=(seat,type,data={})=>game.action(r.code,seat.token,{type,...data});const seat=id=>seats.find(p=>p.playerId===id);act(host,'start');return {game,host,seats,r,act,seat,now:()=>now,advance:ms=>{now+=ms;game.tick();}};}
function finale(g){for(let i=0;i<g.r.players.length;i++){g.act(g.host,'advance');g.act(g.host,'next');}g.act(g.host,'advance');for(let i=0;i<g.r.players.length;i++){g.act(g.host,'advance');g.act(g.host,'next');}assert.equal(g.r.phase,'truth');}

test('Custom-question decoys follow the topic and match short, lowercase answers',()=>{const allowed=new Set(['my bedroom','my house','my car','my backyard','my childhood home','the beach','the library','a quiet park']);for(let i=0;i<10;i++){const result=generateDecoys({prompt:'What is Ben’s favorite safe space?',truth:'my house',answers:['my bedroom'],count:2});assert.equal(result.length,2);assert.ok(result.every(s=>allowed.has(s)),result.join(', '));assert.ok(!result.includes('my house'));assert.ok(!result.includes('my bedroom'));}});

test('Food, movie, numeric, and location questions get compatible decoys',()=>{
const food=generateDecoys({prompt:'What food would Ben eat every day?',truth:'pizza',answers:['tacos'],count:3});assert.equal(food.length,3);assert.ok(food.every(x=>['pasta','sushi','burgers','mac and cheese','dumplings','ramen','chicken nuggets','cereal','ice cream','grilled cheese'].includes(x)));
const movies=generateDecoys({prompt:'What is Ben’s comfort movie?',truth:'Shrek',answers:['Ratatouille'],count:2});assert.ok(movies.every(x=>['The Princess Bride','School of Rock','The Incredibles','Toy Story','Finding Nemo','Superbad'].includes(x)));
const ages=generateDecoys({prompt:'How old was Ben when he learned to swim?',truth:'8 years old',answers:['10 years old'],count:2});assert.equal(ages.length,2);assert.ok(ages.every(x=>/^\d+ years old$/.test(x)&&!['8 years old','10 years old'].includes(x)));
const places=generateDecoys({prompt:'Where does Ben eat lunch?',truth:'my house',answers:['my car'],count:2});assert.equal(places.length,2);assert.ok(places.every(x=>!['pizza','tacos','burgers'].includes(x)));
});

test('Unknown custom topics use matching player-answer families or omit unrelated filler',()=>{assert.deepEqual(generateDecoys({prompt:'What did Ben whisper during that incident?',truth:'the spoon knows',answers:['ask the window'],count:2}),[]);const inferred=generateDecoys({prompt:'What did Ben choose?',truth:'pizza',answers:['tacos'],count:2});assert.equal(inferred.length,2);assert.ok(inferred.every(s=>s===s.toLowerCase()));});

test('House answers can match a common sentence opening without duplicating a submitted answer',()=>{const result=generateDecoys({prompt:'What food does Ben like?',truth:'I like pizza',answers:['I like tacos'],count:2});assert.equal(result.length,2);assert.ok(result.every(s=>s.startsWith('I like ')&&!['I like pizza','I like tacos'].includes(s)));});

test('Round 2 never borrows decoys from a different generated prompt',()=>{const g=setup(2);for(let i=0;i<2;i++){g.act(g.host,'advance');g.act(g.host,'next');}for(const p of g.seats)g.act(p,'question',{text:'What food would Ben eat every day?'});assert.deepEqual(g.r.t.decoys,[]);g.act(g.seat(g.r.t.subject),'answer',{text:'pizza',lie:'tacos'});const house=g.r.t.options.filter(o=>!o.truth&&!o.owners.length);assert.equal(house.length,2);assert.ok(house.every(o=>['pasta','sushi','burgers','dumplings','ramen','cereal','ice cream','mac and cheese','chicken nuggets','grilled cheese'].includes(o.text)),house.map(o=>o.text).join(', '));});

test('Sixty-second writing and thirty-second voting deadlines progress on expiry',()=>{const g=setup();assert.equal(g.r.deadline-g.now(),60000);g.act(g.seat(g.r.t.subject),'answer',{text:'A sandwich'});g.advance(59999);assert.equal(g.r.phase,'write');g.advance(1);assert.equal(g.r.phase,'vote');assert.equal(g.r.deadline-g.now(),30000);g.advance(29999);assert.equal(g.r.phase,'vote');g.advance(1);assert.equal(g.r.phase,'reveal');});

test('Question writing is capped at ninety seconds, with on-topic fallback metadata',()=>{const g=setup();for(let i=0;i<4;i++){g.act(g.host,'advance');g.act(g.host,'next');}assert.equal(g.r.phase,'questions');assert.equal(g.r.deadline-g.now(),90000);g.advance(89999);assert.equal(g.r.phase,'questions');g.advance(1);assert.equal(g.r.phase,'write');assert.equal(Object.keys(g.r.questions).length,4);assert.ok(g.r.t.decoys.length>=4);assert.equal(g.r.t.prompt,g.r.questions[g.r.t.subject].text);assert.deepEqual(g.r.t.decoys,g.r.questions[g.r.t.subject].decoys);});

for(const n of [3,4,8])test(`${n} players: subject watches, one OTHER artist knows, and drawing lasts ninety seconds`,()=>{
 const g=setup(n);finale(g);assert.equal(g.r.deadline-g.now(),60000);const subject=g.r.t.subject,artist=g.r.t.artist;assert.notEqual(artist,subject);
 g.act(g.seat(subject),'truth',{text:'my house'});assert.equal(g.r.deadline-g.now(),90000);assert.equal(g.game.artists(g.r).length,n-1);
 let informed=0;
 for(const p of g.seats){const snap=g.game.snapshot(g.r,p.token);assert.equal(snap.me.canDraw,p.playerId!==subject);if(snap.me.informed){informed++;assert.equal(snap.me.truth,'my house');assert.equal(p.playerId,artist);}else if(p.playerId!==subject)assert.equal(snap.me.truth,undefined);assert.equal(snap.turn.options.length,0);}
 assert.equal(informed,1);assert.ok(!JSON.stringify(g.game.snapshot(g.r,g.host.token)).includes('my house'));
 g.act(g.seat(artist),'drawing',{strokes:drawing});g.advance(89999);assert.equal(g.r.phase,'draw');g.advance(1);assert.equal(g.r.phase,'vote');assert.equal(g.r.t.options.length,n===3?3:1);assert.equal(g.r.deadline-g.now(),30000);
});

test('Finale rewards subject and informed artist, while uninformed players vote',()=>{
 const g=setup();finale(g);const subject=g.r.t.subject,artist=g.r.t.artist;g.act(g.seat(subject),'truth',{text:'my house'});
 assert.throws(()=>g.act(g.seat(subject),'drawing',{strokes:drawing}),/not drawing/);
 for(const p of g.game.artists(g.r))g.act(g.seat(p.id),'drawing',{strokes:drawing});
 assert.equal(g.r.t.options.length,3);assert.equal(g.game.eligible(g.r).length,2);
 assert.throws(()=>g.act(g.seat(subject),'vote',{choices:[g.r.t.options[0].id]}),/not voting/);
 assert.throws(()=>g.act(g.seat(artist),'vote',{choices:[g.r.t.options[0].id]}),/not voting/);
 const truth=g.r.t.options.find(o=>o.truth);for(const p of g.game.eligible(g.r))g.act(g.seat(p.id),'vote',{choices:[truth.id]});
 assert.ok(g.r.players.every(p=>p.score===1000));
});

test('Pause exposes the frozen remaining time and resumes without resetting the limit',()=>{const g=setup();g.advance(8000);g.act(g.host,'pause');let snap=g.game.snapshot(g.r,g.host.token);assert.equal(snap.phaseDuration,60);assert.equal(snap.remaining,52000);assert.equal(snap.deadline,null);g.advance(100000);g.act(g.host,'pause');snap=g.game.snapshot(g.r,g.host.token);assert.equal(snap.deadline-g.now(),52000);assert.equal(snap.phaseDuration,60);});
