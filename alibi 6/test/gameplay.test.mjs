import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Game,TIMERS,ROLES} from '../game.mjs';
import {castMood,characterPose} from '../public/gameplay-cast.js';
import {roleState,scoreLines} from '../public/gameplay-ui.js';
import {qrMatrix,qrSvg} from '../public/qr.js';
import {matchAnswerStyle} from '../decoys.mjs';
const strokes=[{color:'#202031',size:5,points:[[.1,.2],[.9,.7]]}];
function setup(n=4){let now=10000;const game=new Game({now:()=>now,leadMs:1800}),host=game.create(),seats=Array.from({length:n},(_,i)=>game.join(host.room,`Friend ${i}`)),room=game.room(host.room),act=(who,type,data={})=>game.action(host.room,who.token,{type,...data});act(host,'start');return {game,host,seats,room,act,setNow:x=>now=x};}
function write(g){for(const p of g.room.players)if(g.room.players.length>2||p.id===g.room.t.subject)g.act(p,'answer',{text:p.id===g.room.t.subject?'a toaster':p.name,lie:'a wallet'});}
function finishNormal(g){write(g);for(const p of g.game.eligible(g.room))g.act(p,'vote',{choices:[g.room.t.options.find(o=>o.truth).id]});}

test('Presentation lead leaves every second available and pause preserves the unspent lead',()=>{
 const g=setup();assert.deepEqual(TIMERS,{questions:90,write:60,truth:60,draw:90,vote:30,reveal:10});
 assert.equal(g.room.phaseStartsAt,11800);assert.equal(g.room.deadline,71800);
 g.setNow(10500);g.act(g.host,'pause');g.setNow(500000);g.game.tick();assert.equal(g.room.phase,'write');g.act(g.host,'pause');
 assert.equal(g.room.phaseStartsAt,501300);assert.equal(g.room.deadline,561300);
 g.setNow(561299);g.game.tick();assert.equal(g.room.phase,'write');g.setNow(561300);g.game.tick();assert.equal(g.room.phase,'reveal');assert.ok(g.room.t.skipped);
});
for(const count of [2,3,8])test(`${count} players advance on the last required submission with time still remaining`,()=>{
 const g=setup(count);for(let i=0;i<count;i++){finishNormal(g);assert.equal(g.room.phase,'reveal');g.act(g.host,'next');}
 assert.equal(g.room.phase,'questions');assert.equal(g.room.deadline,101800);
 for(const [i,p] of g.room.players.entries()){g.act(p,'question',{text:'What would this person sell at a very unsuccessful shop?'});assert.equal(g.room.phase,i===count-1?'write':'questions');}
 for(let i=0;i<count;i++){finishNormal(g);g.act(g.host,'next');}
 assert.equal(g.room.phase,'truth');g.act(g.room.players.find(p=>p.id===g.room.t.subject),'truth',{text:'my house'});assert.equal(g.room.phase,'draw');
 const artists=g.game.artists(g.room);for(const [i,p] of artists.entries()){g.act(p,'drawing',{strokes});assert.equal(g.room.phase,i===artists.length-1?'vote':'draw');}
 const voters=g.game.eligible(g.room);for(const [i,p] of voters.entries()){g.act(p,'vote',{choices:[g.room.t.options.find(o=>o.truth).id]});assert.equal(g.room.phase,i===voters.length-1?'reveal':'vote');}
 // No tick/force/clock movement was needed for any submission phase.
 assert.equal(g.room.phaseStartedAt,10000);
});

test('Lost replies can be retried after a phase change without a second vote, score, or next turn',()=>{
 const g=setup(2);write(g);const p=g.game.eligible(g.room)[0],vote={type:'vote',choices:[g.room.t.options.find(o=>o.truth).id],turnId:g.room.t.id,requestId:'vote-retry'};
 g.game.action(g.host.room,p.token,vote);const score=p.score,version=g.room.version;
 const repeat=g.game.action(g.host.room,p.token,vote);assert.equal(repeat.phase,'reveal');assert.equal(g.room.version,version);assert.equal(p.score,score);
 const next={type:'next',turnId:g.room.t.id,requestId:'next-retry'};g.game.action(g.host.room,g.host.token,next);const turn=g.room.t.id;
 g.game.action(g.host.room,g.host.token,next);assert.equal(g.room.t.id,turn);assert.equal(g.room.turnIndex,1);
 assert.throws(()=>g.game.action(g.host.room,g.host.token,{...next,type:'advance'}),/already used/);
});

test('Every score delta has a matching receipt, including role losses, and receipts stay private until reveal',()=>{
 const g=setup();write(g);const [a,b,c]=g.game.eligible(g.room);a.role=ROLES.find(r=>r.id==='gambler');b.role=ROLES.find(r=>r.id==='showboat');
 g.act(a,'power');g.act(b,'power');const lie=g.room.t.options.find(o=>o.owners.includes(b.id)),truth=g.room.t.options.find(o=>o.truth);
 g.act(a,'vote',{choices:[lie.id]});g.act(b,'vote',{choices:[truth.id]});
 for(const p of [g.host,...g.room.players]){const snapshot=g.game.snapshot(g.room,p.token);assert.equal(snapshot.turn.ledger,undefined);assert.equal(snapshot.turn.reactions,undefined);assert.equal(snapshot.players[0].stats,undefined);}
 g.act(c,'vote',{choices:[lie.id]});assert.equal(a.score,-250);assert.equal(b.score,1500);
 const s=g.game.snapshot(g.room,g.host.token);for(const p of g.room.players){assert.equal(scoreLines(s,p.id).reduce((n,r)=>n+r.points,0),s.turn.deltas[p.id]||0);assert.equal(s.turn.deltas[p.id]||0,p.score);}
 assert.equal(s.turn.ledger[a.id][0].reason,'Lost your wager');assert.equal(b.stats.fooled,2);assert.equal(b.stats.correct,1);
 assert.equal(s.turn.reactions[b.id],'bluffer');assert.equal(s.turn.reactions[a.id],'fooled');
});

test('Roles expose only eligible targets and reader waits for an actual locked vote',()=>{
 const g=setup();write(g);const [a,b]=g.game.eligible(g.room);a.role=ROLES.find(r=>r.id==='reader');
 let s=g.game.snapshot(g.room,a.token);assert.equal(roleState(s).available,false);assert.equal(roleState(s).targets.length,0);
 g.act(b,'vote',{choices:[g.room.t.options.find(o=>o.truth).id]});s=g.game.snapshot(g.room,a.token);assert.equal(roleState(s).available,true);assert.deepEqual(roleState(s).targets.map(p=>p.id),[b.id]);
 a.role=ROLES.find(r=>r.id==='bounty');s=g.game.snapshot(g.room,a.token);assert.ok(roleState(s).targets.every(p=>p.id!==a.id&&p.id!==g.room.t.subject));g.act(a,'vote',{choices:[g.room.t.options.find(o=>o.truth).id]});assert.equal(roleState(g.game.snapshot(g.room,a.token)).available,false);
});

test('Public character moods never reveal which artist was informed',()=>{
 const players=Array.from({length:4},(_,i)=>({id:String(i),ready:false,score:0,color:i})),s={phase:'draw',players,turn:{subject:'0',artists:['1','2','3']}};
 assert.equal(castMood(s,players[0]),'watching');for(const p of players.slice(1))assert.equal(castMood(s,p),'writing');
 players[2].ready=true;assert.equal(castMood(s,players[2]),'done');s.paused=true;assert.equal(castMood(s,players[2]),'idle');
 for(const mood of ['seated','writing','done','confident','thinking','watching','cheer','winner','smug','facepalm','clap','sulk','shrug'])for(let t=0;t<10;t+=.1){const pose=characterPose(mood,t,3);assert.doesNotMatch(JSON.stringify(pose),/null/);assert.ok(pose.hands.every(h=>h.every(Number.isFinite)));}
 assert.deepEqual(characterPose('writing',1,2,{still:true}),characterPose('writing',9,2,{still:true}));
});

test('Local house answers follow shared beginnings, endings, capitalization and punctuation',()=>{
 assert.equal(matchAnswerStyle('my phone',['wallet','chain']),'phone');
 assert.equal(matchAnswerStyle('phone',['probably my wallet lol','probably my chain lol']),'probably my phone lol');
 assert.equal(matchAnswerStyle('my bedroom',['MY CAR!','MY HOUSE!']),'MY BEDROOM!');
 assert.equal(matchAnswerStyle('9 years old',['8 years old','10 years old']),'9 years old');
});

test('Room QR encoding matches independently generated fixed version 5-L mask 0 vectors',()=>{
 // Reference matrices independently produced with qrcode-terminal's QRCode encoder.
 const refs=[['https://www.alib.app/join?room=WORM','79afd25f893bbf11a31f19565c9ae885e1f9650f8dfbd1aae1c39d99bb7f4cd4'],['http://192.168.1.100:3000/join?room=ABCD','9164d1d95286450c0637823bdc807737a2d85df05e0b632b4565bc5757e7f16f'],['x'.repeat(106),'0bb91879dc71812dfcfa5ca3df4355cd77d133217919c523bea3e7f34a2f0894']];
 for(const [text,hash]of refs)assert.equal(createHash('sha256').update(qrMatrix(text).flat().map(Number).join('')).digest('hex'),hash);
 assert.equal(qrMatrix('x'.repeat(107)),null);assert.equal(qrSvg('x'.repeat(107)),'');assert.match(qrSvg('room'),/viewBox="0 0 45 45"/);
});


for(const count of [2,8])test(`${count}-player reveals advance automatically after exactly 10 seconds through all rounds and the finale`,()=>{
 const g=setup(count);let reveals=0;
 while(g.room.phase!=='finished'){
  assert.ok(reveals<=count*2+1);
  if(g.room.phase==='write')finishNormal(g);
  else if(g.room.phase==='questions')for(const p of g.room.players)g.act(p,'question',{text:'What would this person bring to a fight with a goose?'});
  else if(g.room.phase==='truth'){
   g.act(g.room.players.find(p=>p.id===g.room.t.subject),'truth',{text:'my house'});
   for(const p of g.game.artists(g.room))g.act(p,'drawing',{strokes});
   for(const p of g.game.eligible(g.room))g.act(p,'vote',{choices:[g.room.t.options.find(o=>o.truth).id]});
  }else if(g.room.phase==='reveal'){
   const oldId=g.room.t.id,deadline=g.room.deadline;
   assert.equal(deadline-g.room.phaseStartedAt,10000); // No extra presentation allowance on results.
   for(const p of [g.host,...g.room.players])assert.equal(g.game.snapshot(g.room,p.token).deadline,deadline);
   g.setNow(deadline-1);g.game.tick();assert.equal(g.room.phase,'reveal');
   g.setNow(deadline);g.game.tick();assert.notEqual(g.room.phase,'reveal');reveals++;
   if(g.room.phase!=='finished')assert.throws(()=>g.act(g.host,'next',{turnId:oldId}),/ended|Finish this turn/);
  }else assert.fail(g.room.phase);
 }
 assert.equal(reveals,count*2+1);assert.equal(g.room.deadline,null);
 const finalScores=g.room.players.map(p=>p.score);g.setNow(g.room.phaseStartedAt+60000);g.game.tick();assert.equal(g.room.phase,'finished');assert.deepEqual(g.room.players.map(p=>p.score),finalScores);
});

test('Pause freezes the remaining reveal countdown and resume does not add extra seconds',()=>{
 const g=setup();finishNormal(g);g.setNow(14000);g.act(g.host,'pause');assert.equal(g.room.remaining,6000);
 g.setNow(100000);g.game.tick();assert.equal(g.room.phase,'reveal');assert.equal(g.room.deadline,null);
 g.act(g.host,'pause');assert.equal(g.room.deadline,106000);g.setNow(105999);g.game.tick();assert.equal(g.room.phase,'reveal');g.setNow(106000);g.game.tick();assert.equal(g.room.phase,'write');assert.equal(g.room.turnIndex,1);
});

test('Continue early cancels the old reveal deadline; missing-truth reveals also advance',()=>{
 const g=setup();finishNormal(g);const deadline=g.room.deadline;g.setNow(15000);g.act(g.host,'next');const nextId=g.room.t.id;
 g.setNow(deadline);g.game.tick();assert.equal(g.room.phase,'write');assert.equal(g.room.t.id,nextId);
 g.setNow(g.room.deadline);g.game.tick();assert.equal(g.room.phase,'reveal');assert.ok(g.room.t.skipped);const skippedId=g.room.t.id;
 assert.equal(g.room.deadline-g.room.phaseStartedAt,10000);g.setNow(g.room.deadline);g.game.tick();assert.equal(g.room.phase,'write');assert.notEqual(g.room.t.id,skippedId);
});
