import {validateCharacter} from './public/characters.js';
import { randomBytes, randomInt } from 'node:crypto';
import { generateDecoys, filterDecoys } from './decoys.mjs';
import {drawLocal,localComputerBluffs} from './sketches.mjs';
import {PROMPTS,DRAW_PROMPTS} from './prompts.mjs';

export const TIMERS = Object.freeze({questions:60,write:30,truth:30,draw:90,vote:30});

const id = () => randomBytes(16).toString('hex');
const shuffle = a => { const b = [...a]; for (let i=b.length-1;i>0;i--) { const j=randomInt(i+1); [b[i],b[j]]=[b[j],b[i]]; } return b; };
const clean = (v,max=140) => { if(typeof v!=='string') throw Error('Please enter text.'); const s=v.trim().replace(/\s+/g,' '); if(!s || s.length>max) throw Error(`Use 1–${max} characters.`); return s; };
const norm = s => s.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export const ROLES = [
  {id:'detective',name:'Detective',description:'Privately cross off one wrong answer before voting.'},
  {id:'gambler',name:'Gambler',description:'Your next guess earns 1,000 if correct, or loses 250 if wrong.'},
  {id:'forger',name:'Forger',description:'Submit a second lie during one writing turn.'},
  {id:'accomplice',name:'Accomplice',description:'Pick another voter. Earn 500 if they find the truth.'},
  {id:'bounty',name:'Bounty Hunter',description:'Pick a voter. Earn 500 extra if they choose your lie.'},
  {id:'reader',name:'Mind Reader',description:'Peek at another player’s locked vote before you vote.'},
  {id:'showboat',name:'Showboat',description:'Boost your lie to earn 500 per fooled voter this turn.'},
  {id:'lucky',name:'Lucky Break',description:'Pick two answers this turn. Earn 500 if either is true.'},
];
export class Game {
 constructor({now=()=>Date.now(),onChange=()=>{},aiDecoys=null,aiSketches=null,mixSeconds=8}={}) { this.rooms=new Map(); this.now=now; this.onChange=onChange; this.aiDecoys=aiDecoys; this.aiSketches=aiSketches; this.mixSeconds=mixSeconds; }
 create() { let code; do { code=Array.from({length:4},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ'[randomInt(24)]).join(''); } while(this.rooms.has(code)); const room={code,hostToken:id(),players:[],phase:'lobby',round:0,turnIndex:0,version:0,questions:{},t:null,deadline:null,created:this.now(),updated:this.now(),paused:false,usedPrompts:[]}; this.rooms.set(code,room); return {room:code,token:room.hostToken}; }
 room(code) {const r=this.rooms.get(String(code).toUpperCase()); if(!r) throw Error('Room not found. Check the four-letter code.'); return r;}
 auth(room,token) { if(token===room.hostToken) return {host:true}; const p=room.players.find(p=>p.token===token); if(!p) throw Error('Your seat could not be verified. Join the room again.'); return {player:p}; }
 join(code,name,character) { const r=this.room(code); if(r.phase!=='lobby') throw Error('This game has started. Join the next one.'); if(r.players.length>=8) throw Error('This room is full.'); name=clean(name,20); if(r.players.some(p=>p.name.toLowerCase()===name.toLowerCase())) throw Error('That name is taken. Add a nickname.'); const p={id:id(),token:id(),name,score:0,role:null,used:false,color:r.players.length,character:validateCharacter(character,r.players.length)}; r.players.push(p); this.changed(r); return {room:r.code,token:p.token,playerId:p.id}; }
 changed(r) {r.version++;r.updated=this.now(); this.onChange(r);}
 setPhase(r,phase,seconds=TIMERS[phase]??null) {r.phase=phase;r.phaseDuration=seconds;r.deadline=seconds?this.now()+seconds*1000:null;r.remaining=null;}
 prompt(r,subject,drawing=false) {const bank=drawing?DRAW_PROMPTS:PROMPTS; let candidates=bank.map((_,i)=>i).filter(i=>drawing||!r.usedPrompts.includes(i)); if(!candidates.length)candidates=bank.map((_,i)=>i);const index=candidates[randomInt(candidates.length)];if(!drawing)r.usedPrompts.push(index);const p=r.players.find(p=>p.id===subject);return {prompt:bank[index][0].replaceAll('{name}',p.name),personalPrompt:bank[index][0].replaceAll('{name}’s','your').replaceAll('{name}', 'you').replaceAll('their','your'),decoys:shuffle(bank[index][1])};}
 start(r) {if(r.players.length<2)throw Error('At least two players are needed.'); const roles=shuffle(ROLES.filter(role=>r.players.length>2||!['forger','reader'].includes(role.id)));r.players.forEach((p,i)=>{p.score=0;p.role=roles[i];p.used=false;});r.order=shuffle(r.players.map(p=>p.id));r.round=1;r.turnIndex=0;r.questions={};r.assignments={};r.order.forEach((pid,i)=>r.assignments[pid]=r.order[(i+1)%r.order.length]);this.newTurn(r);}
 newTurn(r,replacement=false) {
 const subject=r.round===3?r.finalSubjects[r.turnIndex]:r.order[r.turnIndex];
 const authored=r.round===2&&!replacement?r.questions[subject]:null;
 const source=authored?{prompt:authored.text,decoys:authored.decoys||[]}:this.prompt(r,subject,r.round===3);
 r.t={id:id(),subject,prompt:source.prompt,personalPrompt:source.personalPrompt,decoys:source.decoys,questionAuthor:authored?.author||null,truth:null,submissions:{},drawings:{},options:[],votes:{},powers:{},hints:{},deltas:{},skipped:false};
 if(r.round===3){r.t.artist=r.players.length===2?'computer-truth':shuffle(r.players.filter(p=>p.id!==subject))[0].id;this.setPhase(r,'truth');}else this.setPhase(r,'write');
 }
 eligible(r) {if(r.round<3)return r.players.filter(p=>p.id!==r.t.subject);if(r.players.length===2)return r.players.filter(p=>p.id!==r.t.subject);return r.players.filter(p=>p.id!==r.t.subject&&p.id!==r.t.artist);}
 artists(r) {return r.players.filter(p=>p.id!==r.t.subject);}
 startComputers(r) {
 const t=r.t;t.computersPending=false;t.computerResult=null;t.computerFallback={};t.computerJobs=[];
 if(r.players.length>3)return;
 if(t.artist==='computer-truth'){
   const strokes=drawLocal(t.truth);if(strokes)t.computerFallback['computer-truth']=strokes;
   t.computerJobs.push({id:'computer-truth',answer:t.truth});
 }
 const bluffs=localComputerBluffs({truth:t.truth,seeds:t.decoys,count:2});
 for(const [i,bluff] of bluffs.entries()){const id=`computer-bluff-${i+1}`;t.computerFallback[id]=bluff.strokes;t.computerJobs.push({id,answer:bluff.answer});}
 t.computerCount=t.computerJobs.length;
 if(!this.aiSketches){Object.assign(t.drawings,t.computerFallback);return;}
 t.computersPending=true;t.computerController=new AbortController();
 const request={prompt:t.prompt.replaceAll(r.players.find(p=>p.id===t.subject).name,'the player'),jobs:t.computerJobs};
 const controller=t.computerController;
 Promise.resolve().then(()=>this.aiSketches(request,{signal:controller.signal})).then(result=>{
   if(this.rooms.get(r.code)!==r||r.t!==t||r.phase!=='draw'||!t.computersPending||t.computerController!==controller)return;
   if(r.paused){t.computerResult=result||{};return;}
   this.finishComputers(r,result||{});this.progress(r);this.changed(r);
 }).catch(()=>{
   if(this.rooms.get(r.code)!==r||r.t!==t||r.phase!=='draw'||!t.computersPending||t.computerController!==controller)return;
   if(r.paused){t.computerResult={};return;}
   this.finishComputers(r,{});this.progress(r);this.changed(r);
 });
 }
 finishComputers(r,result) {
 const t=r.t;t.computerController?.abort();t.computersPending=false;t.computerResult=null;
 for(const job of t.computerJobs||[]){
   let strokes=t.computerFallback[job.id];
   try{if(result?.[job.id])strokes=validateDrawing(result[job.id]);}catch{}
   if(strokes)t.drawings[job.id]=strokes;
 }
 if(t.artist==='computer-truth'&&!t.drawings[t.artist]){
   t.truth=null;t.drawings={};t.drawingIssue='The computer artist could not draw that answer. Try a simpler concrete answer or another question.';
   this.setPhase(r,'truth');
 }
 }
 allSubmitted(r) {return r.players.length===2?!!r.t.submissions[r.t.subject]?.length:r.players.every(p=>r.t.submissions[p.id]?.length);}
 makeOptions(r) {
 const t=r.t,options=[];
 const add=(text,owners=[],truth=false,drawing=null)=>{
   const existing=options.find(o=>text&&norm(o.text)===norm(text));
   if(existing){if(!existing.truth&&!truth)existing.owners.push(...owners);return;}
   options.push({id:id(),text,owners,truth,drawing});
 };
 let count=0;
 if(r.round<3){
   add(t.truth,[],true);
   for(const [pid,answers] of Object.entries(t.submissions))for(const answer of answers.slice(pid===t.subject?1:0))if(norm(answer)!==norm(t.truth))add(answer,[pid]);
   if(r.players.length<=3)count=Math.max(0,(r.players.length===2?4:5)-options.length);
 }
 else for(const [pid,drawing] of Object.entries(t.drawings))add('',[pid],pid===t.artist,drawing);
 const context={prompt:t.prompt,truth:t.truth,answers:Object.values(t.submissions).flat(),seeds:t.decoys,count};
 const fallback=count?generateDecoys(context):[];
 if(!this.aiDecoys||!count){for(const text of fallback)add(text,[],false,r.round===3?t.drawings[t.artist]:null);t.options=shuffle(options);t.decoySource=count?'local':'players';this.setPhase(r,'vote');return;}
 // No ballot or voting timer is exposed until generation has finished.
 t.mixing={options,context,fallback,controller:new AbortController(),result:null};
 this.setPhase(r,'mixing',this.mixSeconds);
 const request={...context,prompt:context.prompt.replaceAll(r.players.find(p=>p.id===t.subject).name,'the player')};
 const controller=t.mixing.controller;
 Promise.resolve().then(()=>this.aiDecoys(request,{signal:controller.signal})).then(result=>{
   if(this.rooms.get(r.code)!==r||r.t!==t||r.phase!=='mixing')return;
   t.mixing.result=Array.isArray(result)?result:[];
   if(!r.paused){this.finishMixing(r);this.changed(r);}
 }).catch(()=>{
   if(this.rooms.get(r.code)!==r||r.t!==t||r.phase!=='mixing')return;
   t.mixing.result=[];
   if(!r.paused){this.finishMixing(r);this.changed(r);}
 });
 }
 finishMixing(r,force=false) {
 const t=r.t,pending=t?.mixing;
 if(r.phase!=='mixing'||!pending)return;
 pending.controller.abort();
 const ai=force?[]:filterDecoys(pending.context,pending.result||[],{preserveOrder:true});
 const selected=filterDecoys(pending.context,[...ai,...pending.fallback],{preserveOrder:true});
 t.options=shuffle([...pending.options,...selected.map(text=>({id:id(),text,owners:[],truth:false,drawing:r.round===3?t.drawings[t.artist]:null}))]);
 t.decoySource=ai.length>=pending.context.count?'ai':ai.length?'mixed':'local';
 t.mixing=null;
 this.setPhase(r,'vote');
 }
 award(r,pid,points) {const p=r.players.find(p=>p.id===pid);if(p){p.score+=points;r.t.deltas[pid]=(r.t.deltas[pid]||0)+points;}}
 reveal(r) { const t=r.t; for(const voter of this.eligible(r)){const votes=t.votes[voter.id];if(!votes){if(t.powers[voter.id]?.role==='gambler')this.award(r,voter.id,-250);continue;}const correct=votes.some(oid=>t.options.find(o=>o.id===oid)?.truth);const power=t.powers[voter.id];if(correct)this.award(r,voter.id,r.round===3?1000:power?.role==='gambler'?1000:500);else if(power?.role==='gambler')this.award(r,voter.id,-250);
 for(const oid of votes){const opt=t.options.find(o=>o.id===oid);if(!opt||opt.truth)continue;for(const owner of opt.owners){this.award(r,owner,r.round===3||t.powers[owner]?.role==='showboat'?500:250);if(t.powers[owner]?.role==='bounty'&&t.powers[owner].target===voter.id)this.award(r,owner,500);}}
 if(correct&&r.round===3){for(const pid of new Set([t.subject,t.artist]))this.award(r,pid,500);}}
 for(const [pid,power] of Object.entries(t.powers))if(power.role==='accomplice'&&t.votes[power.target]?.some(oid=>t.options.find(o=>o.id===oid)?.truth))this.award(r,pid,500);
 this.setPhase(r,'reveal');
 }
 progress(r,force=false) { const t=r.t;
 if(r.phase==='mixing'&&force){this.finishMixing(r,true);return;}
 if(r.phase==='questions'&&(force||Object.keys(r.questions).length===r.players.length)){for(const p of r.players){const target=r.assignments[p.id];if(!r.questions[target]){const generated=this.prompt(r,target);r.questions[target]={text:generated.prompt,decoys:generated.decoys,author:null};}}r.turnIndex=0;this.newTurn(r);}
 else if(r.phase==='write'&&(force||this.allSubmitted(r))){if(!t.truth){t.skipped=true;t.skipReason='No true answer was submitted. No points this turn.';this.setPhase(r,'reveal');}else this.makeOptions(r);}
 else if(r.phase==='truth'&&force){t.skipped=true;t.skipReason='No true answer was submitted. No points this turn.';this.setPhase(r,'reveal');}
 else if(r.phase==='draw'&&(force||(!t.computersPending&&this.artists(r).every(p=>t.drawings[p.id])))){if(force&&t.computersPending){this.finishComputers(r,{});if(r.phase!=='draw')return;}if(!t.drawings[t.artist]){t.skipped=true;t.skipReason='The true drawing was not submitted. No points this turn.';this.setPhase(r,'reveal');}else this.makeOptions(r);}
 else if(r.phase==='vote'&&(force||this.eligible(r).every(p=>t.votes[p.id])))this.reveal(r);
 }
 next(r) {if(r.phase!=='reveal')throw Error('Finish this turn first.');r.turnIndex++;if(r.round<3&&r.turnIndex<r.order.length)this.newTurn(r);else if(r.round===1){r.round=2;r.turnIndex=0;r.t=null;this.setPhase(r,'questions');}else if(r.round===2){r.round=3;r.turnIndex=0;r.finalSubjects=[shuffle(r.order)[0]];this.newTurn(r);}else if(r.turnIndex<r.finalSubjects.length)this.newTurn(r);else this.setPhase(r,'finished');}
 power(r,p,data) {const t=r.t;const role=p.role?.id;if(r.round===3||!['write','vote'].includes(r.phase))throw Error('Powers are available in the first two rounds.');if(p.used)throw Error('You already used your power.');if(t.votes[p.id])throw Error('Use your power before you vote.');const eligible=this.eligible(r);let hint=null;
 if(role==='forger'){if(r.phase!=='write'||p.id===t.subject||t.submissions[p.id])throw Error('Use this while writing a bluff.');}
 else {if(r.phase!=='vote')throw Error('Use this when voting opens.');if(['detective','gambler','reader','lucky'].includes(role)&&!eligible.some(v=>v.id===p.id))throw Error('You are not voting this turn.');if(['bounty','showboat'].includes(role)&&!t.options.some(o=>o.owners.includes(p.id)))throw Error('You need a submitted lie this turn.');if(['accomplice','bounty','reader'].includes(role)){if(!eligible.some(v=>v.id===data.target&&v.id!==p.id))throw Error('Choose another eligible voter.');}
 if(role==='detective'){const wrong=t.options.filter(o=>!o.truth&&!o.owners.includes(p.id));if(!wrong.length)throw Error('No answer can be eliminated.');hint={eliminated:shuffle(wrong)[0].id};}
 if(role==='reader'){if(!t.votes[data.target])throw Error('That player has not locked a vote yet.');hint={peek:[...t.votes[data.target]],target:data.target};}}
 p.used=true;t.powers[p.id]={role,target:data.target};if(hint)t.hints[p.id]=hint;
 }
 action(code,token,data) {const r=this.room(code);const {host,player:p}=this.auth(r,token);const t=r.t;const hostOnly=['start','next','advance','pause','restart','kick'];if(hostOnly.includes(data.type)&&!host)throw Error('Only the TV host can do that.');if(!hostOnly.includes(data.type)&&!p)throw Error('Join on a player device to do that.');if(r.paused&&!['pause','restart'].includes(data.type))throw Error('The host has paused the game.');if(data.turnId&&data.turnId!==t?.id)throw Error('That turn has ended. Your screen will update.');
 switch(data.type){
 case 'start':if(r.phase!=='lobby')throw Error('The game has already started.');this.start(r);break;
 case 'kick':if(r.phase!=='lobby')throw Error('Players can only be removed in the lobby.');r.players=r.players.filter(p=>p.id!==data.playerId);break;
 case 'pause':if(['lobby','finished'].includes(r.phase))throw Error('There is no active game to pause.');r.paused=!r.paused;if(r.paused){r.remaining=r.deadline?Math.max(0,r.deadline-this.now()):null;r.deadline=null;}else{r.deadline=r.remaining!==null?this.now()+r.remaining:null;r.remaining=null;if(r.phase==='mixing'&&r.t.mixing?.result!==null)this.finishMixing(r);if(r.phase==='draw'&&r.t.computerResult){this.finishComputers(r,r.t.computerResult);this.progress(r);}}break;
 case 'restart':if(r.phase!=='finished')throw Error('Finish the match before returning to the lobby.');r.phase='lobby';r.round=0;r.t=null;r.deadline=null;r.paused=false;r.players.forEach(p=>{p.score=0;p.role=null;p.used=false;});break;
 case 'next':this.next(r);break;
 case 'advance':if(['lobby','reveal','finished'].includes(r.phase))throw Error('There is no timer to end.');this.progress(r,true);break;
 case 'character':if(r.phase!=='lobby')throw Error('Your character is locked until the next game.');p.character=validateCharacter(data.character,p.color);break;
 case 'question':{if(r.phase!=='questions')throw Error('Question writing has ended.');const target=r.assignments[p.id];if(r.questions[target])throw Error('Your question is already locked.');r.questions[target]={text:clean(data.text,180),author:p.id};this.progress(r);break;}
 case 'skip':if(!['write','truth'].includes(r.phase)||p.id!==t.subject)throw Error('Only the featured player can replace this prompt before answering.');if(t.truth)throw Error('Your answer is already locked.');for(const pid of Object.keys(t.powers))r.players.find(p=>p.id===pid).used=false;this.newTurn(r,true);break;
 case 'answer':{if(r.phase!=='write')throw Error('Writing has ended.');if(r.players.length===2&&p.id!==t.subject)throw Error('Wait for the featured player to write their truth and lie.');if(t.submissions[p.id])throw Error('Your answer is already locked.');const answers=[clean(data.text)];if(p.id===t.subject){if(r.players.length===2)answers.push(clean(data.lie));if(answers[1]&&norm(answers[0])===norm(answers[1]))throw Error('Your truth and lie must be different.');t.truth=answers[0];for(const [pid,existing]of Object.entries(t.submissions))if(existing.some(a=>norm(a)===norm(t.truth)))delete t.submissions[pid];}
 else {if(t.powers[p.id]?.role==='forger'){answers.push(clean(data.second));if(norm(answers[0])===norm(answers[1]))throw Error('Write two different lies.');}if(t.truth&&answers.some(a=>norm(a)===norm(t.truth)))throw Error('That answer is already taken. Try a different bluff.');}
 t.submissions[p.id]=answers;this.progress(r);break;}
 case 'truth':{
 if(r.phase!=='truth'||p.id!==t.subject)throw Error('It is not your turn to answer.');
 const answer=clean(data.text,80);
 if(r.players.length===2&&!this.aiSketches&&!drawLocal(answer))throw Error('The local computer artist cannot sketch that answer yet. Try a concrete object, animal, or place, choose another question, or enable AI in .env.');
 t.truth=answer;t.drawingIssue=null;this.setPhase(r,'draw');this.startComputers(r);break;
 }
 case 'drawing':if(r.phase!=='draw'||!this.artists(r).some(a=>a.id===p.id))throw Error('You are not drawing this turn.');if(t.drawings[p.id])throw Error('Your drawing is already locked.');t.drawings[p.id]=validateDrawing(data.strokes);this.progress(r);break;
 case 'power':this.power(r,p,data);break;
 case 'vote':{if(r.phase!=='vote'||!this.eligible(r).some(v=>v.id===p.id))throw Error('You are not voting this turn.');if(t.votes[p.id])throw Error('Your vote is already locked.');const votes=data.choices;if(!Array.isArray(votes)||!votes.length||votes.length>(t.powers[p.id]?.role==='lucky'?2:1)||new Set(votes).size!==votes.length)throw Error('Choose a valid answer.');for(const oid of votes){const opt=t.options.find(o=>o.id===oid);if(!opt||opt.owners.includes(p.id)||t.hints[p.id]?.eliminated===oid)throw Error('You cannot vote for that answer.');}t.votes[p.id]=votes;this.progress(r);break;}
 default:throw Error('Unknown action.');}
 this.changed(r);return this.snapshot(r,token);
 }
 tick() {for(const r of this.rooms.values()){if(!r.paused&&r.deadline&&r.deadline<=this.now()){this.progress(r,true);this.changed(r);}if(this.now()-r.updated>24*60*60*1000)this.rooms.delete(r.code);}}
 snapshot(r,token) {const {host,player:p}=this.auth(r,token);const t=r.t;const revealed=['reveal','finished'].includes(r.phase);const publicPlayer=p=>({id:p.id,name:p.name,score:p.score,color:p.color,character:p.character,...(r.phase==='finished'?{role:p.role}:{}),ready:r.phase==='questions'?!!r.questions[r.assignments[p.id]]:r.phase==='write'?!!t?.submissions[p.id]:r.phase==='draw'?!!t?.drawings[p.id]:r.phase==='vote'?!!t?.votes[p.id]:false});
 const state={code:r.code,version:r.version,host:!!host,phase:r.phase,round:r.round,turnIndex:r.turnIndex,turnCount:r.round===3?r.finalSubjects?.length:r.players.length,deadline:r.deadline,phaseDuration:r.phaseDuration,remaining:r.remaining,serverNow:this.now(),paused:r.paused,players:r.players.map(publicPlayer),...(host?{aiEnabled:!!this.aiDecoys}: {})};
 if(t)state.turn={id:t.id,subject:t.subject,prompt:t.prompt,skipped:t.skipped,skipReason:t.skipReason,computerCount:t.computerCount||0,computersReady:!t.computersPending,voters:this.eligible(r).map(p=>p.id),writers:r.players.length===2?[t.subject]:r.players.map(p=>p.id),artists:r.phase==='draw'?this.artists(r).map(p=>p.id):undefined,options:['vote','reveal','finished'].includes(r.phase)?t.options.map(o=>({id:o.id,text:o.text,drawing:o.drawing,owned:!!p&&o.owners.includes(p.id),...(revealed?{truth:o.truth,owners:o.owners,voters:Object.entries(t.votes).filter(([,ids])=>ids.includes(o.id)).map(([pid])=>pid)}:{})})):[],...(revealed?{truth:t.truth,artist:t.artist,deltas:t.deltas,questionAuthor:t.questionAuthor,...(host?{decoySource:t.decoySource}: {})}:{})};
 if(p){state.me={id:p.id,role:p.role,used:p.used,questionTarget:r.phase==='questions'?r.assignments[p.id]:null,questionSubmitted:r.phase==='questions'?!!r.questions[r.assignments[p.id]]:false,submitted:t?!!t.submissions[p.id]:false,drawingSubmitted:!!t?.drawings[p.id],voted:!!t?.votes[p.id],votes:t?.votes[p.id]||[],power:t?.powers[p.id],hint:t?.hints[p.id],isSubject:p.id===t?.subject,personalPrompt:r.phase==='truth'&&p.id===t?.subject?t.personalPrompt:undefined,drawingIssue:p.id===t?.subject?t.drawingIssue:undefined,canVote:r.phase==='vote'&&this.eligible(r).some(v=>v.id===p.id),canDraw:r.phase==='draw'&&this.artists(r).some(v=>v.id===p.id),informed:r.phase==='draw'&&t?.artist===p.id};if(t?.truth&&(p.id===t.subject||(r.phase==='draw'&&p.id===t.artist)))state.me.truth=t.truth;}
 return state;
 }
}
export function validateDrawing(strokes) {if(!Array.isArray(strokes)||!strokes.length||strokes.length>180)throw Error('Draw something before submitting.');let total=0;return strokes.map(s=>{if(!s||!['#202031','#7655ed','#ee6654','#49a797','#ffffff'].includes(s.color)||!Number.isFinite(s.size)||s.size<1||s.size>25||!Array.isArray(s.points)||!s.points.length)throw Error('Invalid drawing.');total+=s.points.length;if(total>12000)throw Error('Drawing is too detailed. Undo a few strokes.');return {color:s.color,size:s.size,points:s.points.map(p=>{if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1))throw Error('Invalid drawing coordinates.');return p;})};});}
