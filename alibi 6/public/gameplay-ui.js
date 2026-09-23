export const ROUND_NAMES=['','Our questions','Your questions','The drawing finale'];
export function roleState(s){
 const me=s?.me,r=me?.role;if(!r)return {available:false,label:''};
 const targeted=['accomplice','bounty','reader'].includes(r.id);
 const targets=s.players.filter(p=>s.turn?.voters?.includes(p.id)&&p.id!==me.id&&(r.id!=='reader'||p.ready));
 let available=!me.used&&s.round<3&&!s.paused&&!me.voted;
 if(r.id==='forger')available=available&&s.phase==='write'&&!me.isSubject&&!me.submitted;
 else available=available&&s.phase==='vote'&&(r.id==='accomplice'?true:['bounty','showboat'].includes(r.id)?s.turn.options.some(o=>o.owned):me.canVote);
 if(targeted&&!targets.length)available=false;
 const label=me.used?'Power used':s.round>=3?'Power expired':s.paused?'Game paused':available?'Ready to use':r.id==='forger'?'Use while writing a lie':r.id==='reader'&&s.phase==='vote'?'Wait for a locked vote':'Use before you vote';
 return {available,targeted,targets,label};
}
export function scoreLines(s,id){
 const grouped=new Map();for(const item of s.turn?.ledger?.[id]||[]){const row=grouped.get(item.reason)||{reason:item.reason,points:0,count:0};row.points+=item.points;row.count++;grouped.set(item.reason,row);}return [...grouped.values()];
}
export function revealComment(s){
 if(s.turn?.skipped)return 'New question. Clean slate.';
 const wrong=s.turn.options.filter(o=>!o.truth),most=Math.max(0,...wrong.map(o=>o.voters.length)),voters=s.turn.options.flatMap(o=>o.voters).length;
 if(most>=3)return `${most} people believed the same lie. Concerning.`;
 if(wrong.some(o=>o.owners.length&&o.voters.length))return 'Trust issues: updated.';
 if(voters)return 'Nobody bought it. Keep the receipt.';
 return 'An impressive commitment to indecision.';
}
export function phaseGuide(s){
 const subject=s.players.find(p=>p.id===s.turn?.subject)?.name||'Your friend';
 if(s.phase==='questions')return 'Write one question about your assigned friend. Everyone gets a turn.';
 if(s.phase==='write')return s.players.length===2?`${subject} writes a truth and a lie. Their opponent guesses next.`:`${subject} tells the truth. Everyone else writes a believable lie.`;
 if(s.phase==='truth')return `${subject} answers privately, then sits out. Keep it easy to draw.`;
 if(s.phase==='draw')return s.players.length===2?'You draw a guess. The computer draws the truth and two bluffs.':s.players.length===3?'One artist knows the answer. The other draws a guess. Two computer bluffs join the gallery.':'One artist knows the answer. Every other artist draws a guess.';
 if(s.phase==='vote')return s.round===3?'Find the drawing made by the artist who knew the answer.':'Find the truth. You can’t vote for your own answer.';
 return '';
}
