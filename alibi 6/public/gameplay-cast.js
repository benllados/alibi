import {characterRigSvg,paintCharacterRig} from './playground.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function castMarkup(players,{couch=false,solo=false}={}){
 return `<div class="game-cast ${couch?'on-couch':''} ${solo?'solo-cast':''}" data-live-cast style="--cast-count:${players.length}">${couch?'<div class="cast-couch" aria-hidden="true"><i></i><i></i><i></i></div>':''}${players.map((p,i)=>`<div class="cast-seat" data-cast-player="${p.id}" style="--seat:${i}"><div class="cast-figure">${characterRigSvg(p.character)}</div><span class="cast-name">${escape(p.name)}</span><small class="cast-status" data-cast-status="${p.id}"></small></div>`).join('')}</div>`;
}
export function castMood(state,p){
 if(state.paused)return 'idle';
 if(state.phase==='finished')return p.score===Math.max(...state.players.map(x=>x.score))?'winner':p.color%2?'clap':'sulk';
 if(state.phase==='lobby')return 'seated';
 if(state.phase==='reveal')return state.turn?.skipped?'shrug':({correct:'cheer',fooled:'facepalm',bluffer:'smug',missed:'shrug'}[state.turn?.reactions?.[p.id]]||'shrug');
 const active=state.phase==='questions'||state.phase==='write'&&state.turn.writers.includes(p.id)||state.phase==='draw'&&state.turn.artists?.includes(p.id)||state.phase==='truth'&&state.turn.subject===p.id;
 if(active)return p.ready?'done':'writing';
 if(state.phase==='vote'&&state.turn.voters.includes(p.id))return p.ready?'confident':'thinking';
 return 'watching';
}
export function characterPose(mood,time,index=0,{still=false,entry=10,peer=0,customize=10}={}){
 const t=still?0:time,life=Math.sin(t*(2.1+index%3*.3)+index),beat=Math.sin(t*9+index);
 const p={x:110,y:208,s:1,hip:0,crouch:Math.max(0,life)*1.5,bodyX:1,bodyY:1+life*.007,lean:life*1.4,head:life*2,headY:1,turn:0,look:[0,0],blink:!still&&(t+index*.67)%4.2<.13?.08:1,expression:'smile',hands:[[67,161],[154,160]],grips:['open','open'],wrists:[-20,20],feet:[[83,208],[140,208]],hatScale:1,hatAngle:life*2,hatLift:0,hatHidden:false,magic:0,wand:0,wandAngle:0,glassesAngle:0,glassesDrop:0,cape:life*9,flower:life*4};
 if(mood==='seated'){p.seated=true;p.feet=[[65,223],[153,223]];p.crouch=8;p.hands=[[80,153],[139,152]];p.turn=index%2?.25:-.25;p.look=[index%2?2:-2,-2];if((t+index*1.3)%9<1.2){p.hands[1]=[170,88];p.wrists[1]=beat*20;}}
 if(mood==='writing'){p.expression='focused';p.head=7+life*2;p.look=[3,5];p.lean=4;p.hands=[[70,162],[113+beat*13,150+life*5]];p.grips=['press','grip'];p.wrists[1]=15+beat*7;if((t+index)%8>6.5){p.hands[1]=[146,91];p.expression='confused';p.head=-7;p.look=[3,-3];}}
 if(mood==='done'||mood==='confident'){p.expression='guilty';p.hands=[[132,140],[87,150]];p.grips=['fist','fist'];p.lean=-4;p.head=-5;p.turn=index%2?.3:-.3;p.look=[index%2?3:-3,0];}
 if(mood==='thinking'){p.expression='skeptical';p.hands[0]=[100,109];p.grips[0]='point';p.head=life*5;p.look=[life*4,-2];}
 if(mood==='watching'){p.turn=index%2?.35:-.35;p.look=[index%2?3:-3,-3];p.expression='skeptical';}
 if(mood==='cheer'||mood==='winner'){p.expression='laugh';p.hands=[[48,80+beat*8],[169,76-beat*8]];p.wrists=[beat*12,-beat*12];p.crouch=-Math.max(0,Math.sin(t*6))*13;p.bodyY=1+Math.abs(beat)*.035;p.hatLift=Math.max(0,Math.sin(t*6-.3))*9;p.cape=beat*18;}
 if(mood==='smug'){p.expression='proud';p.hands=[[75,129],[149,126]];p.grips=['point','point'];p.lean=-7;p.head=-9;p.turn=peer||.3;p.look=[peer*5||4,-1];p.hatAngle=life*4;}
 if(mood==='facepalm'){p.expression='embarrassed';p.hands[0]=[90,71];p.grips[0]='press';p.head=life*3+6;p.lean=4;p.turn=peer;p.look=[peer*5,2];p.glassesDrop=4;}
 if(mood==='clap'){p.expression='smile';p.hands=[[104-beat*10,135],[116+beat*10,135]];p.grips=['clap','clap'];p.wrists=[60,-60];}
 if(mood==='sulk'){p.expression='flat';p.hands=[[132,145],[85,142]];p.head=9;p.look=[-3,4];p.lean=-5;}
 if(mood==='shrug'){p.expression='confused';p.hands=[[45,135+life*5],[171,130-life*5]];p.wrists=[-80,80];p.head=life*6;}
 if(!still&&entry<.75){const f=1-entry/.75;p.x-=100*f*f;p.turn=.45;p.feet=[[83+beat*16,208-Math.max(0,beat)*12],[140-beat*16,208-Math.max(0,-beat)*12]];p.lean=-8*f;}
 if(!still&&customize<.7){const f=1-customize/.7;p.hatLift+=70*f*f;p.bodyX+=Math.sin(f*Math.PI)*.13;p.bodyY-=Math.sin(f*Math.PI)*.09;p.expression='surprise';}
 return p;
}
export function mountGameCast(root,initial,{env=globalThis}={}){
 const seats=[...root.querySelectorAll('[data-cast-player]')];if(!seats.length)return {update(){},destroy(){}};
 let state=initial,clock=0,last=0,request=0,disposed=false;const motion=env.matchMedia('(prefers-reduced-motion: reduce)'),doc=root.ownerDocument||env.document;
 const actors=seats.map((el,i)=>({el,svg:el.querySelector('.live-character'),id:el.dataset.castPlayer,index:i,born:initial.phase==='lobby'?0:-10,changed:10,config:JSON.stringify(initial.players.find(p=>p.id===el.dataset.castPlayer)?.character)}));
 function draw(){for(const a of actors){const p=state.players.find(p=>p.id===a.id);if(!p)continue;const mood=castMood(state,p),hit=state.turn?.options?.find(o=>o.voters?.includes(p.id)&&!o.truth),owner=state.players.findIndex(x=>x.id===hit?.owners?.[0]);const peer=owner<0?0:Math.sign(owner-a.index)*.4;
  paintCharacterRig(a.svg,characterPose(mood,clock,a.index,{still:motion.matches||state.paused,entry:clock-a.born,customize:a.changed,peer}),{writing:mood==='writing'});a.el.dataset.mood=mood;
  const label=a.el.querySelector('.cast-status');label.textContent=p.connected===false?'reconnecting':state.phase==='lobby'?'here':p.ready?'ready':mood==='writing'?'writing…':mood==='thinking'?'choosing…':'';
 }}
 function tick(now){request=0;if(disposed||doc.hidden||motion.matches||state.paused)return;const dt=last?Math.min(.06,(now-last)/1000):0;last=now;clock+=dt;actors.forEach(a=>a.changed+=dt);draw();request=env.requestAnimationFrame(tick);}
 function sync(){if(request)env.cancelAnimationFrame(request);request=0;last=0;draw();if(!disposed&&!doc.hidden&&!motion.matches&&!state.paused)request=env.requestAnimationFrame(tick);}
 doc.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);sync();
 return {update(next){state=next;for(const a of actors){const p=state.players.find(x=>x.id===a.id);if(!p)continue;const config=JSON.stringify(p.character);if(config!==a.config){a.el.querySelector('.cast-figure').innerHTML=characterRigSvg(p.character);a.svg=a.el.querySelector('.live-character');a.config=config;a.changed=0;}}sync();},destroy(){disposed=true;if(request)env.cancelAnimationFrame(request);doc.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);}};
}
