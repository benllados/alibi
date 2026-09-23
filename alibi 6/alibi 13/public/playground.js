import {characterParts} from './characters.js';
import {CAST,sceneFrame,point} from './playground-scene.js';
const ink='#292720',paper='#f7edcf';
const parts=CAST.map(({name,...config})=>characterParts(config));
const round=n=>Math.round(n*1000)/1000;
const attr=(node,name,value)=>{const v=String(value);if(node.getAttribute(name)!==v)node.setAttribute(name,v);};
const attrs=(n,values)=>{for(const [key,value] of Object.entries(values))attr(n,key,value);};
const bodyTransform=p=>`translate(${p.hip} ${p.crouch}) translate(110 177) rotate(${round(p.lean)}) scale(${round(p.bodyX)} ${round(p.bodyY)}) translate(-110 -177)`;
const rootTransform=p=>`translate(${round(p.x)} ${round(p.y)}) scale(${round(p.s)}) translate(-110 -208)`;
const headTransform=p=>`translate(${round(p.turn*9)} 0) translate(108 93) rotate(${round(p.head)}) scale(${round(1-Math.abs(p.turn)*.12)} ${p.headY}) translate(-108 -93)`;
const transform=p=>`translate(${round(p.x)} ${round(p.y)}) rotate(${round(p.angle||0)}) scale(${round(p.scale/Math.sqrt(p.stretch||1))} ${round(p.scale*(p.stretch||1))})`;
const MAGIC_HAT='<path d="M77 37L72 -15L137 -20L144 35Z" fill="#292720"/><path d="M77 23L142 20L144 35L78 39Z" fill="#d7573d"/><path d="M63 38Q108 47 157 35L161 45Q105 60 59 48Z" fill="#292720"/><path d="M82 -8L85 14" stroke="#f7edcf" opacity=".35"/>';
const mouths={smile:'M95 95Q109 110 126 94',surprise:'M106 94C93 94 94 114 108 115C124 116 121 94 106 94Z',focused:'M95 102L121 99',skeptical:'M96 104Q112 98 125 100',flat:'M96 103L123 103',laugh:'M92 94Q109 104 129 92Q123 121 111 121Q96 119 92 94Z',proud:'M92 93Q107 113 129 88',guilty:'M95 100Q114 111 128 93M118 100L123 102',panic:'M94 105Q93 86 112 89Q130 88 126 109Q112 101 94 105Z',relieved:'M96 99Q112 117 128 96',confused:'M97 102Q105 96 113 103Q118 106 125 102',dizzy:'M96 105Q106 99 111 106Q116 99 128 105',worried:'M96 109Q110 95 128 108',strained:'M94 100L126 96L125 108L96 112Z',pleading:'M94 98Q111 113 130 95',embarrassed:'M98 102L126 98'};
const palm={open:'M-5 6L-8 0Q-12 -7-8 -7L-4 -3L-5 -12Q-4 -16-1 -13L1 -5L3 -15Q6 -17 7 -12L6 -3L11 -9Q15 -10 13 -5L8 5Q3 11-5 6Z',fist:'M-6 6L-9 -2Q-10 -9-4 -9L7 -9Q12 -8 10 -1L6 7Z',grip:'M-6 6Q-13 0-8 -7Q-4 -10-1 -5L-3 0L4 -2Q9 -9 12 -5Q15 0 6 7Z',point:'M-5 6L-8 -4Q-9 -10-4 -8L-1 -4L-1 -19Q2 -24 5 -19L5 -4Q12 -6 11 0L7 7Z',clap:'M-6 8L-8 -11Q-6 -16-3 -11L-1 -15Q2 -18 4 -12L6 -12Q9 -11 9 -7L8 5Z',press:'M-8 4L-11 -2Q-12 -6-7 -5L-2 -3L7 -6Q13 -7 13 -3L8 6Z'};
function joint(a,b,bend,length){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.01,Math.hypot(dx,dy)),l=Math.max(length,d*.53),h=Math.sqrt(Math.max(0,l*l-d*d/4));return [(a[0]+b[0])/2-dy/d*h*bend,(a[1]+b[1])/2+dx/d*h*bend];}
function limb(p,side){const a=[side?137:84,135],b=p.hands[side],e=joint(a,b,side?-1:1,31);return `M${a}L${e.map(round)}L${b.map(round)}`;}
function foot(p,side){const q=point(p,side?128:94,177),hip=[(q.x-p.x)/p.s+110,(q.y-p.y)/p.s+208],end=p.feet[side],knee=joint(hip,end,side?-1:1,23);const toe=end[0]+(p.turn>.4?12:p.turn<-.4?-12:side?14:-14);return `M${hip.map(round)}L${knee.map(round)}L${end.map(round)}L${round(toe)} ${round(end[1])}`;}
function capePath(p){const swing=p.cape;return `M86 124Q${69+swing*.25} 151 ${48+swing} 187Q${80+swing*.9} ${174+Math.abs(swing)*.2} 107 177Q${141+swing*.8} ${182+Math.abs(swing)*.1} ${170+swing} 185Q${153+swing*.2} 147 136 125Z`;}
function actorMarkup(i){const a=parts[i],outfit=i===3?a.outfit.replace(/^<path[^>]+\/>/,''):a.outfit,hat=i===2?`<g data-part="flower">${a.hats[a.a.hat]}</g>`:a.hats[a.a.hat];return `<g data-actor="${i}" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path data-part="leg0" stroke-width="6"/><path data-part="leg1" stroke-width="6"/><g data-part="body">${i===3?'<path data-part="cape" fill="#d7573d"/>':''}${outfit}<path data-part="arm0" stroke-width="4.8"/><path data-part="arm1" stroke-width="4.8"/><g data-part="head"><path d="${a.heads[a.a.head]}" fill="${a.paper}"/><g data-part="face"><g data-part="eyes" fill="${ink}" stroke="none"><ellipse data-part="eye0" cx="87" cy="73" rx="4" ry="6"/><ellipse data-part="eye1" cx="131" cy="73" rx="4" ry="6"/></g><path data-part="brows" stroke-width="2.6"/><path data-part="mouth"/><path data-part="nose" stroke-width="2"/><g data-part="cheeks" opacity="0" fill="#d7573d" stroke="none"><ellipse cx="72" cy="91" rx="9" ry="4"/><ellipse cx="147" cy="91" rx="9" ry="4"/></g><g data-part="glasses">${a.glasses[a.a.glasses]}</g>${a.hair[a.a.hair]}</g><g data-part="hat">${hat}</g><g data-part="magic" opacity="0">${MAGIC_HAT}</g></g><g data-part="wand" opacity="0"><path d="M0 0L-6 -60" stroke-width="7"/><path d="M-5 -47L-6 -60" stroke="#fffaf0" stroke-width="5"/></g></g></g>`;}
function handsMarkup(i){return `<g data-hands="${i}" stroke="${ink}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="${paper}"><path data-palm="0"/><path data-palm="1"/></g>`;}
function actorValues(p,i){const heavy=['focused','strained'],raised=['surprise','panic','pleading','worried'];return {
 root:{transform:rootTransform(p)},body:{transform:bodyTransform(p)},leg0:{d:foot(p,0)},leg1:{d:foot(p,1)},arm0:{d:limb(p,0)},arm1:{d:limb(p,1)},head:{transform:headTransform(p)},face:{transform:`translate(${round(p.turn*8)} 0)`},
 eyes:{transform:`translate(${p.look[0]} ${round(73*(1-p.blink)+p.look[1])}) scale(1 ${p.blink})`},eye0:{opacity:p.turn>.45?.65:1},eye1:{opacity:p.turn<-.45?.65:1},
 brows:{d:p.expression==='skeptical'?'M76 57L96 63M122 54Q132 48 143 54':heavy.includes(p.expression)?'M76 55L94 63M121 62L142 55':raised.includes(p.expression)?'M77 54Q86 46 97 53M121 52Q132 46 143 53':p.expression==='flat'?'M76 62L98 62M121 62L145 62':'M77 56Q87 53 95 56M123 56Q132 53 141 56'},
 mouth:{d:mouths[p.expression]||mouths.smile,fill:['laugh','surprise','panic'].includes(p.expression)?ink:p.expression==='strained'?'#fffaf0':'none'},
 nose:{d:p.turn>.4?'M114 78L123 83L115 85':p.turn<-.4?'M102 78L94 83L102 85':'M108 81L106 86L112 86',opacity:Math.max(.25,Math.abs(p.turn))},cheeks:{opacity:['embarrassed','guilty','strained'].includes(p.expression)?.32:0},
 glasses:{transform:`translate(0 ${p.glassesDrop}) rotate(${round(p.glassesAngle)} 110 73)`},
 hat:{transform:`translate(110 ${45-p.hatLift}) rotate(${round(p.hatAngle)}) scale(${round(p.hatScale)}) translate(-110 -45)`,opacity:p.hatHidden?0:1},
 magic:{transform:`translate(110 45) scale(1 ${round(p.magic)}) translate(-110 -45)`,opacity:Math.min(1,p.magic)},
 wand:{transform:`translate(${p.hands[0].map(round)}) rotate(${round(p.wandAngle)})`,opacity:p.wand},
 ...(i===3?{cape:{d:capePath(p)}}:{}),...(i===2?{flower:{transform:`rotate(${round(p.flower)} 116 40)`}}:{}),
 };}
const propArt={
 ball:'<ellipse rx="27" ry="17" fill="#a5795a" transform="rotate(-15)"/><path d="M-9 -3L11 -7M-5 -8L-3 2M2 -10L4 0M9 -11L11 -2" stroke="#fff6df" stroke-width="2.5"/><path d="M-18 -11Q-11 0-15 13M17 -14Q12 -1 21 9" stroke="#fff6df"/>',
 hat:`<g transform="translate(-108 -27)">${parts[1].hats.cowboy}</g>`,
 frog:`<path data-frog-legs=""/><g transform="translate(-110 -27)">${parts[0].hats.frog}<g fill="#fffaf0" stroke="none"><circle cx="78" cy="13" r="8"/><circle cx="137" cy="13" r="8"/></g><g data-frog-eyes="" fill="#292720" stroke="none"><circle cx="80" cy="13" r="4"/><circle cx="139" cy="13" r="4"/></g><path d="M97 37Q108 46 121 36"/></g>`,
 frogFeet:'<path data-frog-legs="" stroke-width="4"/>',
 hatBlink:'<path d="M-36 -13L-28 -13M23 -13L31 -13" stroke="#849875" stroke-width="12"/>',
 plane:'<path d="M-36 -22L41 0L-33 20L-18 1Z" fill="#fffdf2"/><path d="M-36 -22L-18 1L41 0M-18 1L-10 13L-33 20" fill="none" stroke="#4d7c9d" stroke-width="2"/>',
 paper:'<path data-paper-shape="" fill="#fffdf2"/><path data-paper-flap="" fill="#dce5df" stroke-width="1.5"/><path data-paper-fold="" stroke="#4d7c9d" stroke-dasharray="3 4" stroke-width="1.2"/>',
 receipt:'<path d="M-13 -29L14 -31L12 22L7 18L2 23L-3 19L-9 25L-15 20Z" fill="#fffaf0"/><path d="M-8 -20L9 -21M-9 -13L7 -14M-8 -6L6 -7M-9 1L5 0M-8 9L7 8" stroke="#4d7c9d" stroke-width="1.4"/><path data-receipt-sock="" fill="#e5b747" opacity="0" d="M-14 -28L10 -29L10 -5L23 0Q30 12 15 16L-13 15Z"/>',
 moustache:`<g transform="translate(-110 -91)">${parts[1].hair.stache}</g>`,
 pencil:'<path d="M-142 -9L118 -9L146 0L118 9L-142 9Z" fill="#e5b747"/><path d="M-142 -9L-121 -9L-121 9L-142 9Z" fill="#d7573d"/><path d="M-120 -9L-120 9M-110 -9L-110 9" stroke="#8f8b7d" stroke-width="3"/><path d="M118 -9L146 0L118 9Z" fill="#ead5ab"/><path d="M138 -3L146 0L138 3Z" fill="#292720"/><path d="M-106 -3L114 -3" stroke="#fff1be" stroke-width="2"/>',
};
const legPath=p=>{const e=(p.legs||0)*14;return `M-27 8L${-37-e} ${20+e}L-17 23M27 8L${37+e} ${20+e}L19 24M-20 22L-17 28M22 23L18 29`;};
function paperPaths(fold=0){const stages=[[-32,-21,32,-21,32,21,-32,21],[-32,-21,32,21,-32,21,-32,21],[-32,-21,32,1,-32,21,-16,1],[-36,-22,41,0,-33,20,-18,1],[-36,-22,41,0,-33,20,-18,1]];const n=Math.min(3,Math.floor(fold)),r=fold-n,q=stages[n].map((a,i)=>a+(stages[n+1][i]-a)*r);return {shape:`M${q.slice(0,2)}L${q.slice(2,4)}L${q.slice(4,6)}L${q.slice(6,8)}Z`,flap:`M${q.slice(0,2)}L${q.slice(6,8)}L${q.slice(2,4)}Z`,crease:`M${q.slice(0,2)}L${q.slice(4,6)}`};}
function propsMarkup(back=false){return (back?['plane']:Object.keys(propArt)).map(key=>`<g data-prop="${key}" opacity="0" fill="none" stroke="${ink}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${propArt[key]}</g>`).join('');}
function trailMarkup(){return `<g data-trail="">${Array.from({length:11},()=>'<circle r="1.25" fill="#4d7c9d" opacity="0"/>').join('')}</g>`;}
export function playgroundMarkup(){return '<div class="playground-space" aria-hidden="true"></div><button class="playground-toggle" type="button" aria-label="Pause character animation" aria-pressed="false"><span aria-hidden="true">Ⅱ</span> pause the nonsense</button>';}
function svgMarkup(back=false){return `<svg class="playground-layer ${back?'playground-back':'playground-front'}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" preserveAspectRatio="none">${back?'':`<path data-floor="" fill="none" stroke="#81765f" stroke-width="1" opacity=".2"/><g data-shadows="">${CAST.map(()=>'<ellipse rx="39" ry="4.5" fill="#514b36" opacity=".12"/>').join('')}</g>${CAST.map((_,i)=>actorMarkup(i)).join('')}`}${trailMarkup()}${propsMarkup(back)}${back?'':`${CAST.map((_,i)=>handsMarkup(i)).join('')}<g data-effects="">${Array.from({length:3},()=>'<path fill="none" stroke-width="2" stroke-linecap="round" opacity="0" d="M0 -12L0 -24M10 -7L21 -15M12 5L24 10M3 12L6 24M-10 7L-21 15M-11 -5L-23 -10"/>').join('')}</g><g data-captions="">${Array.from({length:2},()=>`<text text-anchor="middle" fill="${ink}" opacity="0" font-family="'Smile Moon', cursive" font-size="22"/>`).join('')}</g>`}</svg>`;}
function refs(svg,back){return {svg,actors:back?[]:[...svg.querySelectorAll('[data-actor]')].map(root=>({root,...Object.fromEntries([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]))})),hands:[...svg.querySelectorAll('[data-hands]')].map(g=>[...g.querySelectorAll('[data-palm]')]),props:Object.fromEntries([...svg.querySelectorAll('[data-prop]')].map(n=>[n.dataset.prop,n])),trail:[...svg.querySelectorAll('[data-trail] circle')],shadows:[...svg.querySelectorAll('[data-shadows] ellipse')],floor:svg.querySelector('[data-floor]'),captions:[...svg.querySelectorAll('[data-captions] text')],effects:[...svg.querySelectorAll('[data-effects] path')]};}
function handValues(p,side){const q=point(p,...p.hands[side]);return {d:palm[p.grips[side]]||palm.open,transform:`translate(${round(q.x)} ${round(q.y)}) scale(${round(p.s)}) rotate(${round(p.lean+p.wrists[side])})`};}
function paint(R,f,L,back){attr(R.svg,'viewBox',`0 0 ${round(L.width)} ${round(L.height)}`);
 if(!back){const floor=L.stage.y+L.stage.height;attr(R.floor,'d',`M${L.stage.x} ${floor}Q${L.width*.5} ${floor-2} ${L.stage.x+L.stage.width} ${floor+1}`);
  f.actors.forEach((p,i)=>{const values=actorValues(p,i);for(const [key,v] of Object.entries(values))attrs(R.actors[i][key],v);for(let side=0;side<2;side++)attrs(R.hands[i][side],handValues(p,side));const height=Math.abs(floor-p.y),size=Math.max(.25,1-height/300);attrs(R.shadows[i],{transform:`translate(${round(p.x)} ${floor}) scale(${round(p.s*size)} ${size})`,opacity:.12*size});});
  R.captions.forEach((n,i)=>{const c=f.captions[i];attr(n,'opacity',c?.opacity||0);if(c){attrs(n,{transform:`translate(${round(c.x)} ${round(c.y)}) rotate(${c.angle})`,'font-size':L.mobile?14:23});n.textContent=c.text;}});
  R.effects.forEach((n,i)=>{const e=f.effects[i];attr(n,'opacity',e?.opacity||0);if(e)attrs(n,{transform:`translate(${e.x} ${e.y}) scale(${e.r/24}) rotate(${e.angle})`,stroke:e.color});});
 }
 for(const [key,n] of Object.entries(R.props)){const p=f.props[key],show=!!p&&(key!=='plane'||back===f.backPlane);attr(n,'opacity',show?p.opacity??1:0);if(!show)continue;attr(n,'transform',transform(p));
  if(key==='frog'||key==='frogFeet')attr(n.querySelector('[data-frog-legs]'),'d',legPath(p));
  if(key==='frog')attr(n.querySelector('[data-frog-eyes]'),'transform',`translate(0 ${13*(1-p.blink)}) scale(1 ${p.blink})`);
  if(key==='paper'){const v=paperPaths(p.fold);attr(n.querySelector('[data-paper-shape]'),'d',v.shape);attr(n.querySelector('[data-paper-flap]'),'d',v.flap);attr(n.querySelector('[data-paper-fold]'),'d',v.crease);}
  if(key==='receipt')attr(n.querySelector('[data-receipt-sock]'),'opacity',p.variant?1:0);
 }
 R.trail.forEach((n,i)=>{const p=f.trail[i];attr(n,'opacity',p&&back===f.backPlane?p.opacity:0);if(p)attrs(n,{cx:p.x,cy:p.y});});
}

// Review frames use these same paths and transforms. This validates artwork and
// choreography; browser layout is a separate check.
function applyMarkup(markup,token,values){return markup.replace(token,token+' '+Object.entries(values).map(([k,v])=>`${k}="${v}"`).join(' '));}
export function renderSceneSvg(L,f,{background=''}={}){
 let actors='',hands='';for(let i=0;i<4;i++){const p=f.actors[i],values=actorValues(p,i);let m=actorMarkup(i);for(const [key,v] of Object.entries(values)){const token=key==='root'?`data-actor="${i}"`:`data-part="${key}"`;m=m.replace(new RegExp(`(${token}) opacity="[^"]*"`),'$1');m=applyMarkup(m,token,v);}actors+=m;let h=handsMarkup(i);for(let side=0;side<2;side++)h=applyMarkup(h,`data-palm="${side}"`,handValues(p,side));hands+=h;}
 const objects=Object.entries(f.props).map(([key,p])=>{let m=propArt[key]||'';if(key==='frog'||key==='frogFeet')m=applyMarkup(m,'data-frog-legs=""',{d:legPath(p)});if(key==='frog')m=applyMarkup(m,'data-frog-eyes=""',{transform:`translate(0 ${13*(1-p.blink)}) scale(1 ${p.blink})`});if(key==='paper'){const v=paperPaths(p.fold);m=applyMarkup(m,'data-paper-shape=""',{d:v.shape});m=applyMarkup(m,'data-paper-flap=""',{d:v.flap});m=applyMarkup(m,'data-paper-fold=""',{d:v.crease});}if(key==='receipt'&&p.variant)m=m.replace('opacity="0"','opacity="1"');return `<g transform="${transform(p)}" opacity="${p.opacity??1}" fill="none" stroke="${ink}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${m}</g>`;}).join('');
 const trails=f.trail.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="1.3" fill="#4d7c9d" opacity="${p.opacity}"/>`).join('');
 const effects=f.effects.map(e=>`<path d="M0 -12L0 -24M10 -7L21 -15M12 5L24 10M3 12L6 24M-10 7L-21 15M-11 -5L-23 -10" fill="none" stroke="${e.color}" stroke-width="2" opacity="${e.opacity}" transform="translate(${e.x} ${e.y}) scale(${e.r/24}) rotate(${e.angle})"/>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}">${background}<path d="M${L.stage.x} ${L.stage.y+L.stage.height}H${L.stage.x+L.stage.width}" stroke="#81765f" opacity=".3"/>${actors}${trails}${objects}${hands}${effects}</svg>`;
}
export function mountPlayground(home,{quiet=false,env=globalThis}={}){
 const doc=home.ownerDocument||env.document,stage=home.querySelector('.playground-space'),toggle=home.querySelector('.playground-toggle');
 if(!stage||!toggle)return {destroy(){},setQuiet(){}};
 home.insertAdjacentHTML('afterbegin',svgMarkup(true)+svgMarkup(false));
 const front=refs(home.querySelector('.playground-front'),false),back=refs(home.querySelector('.playground-back'),true);
 const star=home.querySelector('.home-star'),pencil=home.querySelector('.home-pencil');
 const motion=env.matchMedia('(prefers-reduced-motion: reduce)');
 let disposed=false,paused=false,clock=0,last=0,request=0,L=null,quietTime=0;
 try{paused=env.localStorage.getItem('alibi-playground-paused')==='true';}catch{}
 const measure=()=>{
  if(disposed)return;
  const root=home.getBoundingClientRect(),rect=selector=>{const r=home.querySelector(selector).getBoundingClientRect();return {x:r.left-root.left,y:r.top-root.top,width:r.width,height:r.height};};
  const sr=rect('.home-star'),pr=rect('.home-pencil');
  L={width:root.width,height:root.height,mobile:root.width<=680,stage:rect('.playground-space'),logo:rect('.home-logo'),sheet:rect('.join-sheet'),star:{x:sr.x+sr.width/2,y:sr.y+sr.height/2},pencil:{x:pr.x+pr.width/2,y:pr.y+pr.height/2}};
  draw();
 };
 const draw=()=>{
  if(!L||disposed)return;
  const f=sceneFrame(L,clock,{quiet:quiet||motion.matches,still:motion.matches,life:quiet?quietTime:clock});
  paint(front,f,L,false);paint(back,f,L,true);
  star?.style.setProperty('--playground-star-tilt',`${f.starTilt}deg`);
  pencil?.style.setProperty('--playground-pencil-opacity',f.pencilAway?'0':'1');
 };
 const running=()=>!disposed&&!paused&&!motion.matches&&!doc.hidden;
 const tick=now=>{
  request=0;if(!running())return;
  if(last){const dt=Math.min((now-last)/1000,.1);if(quiet)quietTime+=dt;else clock+=dt;}
  last=now;draw();request=env.requestAnimationFrame(tick);
 };
 const sync=()=>{
  if(request)env.cancelAnimationFrame(request);request=0;last=0;
  const stopped=paused||motion.matches;
  toggle.disabled=motion.matches;
  toggle.setAttribute('aria-pressed',String(stopped));
  toggle.setAttribute('aria-label',motion.matches?'Animation off: reduced motion preference':paused?'Resume character animation':'Pause character animation');
  toggle.innerHTML=motion.matches?'motion off':paused?'<span aria-hidden="true">▷</span> resume the nonsense':'<span aria-hidden="true">Ⅱ</span> pause the nonsense';
  draw();if(running())request=env.requestAnimationFrame(tick);
 };
 toggle.onclick=()=>{paused=!paused;try{env.localStorage.setItem('alibi-playground-paused',String(paused));}catch{}sync();};
 const observer=new env.ResizeObserver(measure);observer.observe(home);observer.observe(stage);observer.observe(home.querySelector('.join-sheet'));observer.observe(home.querySelector('.home-logo'));
 doc.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);env.addEventListener('resize',measure);
 doc.fonts?.ready.then(()=>{if(!disposed)measure();});
 measure();sync();
 return {
  setQuiet(value){if(disposed||quiet===value)return;quiet=value;quietTime=clock;sync();},
  destroy(){if(disposed)return;disposed=true;if(request)env.cancelAnimationFrame(request);request=0;observer.disconnect();doc.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);env.removeEventListener('resize',measure);toggle.onclick=null;front.svg.remove();back.svg.remove();star?.style.removeProperty('--playground-star-tilt');pencil?.style.removeProperty('--playground-pencil-opacity');},
 };
}
