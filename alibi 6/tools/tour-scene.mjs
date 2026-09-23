// 80-second continuous example game. Production art, couch cast, readable dialogue.
import {readFileSync} from 'node:fs';
import {characterSvg,characterParts} from '../public/characters.js';
import {CAST,point,headPoint} from '../public/playground-scene.js';
import {renderSceneSvg} from '../public/playground.js';
import {wordmark} from '../public/logo.js';
import {doodle} from '../public/art.js';
const fonts=JSON.parse(readFileSync(new URL('./preview-fonts.json',import.meta.url)));
export const W=1280,H=720,DURATION=80,FPS=24;
const ink='#292720',paper='#f1ead7',sheet='#fffcf0',red='#bd4935',blue='#47718c',yellow='#e8bf54',sage='#849875';
const colors=[sage,red,blue,'#9a7330'],xs=[180,480,790,1090],memo=new Map();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>1-(1-clamp(n))**3,mix=(a,b,p)=>a+(b-a)*p;
const pulse=(t,a,b)=>Math.sin(Math.PI*clamp((t-a)/(b-a)));
export const DIALOGUE=[
 [0,6,2,'Alibi is a party game about your friends.'],
 [6,12,0,'Join on your phone. Everyone shares one screen.'],
 [12,18,1,'Pick your character. Make yourself at home.'],
 [18,24,2,'One friend answers a question. Everyone else writes a lie.'],
 [24,30,0,'Now vote: which answer is actually true?'],
 [30,35,1,'Find the truth for points. Fool friends for more.'],
 [35,41,3,'Round two: write questions about each other.'],
 [41,46,2,'Secret roles give you a little help.'],
 [46,52,1,'Final round: I answer a question, then sit out.'],
 [52,58,3,'I see Cowboy’s answer. The other artists only see the question.'],
 [58,64,2,'Time to draw. You get 90 seconds.'],
 [64,70,0,'Which drawing came from the artist who knew?'],
 [70,75,3,'Timers, scores, and reconnecting? All handled.'],
 [75,80,2,'Most points wins. Think you know your friends?'],
];
export const cue=t=>DIALOGUE.find(([a,b])=>t>=a&&t<b)||DIALOGUE.at(-1);
function measure(str,size,font='hand'){const f=fonts[font];return [...str].reduce((n,c)=>n+(f.glyphs[c]||f.glyphs['?']).w,0)*size/f.upm;}
function text(str,x,y,size=32,color=ink,font='hand',align='left'){
 const key=[str,size,font].join('|');let v=memo.get(key);
 if(!v){let pos=0;const f=fonts[font],s=size/f.upm;let paths='';for(const c of str){const g=f.glyphs[c]||f.glyphs['?'];paths+=`<path transform="translate(${pos} 0)" d="${g.d}"/>`;pos+=g.w;}v={paths:`<g transform="scale(${s} ${-s})">${paths}</g>`,width:pos*s};memo.set(key,v);}
 return `<g fill="${color}" transform="translate(${x-(align==='center'?v.width/2:align==='right'?v.width:0)} ${y})">${v.paths}</g>`;
}
function wrap(str,size,max){const out=[];let line='';for(const word of str.split(' ')){if(line&&measure(line+' '+word,size)>max){out.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)out.push(line);return out;}
const rect=(x,y,w,h,fill=sheet,stroke='none',sw=2)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line=(x,y,xx,yy,color=ink,w=3)=>`<path d="M${x} ${y}L${xx} ${yy}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
const asset=(svg,x,y,w,h)=>svg.replace('<svg ',`<svg x="${x}" y="${y}" width="${w}" height="${h}" overflow="visible" style="color:${ink}" `);
const art=(kind,x,y,w=90,h=w*1.125)=>asset(doodle(kind),x,y,w,h);
const avatar=(i,x,y,w=80,h=w*1.25,extra={})=>{const {name,...config}=CAST[i];return asset(characterSvg({...config,...extra}),x,y,w,h);};
const rotate=(s,a,x,y)=>`<g transform="rotate(${a} ${x} ${y})">${s}</g>`;
function scrap(x,y,w,h,fill=sheet,a=0,inside='',tape=true){return rotate(rect(x+5,y+6,w,h,'#b9b096')+rect(x,y,w,h,fill,'#c8bea9',1.4)+(tape?rect(x+w/2-35,y-9,70,19,'#d0be9299'):'')+inside,a,x+w/2,y+h/2);}
function check(x,y,color=sage,size=18){return `<path d="M${x-size*.45} ${y}l${size*.3} ${size*.35}l${size*.65} ${-size*.8}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;}
function pill(str,x,y,w=180,fill=yellow){return rotate(rect(x,y,w,31,fill)+text(str,x+w/2,y+23,22,ink,'hand','center'),-1.5,x+w/2,y+15);}
function tag(str,x,y,color=blue){return text(str,x,y,14,color,'mono');}
function tinyPhone(x,y,w=52,h=79,fill=sheet){return rect(x+3,y+4,w,h,'#bcb197')+`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${ink}"/>`+rect(x+5,y+7,w-10,h-18,fill)+`<circle cx="${x+w/2}" cy="${y+h-5}" r="2" fill="${sheet}"/>`;}
function panelPhone(x,y,w,h,inside='',title='PRIVATE PHONE'){return rect(x+5,y+6,w,h,'#bcb197')+`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="${ink}"/>`+rect(x+8,y+19,w-16,h-29,sheet)+`<path d="M${x+w/2-17} ${y+10}h34" stroke="${sheet}" stroke-width="2" stroke-linecap="round"/>`+inside+tag(title,x+14,y+h+24);}
function clock(seconds,x,y,w=142,progress=1,paused=false){return rotate(rect(x+4,y+4,w,56,ink)+rect(x,y,w,56,paused?'#cbd6c2':yellow,ink,2)+text(paused?'paused':`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`,x+w/2,y+39,32,ink,'hand','center')+rect(x,y+52,w*clamp(progress),4,ink),1.5,x+w/2,y+28);}
function bubble(t){const [start,,speaker,words]=cue(t),speakerX=cozy(t)?roomXs[speaker]:xs[speaker],size=40,lines=wrap(words,size,942),width=1020,x=clamp(speakerX-width/2,82,1198-width),y=70,h=128,tail=clamp(speakerX,x+35,x+width-35),pop=.97+.03*ease((t-start)/.16);
 const body=`<path d="M${x+14} ${y+1}Q${x+width*.5} ${y-2} ${x+width-12} ${y+3}Q${x+width+3} ${y+5} ${x+width} ${y+20}L${x+width-2} ${y+h-14}Q${x+width-3} ${y+h+1} ${x+width-18} ${y+h}L${tail+22} ${y+h}L${tail} ${y+h+26}L${tail-18} ${y+h-1}L${x+17} ${y+h-3}Q${x-3} ${y+h-4} ${x} ${y+h-21}L${x+1} ${y+17}Q${x} ${y} ${x+14} ${y+1}Z" fill="${sheet}" stroke="${ink}" stroke-width="2.7"/>`;
 const first=lines.length===1?y+87:y+72;
 return `<g transform="translate(${x+width/2} ${y+h/2}) scale(${pop}) translate(${-x-width/2} ${-y-h/2})">${body}${tag(t<12?'YOUR FRIEND':CAST[speaker].name.toUpperCase(),x+24,y+28,colors[speaker])}${lines.map((s,i)=>text(s,x+width/2,first+i*43,size,ink,'hand','center')).join('')}</g>`;
}
function base(t){const chapters=['game night','join the room','make it yours','round 1 · lie + vote','round 2 · your questions','round 3 · draw','keep playing','one winner'],index=t<6?0:t<12?1:t<18?2:t<35?3:t<46?4:t<70?5:t<75?6:7;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><pattern id="rules" width="1280" height="32" patternUnits="userSpaceOnUse"><path d="M0 31.5H1280" stroke="#839e96" opacity=".16"/></pattern><pattern id="grain" width="71" height="67" patternUnits="userSpaceOnUse"><circle cx="7" cy="13" r=".7" fill="#6f6650" opacity=".13"/><circle cx="47" cy="53" r=".55" fill="#6f6650" opacity=".16"/></pattern><pattern id="binding" width="14" height="23" patternUnits="userSpaceOnUse"><rect width="14" height="23" fill="${ink}"/><ellipse cx="4" cy="5" rx="1.5" ry="2.5" fill="${paper}"/><ellipse cx="10" cy="16" rx="1.6" ry="2.8" fill="${paper}"/></pattern></defs><style>.logo-face{opacity:0}</style>${rect(0,0,W,H,paper)}${rect(0,0,W,H,'url(#rules)')}${rect(0,0,W,H,'url(#grain)')}${rect(15,0,15,H,'url(#binding)')}${line(62,0,62,H,'#bd493536',1)}${asset(wordmark(),82,14,95,42)}${tag(chapters[index].toUpperCase(),205,42)}${text('EXAMPLE GAME',1204,42,12,blue,'mono','right')}${rect(62,713,1218*clamp(t/DURATION),7,red)}`;
}
const answerNames=['My lucky boots','My favorite hat','My phone','My snacks'];
function bluff(t){let p=t-10,s=text('What would Cowboy save first from his room?',640,258,31,ink,'hand','center');
 if(p<4.5){s+=panelPhone(204,292,303,214,tag('COWBOY',222,329,red)+text('your real answer',355,365,22,ink,'hand','center')+scrap(225,389,257,60,'#f1dfa9',-1,text('My lucky boots',353,430,30,ink,'hand','center'),false));
 s+=scrap(571,292,512,213,sheet,1,tag('EVERYONE ELSE',596,324)+text('write a believable answer',827,359,26,ink,'hand','center'));
 const rows=['My favorite hat','My phone','My snacks'];for(let i=0;i<3;i++){const op=ease((p-.8-i*.55)/.35);s+=`<g opacity="${op}">${text(rows[i],615,400+i*32,25,ink)}${check(1032,392+i*32)}</g>`;}
 s+=clock(30,1085,277,113,1);
 }else{
 const reveal=p>=7.05;if(!reveal)s+=clock(30,1086,211,112,1);
 for(let i=0;i<4;i++){const x=140+i%2*559,y=302+Math.floor(i/2)*107;let inside=text(String.fromCharCode(65+i),x+18,y+35,22,blue,'mono')+text(answerNames[i],x+55,y+41,29);
 if(reveal){inside+=text(i===0?'Cowboy’s truth':`${['','Cape','Flower','Frog'][i]}’s answer`,x+20,y+76,19,i===0?'#4f7345':blue);if(i===0)inside+=avatar(2,x+362,y+42,32,40)+avatar(3,x+400,y+42,32,40);if(i===1)inside+=avatar(0,x+378,y+42,32,40);}
 else if(p>5.8&&i<2)inside+=check(x+426,y+62,red,22);
 s+=scrap(x,y,480,89,reveal&&i===0?'#dce5d1':i%2?'#efd4c4':'#f3dfa9',i%2?1:-1,inside,false);}
 if(reveal){const a=ease((p-7.05)/.4);s+=`<g opacity="${a}" transform="translate(0 ${(1-a)*14})">${pill('+500  found the truth',165,525,326,'#dce5d1')}${pill('+250  fooled a friend',733,525,326,'#f1dfa9')}</g>`;}
 else s+=tag('VOTE FOR THE TRUTH',466,550);
 }return s;
}
const DRAWINGS={
 house:[[[.12,.43],[.5,.12],[.9,.43]],[[.23,.36],[.23,.85],[.79,.85],[.79,.35]],[[.45,.84],[.45,.61],[.59,.61],[.59,.84]],[[.3,.48],[.4,.48],[.4,.59],[.3,.59],[.3,.48]],[[.65,.48],[.74,.48],[.74,.59],[.65,.59],[.65,.48]],[[.12,.89],[.91,.88]]],
 tent:[[[.48,.17],[.12,.83],[.9,.82],[.48,.17]],[[.49,.3],[.35,.82]],[[.5,.3],[.66,.81]],[[.15,.79],[.05,.9]],[[.88,.8],[.96,.91]],[[.1,.92],[.93,.92]]],
 couch:[[[.17,.5],[.18,.26],[.81,.28],[.82,.51]],[[.12,.44],[.07,.49],[.09,.8],[.89,.79],[.93,.47],[.83,.43],[.8,.65],[.21,.64],[.19,.46],[.12,.44]],[[.18,.8],[.18,.93]],[[.8,.79],[.81,.9]],[[.47,.32],[.47,.62]]]
};
function strokes(kind,x,y,w,h,progress=1){const paths=DRAWINGS[kind];let s='';for(let i=0;i<paths.length;i++){let pts=paths[i],v=clamp(progress*paths.length-i);if(!v)continue;let n=v*(pts.length-1),full=Math.floor(n),out=pts.slice(0,full+1);if(full<pts.length-1){const a=pts[full],b=pts[full+1],f=n-full;out.push([mix(a[0],b[0],f),mix(a[1],b[1],f)]);}s+=`<polyline points="${out.map(p=>[x+p[0]*w,y+p[1]*h].join(',')).join(' ')}" fill="none" stroke="${kind==='house'?ink:kind==='tent'?blue:red}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;}return s;}
function finale(t){let p=t-25,s='';if(p<1.25)for(let i=0;i<10;i++)s+=art('flame',62+i*121,448+Math.sin(i+p*17)*15+130*ease((p-.65)/.6),147,193);
 s+=text('What’s Cowboy’s favorite safe space?',640,259,31,ink,'hand','center');
 if(p<4.75){
 s+=scrap(118,302,321,185,'#f1dfa9',-2,tag('COWBOY / PRIVATE',139,335,red)+text('My house',277,402,42,ink,'hand','center')+text('answers, then watches',277,454,22,blue,'hand','center'));
 const know=p>=2.5;
 s+=panelPhone(503,297,298,200,tag('CAPE / PRIVATE',523,337)+text(know?'My house':'waiting for answer',651,402,know?38:26,know?red:ink,'hand','center')+(know?text('only you see this',651,459,24,blue,'hand','center'):''));
 s+=scrap(864,302,309,185,sheet,2,tag('FLOWER + FROG',884,335)+text('Question only',1018,402,34,ink,'hand','center')+text('draw your best guess',1018,456,22,blue,'hand','center'));
 if(know)s+=line(454,399,487,399,red,3)+line(476,388,489,399,red,3)+line(476,410,489,399,red,3);
 }else{
 const gallery=p>=7,reveal=p>=9.9;if(gallery&&!reveal)s+=tag('FROG’S VOTING VIEW',145,281);
 const kinds=['house','tent','couch'],artists=[3,2,0];
 for(let i=0;i<3;i++){const x=136+i*370,progress=gallery?1:clamp((p-4.7)/1.9-(i*.025));
 let c=text(gallery?String.fromCharCode(65+i):CAST[artists[i]].name,x+21,313,23,blue,gallery?'mono':'hand')+rect(x+17,326,284,149,'#fff')+strokes(kinds[i],x+27,329,264,139,progress);
 if(gallery){c+=text(reveal?(i===0?'Cape knew the answer':`${CAST[artists[i]].name}’s guess`):i===2?'Frog’s drawing: cannot vote':'pick the informed drawing',x+158,502,i===2?17:20,reveal&&i===0?'#4f7345':blue,'hand','center');if(reveal&&i===0)c+=avatar(2,x+262,287,34,43);if(reveal&&i===1)c+=avatar(0,x+262,287,34,43);}
 else{for(let j=0;j<4;j++)c+=`<circle cx="${x+31+j*28}" cy="493" r="7" fill="${[ink,red,blue,sage][j]}"/>`;c+=text('undo',x+235,502,19,blue);if(i===2&&p>=5.7&&p<6.05)c+=line(x+100,430,x+197,352,red,3);if(i===2&&p>=6.05&&p<6.45)c+=line(x+230,508,x+279,508,red,2);}
 s+=scrap(x,282,320,235,reveal&&i===0?'#dce5d1':sheet,[1,-2,2][i],c,false)+`<circle cx="${x+157}" cy="284" r="6" fill="${red}" stroke="${ink}" stroke-width="1.5"/>`;
 }
 if(!gallery)s+=clock(Math.max(88,90-Math.floor(p-4.75)),1090,214,110,1);
 else if(!reveal)s+=text('Cowboy + Cape sit out the vote',640,552,22,blue,'hand','center');
 else s+=pill('The real answer: my house',422,536,436,'#dce5d1');
 }
 return s;
}
function controls(t){const p=t-36;if(p<4.65){let paused=p>=1.15&&p<1.95,secs=p<1.15?18:paused?17:Math.max(15,17-Math.floor(p-1.95));let s=scrap(128,264,695,251,sheet,-1,tag('SHARED SCREEN',152,301)+text('Who’s ready?',365,353,36)+clock(secs,597,303,177,secs/30,paused));
 for(let i=0;i<4;i++){s+=avatar(i,166+i*151,379,57,71)+text(CAST[i].name,194+i*151,476,22,ink,'hand','center');if(p>i*.55+.15)s+=check(224+i*151,414,sage,20);}
 s+=panelPhone(911,270,231,245,tag('PRIVATE PHONE',930,309)+text('Your answer',1026,358,28,ink,'hand','center')+rect(935,379,182,62,'#e8dec7')+text('••••••'.replaceAll('•','*'),1027,422,34,ink,'mono','center')+text('only on your phone',1026,477,18,blue,'hand','center'));
 if(p>2.2)s+=pill('+500',669,505,136,'#dce5d1');return s;
 }
 const refreshed=p>=6.1;let s=panelPhone(442,251,407,283,tag('FROG’S PHONE',465,290));
 if(!refreshed){s+=text('Reconnecting…',645,383,39,ink,'hand','center');const a=(p-4.65)*300;s+=`<g transform="translate(645 445) rotate(${a})"><path d="M-24 0A24 24 0 1 1 16 19" fill="none" stroke="${blue}" stroke-width="4"/><path d="M10 13L17 23L26 16" fill="none" stroke="${blue}" stroke-width="4"/></g>`;}
 else s+=avatar(0,487,322,95,119)+text('You’re back!',696,372,32,ink,'hand','center')+text('Answer submitted',686,422,22,blue,'hand','center')+check(790,418)+pill('same room · same character',465,466,358,'#dce5d1');
 return s;
}
const roomXs=[657,806,955,1104],revealAt=[12.6,13.5,14.4,15.3];
const fullCast=CAST.map(({name,...a})=>a);
const plainCast=fullCast.map((a,i)=>({...a,head:['bean','square','pear','alien'][i],hat:'none',hair:'none',glasses:'none',outfit:'tee',color:'paper'}));
const cozy=(t)=>t<18||(t>=75);
const transformAt=(i,t)=>t>=revealAt[i];
function burst(x,y,age,color=yellow){if(age<0||age>1)return '';const f=clamp(age),r=15+f*70;let s='';for(let i=0;i<8;i++){const a=i*Math.PI/4;s+=line(x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+12*(1-f)),y+Math.sin(a)*(r+12*(1-f)),color,3);}return `<g opacity="${1-f}">${s}</g>`;}
function couch(x,y,w,h){let s=`<g stroke="${ink}" stroke-width="3" stroke-linejoin="round">`;
 s+=`<path d="M${x+20} ${y+h-24}l-7 24h18l8-24M${x+w-35} ${y+h-24}l8 24h18l-6-25" fill="#8a664a"/>`;
 s+=`<rect x="${x+14}" y="${y}" width="${w-28}" height="${h-33}" rx="30" fill="#9ea890"/>`;
 for(let i=0;i<4;i++){let xx=x+30+i*(w-60)/4;s+=`<path d="M${xx} ${y+17}q${(w-65)/8} -7 ${(w-65)/4} 0l0 ${h*.73}q${-(w-65)/8} 11 ${-(w-65)/4} 0Z" fill="${i%2?'#aeb89b':'#b4bca2'}"/>`;s+=`<path d="M${xx+6} ${y+h*.77}q${w/9} -7 ${w/4-24} 0l7 31q${-w/9} 9 ${-w/4+10} 0Z" fill="#c2c7ad"/>`;}
 s+=`<path d="M${x+13} ${y+h*.63}q-20-10-20 16l0 ${h*.37-34}q0 21 23 21l${w-32} 0q28-2 26-26l0-${h*.37-36}q-1-28-26-17l-11 24H${x+28}Z" fill="#8f9e7e"/>`;
 s+=`<path d="M${x+39} ${y+h-43}Q${x+w/2} ${y+h-30} ${x+w-35} ${y+h-43}" fill="none" stroke="#647455" stroke-dasharray="5 6" stroke-width="1.5"/></g>`;return s;}
function livingRoom(t){let s='';
 // Angled wall/floor, framed doodles, lamp, rug and little coffee table.
 s+=line(85,583,1212,583,'#a89d80',2)+`<path d="M176 648L1088 648L1184 703H98Z" fill="#dcc89d" stroke="#bba981" stroke-width="2"/>`;
 for(let i=0;i<8;i++)s+=line(167+i*129,657,152+i*141,696,'#bd493540',2);
 s+=scrap(801,240,95,91,sheet,-5,art('flower',821,257,48,59),false)+scrap(959,240,104,86,sheet,4,art('star',981,255,59,63),false);
 s+=line(1201,342,1201,591,ink,4)+`<path d="M1174 590Q1201 579 1224 593Z" fill="#9d7c56" stroke="${ink}" stroke-width="2"/><path d="M1182 269L1215 269L1235 344L1158 344Z" fill="#f1d682" stroke="${ink}" stroke-width="3"/>`;
 s+=couch(573,403,596,211);
 s+=`<path d="M176 508L169 579M469 508L478 579" stroke="${ink}" stroke-width="6"/>`+rect(136,494,395,21,'#a8825f',ink,2);
 // The TV screen retains the same room WORM throughout this example match.
 s+=`<rect x="115" y="251" width="427" height="244" rx="11" fill="${ink}" stroke="#b5aa91" stroke-width="4"/>`+rect(133,268,390,207,sheet);
 s+=`<circle cx="516" cy="484" r="3" fill="${sage}"/>`;
 if(t<6){s+=asset(wordmark(),218,279,209,93)+text('your friends are the trivia.',328,407,20,ink,'hand','center')+text('2–8 players',328,444,18,blue,'mono','center');}
 else if(t<12){s+=tag('JOIN THE ROOM',149,294)+text('WORM',328,345,36,ink,'mono','center');const count=Math.min(4,Math.floor((t-6.3)/.8)+1);for(let i=0;i<4;i++){s+=asset(characterSvg(plainCast[i]),155+i*86,356,60,75);if(i<count)s+=check(215+i*86,412,sage,14);}s+=text('alib.app · no downloads',328,457,19,blue,'hand','center');}
 else if(t<18){s+=text('make yourself at home',328,301,24,ink,'hand','center');for(let i=0;i<4;i++){const chosen=transformAt(i,t);s+=asset(characterSvg(chosen?fullCast[i]:plainCast[i]),143+i*95,321,87,109);s+=text(chosen?CAST[i].name:'...',187+i*95,451,17,chosen?blue:ink,'hand','center');if(chosen)s+=check(211+i*95,339,sage,12);}}
 else{s+=text('Flower wins!',328,311,32,ink,'hand','center')+avatar(2,178,331,78,99,{hat:'crown'})+text('5,500 points',377,374,23,ink,'hand','center')+text('alib.app',363,431,33,red,'hand','center');}
 s+=`<path d="M358 656l-10 40M571 656l9 40" stroke="${ink}" stroke-width="4"/><path d="M335 634Q467 621 595 637L584 659Q469 670 345 657Z" fill="#bd986f" stroke="${ink}" stroke-width="3"/>`;
 s+=`<path d="M414 618L429 644L462 644L477 618Z" fill="#f0d891" stroke="${ink}" stroke-width="2"/>`;
 for(let i=0;i<11;i++)s+=`<circle cx="${420+(i*17)%51}" cy="${615+(i*7)%13}" r="6" fill="${sheet}" stroke="#a89361" stroke-width="1.2"/>`;
 s+=tinyPhone(505,628,37,21,'#c2cbb7');
 return s;
}
function pose(i,t,speaker,room=false){const life=Math.sin(t*[2.5,2.2,2.7,2.1][i]+i),speaking=i===speaker;
 const p={x:room?roomXs[i]:xs[i],y:room?607:699,s:room?.86:.65,hip:0,crouch:7,bodyX:1,bodyY:1+life*.012,lean:life*1.1,head:life*1.8,headY:1,turn:room?-.3:0,look:room?[-3,-3]:[0,-3],blink:(t+i*.67)%4.1<.14?.1:1,expression:'smile',hands:[[78,153],[137,148]],grips:['grip','point'],wrists:[-8,12],feet:[[65,224],[153,224]],seated:true,hatScale:1,hatAngle:life*1.5,hatLift:0,hatHidden:false,magic:0,wand:0,wandAngle:-24,glassesAngle:0,glassesDrop:0,cape:life*8,flower:life*6};
 // Speech uses a few deliberate gestures; full sentences remain visible without typing.
 const age=t-cue(t)[0];
 if(speaking){p.head+=Math.sin(t*5)*1.3;p.expression=age<2.5&&Math.sin(t*10)>.15?'laugh':'smile';p.hands[1]=[153+4*Math.sin(t*4),125+6*Math.cos(t*3)];p.grips[1]='open';p.look=[0,0];p.turn=0;}
 if(t<6){if(i===0){p.look=[-5,-2];p.expression='confused';p.head=-7;}if(i===1){p.head=4;p.expression='skeptical';}if(i===3){p.look=[-3,2];p.hands[1]=[126,151+3*Math.sin(t*5)];}}
 if(t>=6&&t<12){p.look=[0,6];if(!speaking)p.expression='focused';p.hands[1]=[125+3*Math.sin(t*5+i),149+2*Math.cos(t*7)];if(t>9.5){p.head=-2;p.look=[-4,-4];p.expression='relieved';}}
 if(t>=12&&t<18){const a=t-revealAt[i],e=ease(a/.55);if(a>=0){p.hatScale=.3+.7*e;p.hatLift=60*(1-e);p.bodyX=1+.12*pulse(a,0,.8);p.bodyY=1-.09*pulse(a,0,.8);p.expression='surprise';p.hands[1]=[154,88];p.grips[1]='open';if(a>.8){p.expression='proud';p.head=-5+life*2;p.look=[i%2?-4:4,0];}if(i===0&&a>.9){p.hands[1]=[142,34];p.expression='laugh';}if(i===1&&a>.9){p.hands[1]=[151,43];p.hatAngle=-8;p.hatLift=4;}if(i===2&&a>.9){p.hands[1]=[146,74];p.glassesAngle=Math.sin(a*4)*3;p.expression='proud';}if(i===3){p.cape=25*Math.sin(a*5)*Math.exp(-a*.8);p.hands=[[47,110],[171,107]];}}}
 if(t>=18&&t<24){p.look=[0,5];p.expression='focused';p.hands[1]=[127+Math.sin(t*7+i)*5,149+Math.cos(t*5)*3];if(i===1){p.expression='proud';p.head=-3;}if(i===0&&t>20&&t<22){p.lean=11;p.head=8;p.turn=.65;p.look=[5,1];}if(i===1&&t>20&&t<22){p.hands[0]=[57,111];p.grips[0]='open';p.look=[-5,1];p.expression='skeptical';}}
 if(t>=24&&t<30){if(i===0){p.head=-8;p.hands[1]=[106,102];p.grips[1]='point';p.expression=t<27.5?'confused':'focused';}if(i===3){p.expression='guilty';p.look=[-5,0];p.head=6;}if(i===2){p.look=[0,-5];p.expression='focused';}}
 if(t>=30&&t<35){if(i===0){p.expression='surprise';p.head=-10;p.crouch=14;p.hands[1]=[78,91];}if(i===3){p.expression='proud';p.head=-7;p.hands[1]=[164,109];p.grips[1]='fist';}if(i===2){p.expression='laugh';p.hands[1]=[166,104];p.grips[1]='open';p.y-=pulse(t,30.3,31.1)*14;}if(i===1){p.expression='proud';p.hands[1]=[150,43];p.hatLift=7;}}
 if(t>=35&&t<41){p.look=[0,5];p.expression=i===0?'worried':'focused';p.hands[1]=[127+Math.sin(t*7+i)*4,147+3*Math.cos(t*5)];if(i===3){p.expression='guilty';p.look=[-4,1];p.head=-5;}}
 if(t>=41&&t<46){if(i===2){p.hands[1]=[145,77];p.expression='proud';p.glassesAngle=-4;}if(i===0){p.expression='skeptical';p.head=8;p.look=[4,-3];}if(i===3){p.expression='confused';p.hands[1]=[164,113];}}
 if(t>=46&&t<52){if(i===1){p.expression='focused';p.hands[1]=[128+Math.sin(t*7)*3,148];p.look=[0,5];}else{p.look=[i<1?5:-4,-3];p.expression='curious';}}
 if(t>=52&&t<58){if(i===3){p.expression='surprise';p.head=-4;p.look=[0,5];p.hands=[[85,144],[128,146]];if(t>54)p.expression='proud';}if(i===0){p.expression='confused';p.head=-10;p.hands[1]=[106,98];}if(i===2){p.expression='focused';p.head=6;}if(i===1){p.hands=[[49,141],[169,140]];p.grips=['open','open'];p.lean=4;p.expression='proud';}}
 if(t>=58&&t<64){if(i!==1){p.expression='focused';p.look=[0,5];p.head=Math.sin(t*3+i)*4;p.hands[1]=[126+Math.sin(t*7+i)*9,144+Math.cos(t*5+i)*8];p.grips[1]='grip';p.lean=3*Math.sin(t*2+i);if(i===0&&t>61&&t<62){p.expression='confused';p.hands[1]=[139,114];}}else{p.expression='pleading';p.hands=[[55,137],[167,136]];p.grips=['open','open'];p.head=-6;p.look=[3,0];}}
 if(t>=64&&t<70){if(t<67.7){p.expression=i===1||i===3?'proud':'confused';p.look=[0,-5];if(i===0||i===2){p.hands[1]=[103,102];p.grips[1]='point';p.head=(i===0?-1:1)*7;}}else{if(i===0){p.expression='embarrassed';p.crouch=14;p.hands[1]=[80,83];}if(i===2){p.expression='laugh';p.hands[1]=[166,107];}if(i===3){p.expression='proud';p.hands[1]=[167,99];p.grips[1]='fist';}if(i===1){p.expression='relieved';p.hands[1]=[160,121];}}}
 if(t>=70&&t<75){if(i===0){p.look=[0,6];p.expression=t<72?'smile':t<73.3?'panic':'relieved';p.head=t<73.3?-7:5;p.hands[1]=t<73.3?[146,112]:[159,103];p.grips[1]=t<73.3?'open':'fist';}if(i===3){p.look=[-5,0];p.expression='smile';p.hands[1]=[166,111];}}
 if(t>=75){p.look=[i<2?5:-4,-2];if(i===2){p.expression='proud';p.y-=pulse(t,75.8,76.6)*17;p.hands=[[57,99],[167,103]];p.grips=['open','open'];p.head=-5;}else{p.expression=i===0?'skeptical':'laugh';p.hands=[[100+Math.sin(t*9)*3,137],[121-Math.sin(t*9)*3,137]];p.grips=['clap','clap'];p.head=Math.sin(t*4)*3;}if(i===0&&t>77){p.expression='smile';p.hands[1]=[155,38];p.hatAngle=-5;}}
 return p;
}
function ensemble(t,room=false){const speaker=cue(t)[2],poses=[0,1,2,3].map(i=>pose(i,t,speaker,room));let custom='',effects='',background='';
 if(!room)background=couch(100,578,1080,132);
 const costumes=fullCast.map((a,i)=>transformAt(i,t)?a:plainCast[i]);
 poses.forEach((p,i)=>{
 const usingPhone=t<18||(t>=18&&t<30)||(t>=35&&t<64&&!(i===1&&t>=52))||(t>=64&&t<67.7&&(i===0||i===2))||(t>=70&&t<75&&i===0);
 if(usingPhone){const q=point(p,92,148);custom+=rotate(tinyPhone(q.x-13,q.y-20,27*p.s,43*p.s,'#d5e1cf'),-8,q.x,q.y);if(t>=58&&t<64&&i!==1){const r=point(p,...p.hands[1]);custom+=rotate(`<path d="M${r.x} ${r.y}l10 -25l4 2l-10 25Z" fill="${yellow}" stroke="${ink}" stroke-width="1.4"/>`,-15,r.x,r.y);}}
 if(t>=75&&i===2){const q=headPoint(p,108,14);custom+=`<g fill="none" stroke="${ink}" stroke-width="3" transform="translate(${q.x} ${q.y-7}) scale(${p.s*.7}) translate(-108 -25)">${characterParts({...fullCast[2],hat:'crown'}).hats.crown}</g>`;}
 if(t>=12&&t<18){const q=headPoint(p,108,70);effects+=burst(q.x,q.y,t-revealAt[i],colors[i]);}
 if((t>=30.4&&t<32)||(t>=67.9&&t<69.3)){if(i===2||i===3||t>=67.9&&i===1){const q=headPoint(p,108,4),age=t-(t<35?30.4:67.9);effects+=`<g opacity="${1-clamp(age/1.6)}">${pill(t<35?(i===2?'+500':'+250'):(i===2?'+1,500':'+500'),q.x-43,q.y-25-age*20,100,'#dce5d1')}</g>`;}}
 if(i===speaker&&!room){background+=line(p.x-32,712,p.x+35,712,colors[i],3);}
 });
 let svg=renderSceneSvg({width:W,height:H,stage:{x:85,y:715,width:1119,height:0}},{actors:poses,props:{},trail:[],effects:[]},{characters:costumes}).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
 svg=svg.replace('<g data-hands="0"',custom+'<g data-hands="0"');
 return background+svg+effects;
}
function smileTransition(t){if(t<17.65||t>=19)return '';const p=clamp((t-17.65)/1.35),fade=p<.18?ease(p/.18):1-clamp((p-.81)/.19),z=1+ease((p-.57)/.43)*7;
 let mark=wordmark().replaceAll('class="logo-letter"',`class="logo-letter" opacity="${1-clamp((p-.15)/.33)}"`).replace('class="logo-face"','class="logo-face" style="opacity:1"');
 mark=mark.replace('class="face-circle" pathLength="1"',`class="face-circle" stroke-dasharray="4500" stroke-dashoffset="${4500*(1-clamp((p-.12)/.35))}"`).replace('class="face-smile" pathLength="1"',`class="face-smile" stroke-dasharray="1200" stroke-dashoffset="${1200*(1-clamp((p-.29)/.27))}"`);
 return `<svg x="76" y="220" width="1148" height="485" viewBox="0 0 1148 485"><g opacity="${fade}">${rect(0,0,1148,485,paper)}<g transform="translate(570 235) scale(${z}) translate(-570 -235)">${asset(mark,248,139,535,239)}</g></g></svg>`;
}
function roundTwo(t){if(t<41){const p=t-35,q='What would Frog buy with a million dollars?';return scrap(186,264,902,234,sheet,-1,tag('CAPE’S QUESTION / ABOUT FROG',218,302)+text(q,639,362,30,ink,'hand','center')+text(p<3?'make it personal.':'sent to Frog’s phone',639,411,23,blue,'hand','center')+pill(p>3?'question submitted':'write your question',484,445,312,p>3?'#dce5d1':yellow))+clock(60,1088,259,114);}
 let s=text('What would Frog buy with a million dollars?',640,259,31,ink,'hand','center');
 s+=scrap(132,297,335,219,'#f1dfa9',-2,tag('FLOWER’S SECRET ROLE',154,331)+avatar(2,157,351,101,126)+text('Detective',344,385,34,ink,'hand','center')+text('remove one',344,425,24,blue,'hand','center')+text('wrong answer',344,453,24,blue,'hand','center'));
 const opts=['A frog pond','A tiny castle','A snack truck'];s+=panelPhone(580,287,568,240,tag('FLOWER’S PRIVATE PHONE',603,324));
 for(let i=0;i<3;i++){const crossed=i===1&&t>=43.2,y=342+i*52;s+=rect(603,y,522,43,crossed?'#ddd9cb':'#f3e5be')+text(opts[i],865,y+31,28,crossed?'#918878':ink,'hand','center');if(crossed)s+=line(744,y+26,990,y+14,red,3);}
 return s;
}
function smartControls(t){let s='';if(t<72){s=controls(36+(t-70)*1.7);}else{s=controls(40.65+(t-72)*1.1);}
 return s;
}
function closing(t){let s=livingRoom(t)+ensemble(t,true);s+=pill('your next game night: alib.app',241,226,746,yellow);
 for(let i=0;i<19;i++){const age=t-75,x=601+(i*53)%535,y=281+(i*47+age*47)%165;s+=rotate(rect(x,y,5,10,[red,yellow,blue,sage][i%4]),i*31+age*50,x,y);}
 return s;
}
export function frame(t){t=clamp(t,0,DURATION-.001);let feature='',room=cozy(t);
 if(t<18)feature=livingRoom(t);
 else if(t<24)feature=bluff(10+clamp((t-18)/6)*4.49);
 else if(t<30)feature=bluff(14.5+clamp((t-24)/6)*2.5);
 else if(t<35)feature=bluff(17.1+clamp((t-30)/5)*1.85);
 else if(t<46)feature=roundTwo(t);
 else if(t<52)feature=finale(25+clamp((t-46)/6)*2.45);
 else if(t<58)feature=finale(27.55+clamp((t-52)/6)*2.15);
 else if(t<64)feature=finale(29.75+clamp((t-58)/6)*2.2);
 else if(t<70)feature=finale(32+clamp((t-64)/6)*3.98);
 else if(t<75)feature=smartControls(t);
 else feature=closing(t);
 let scene=feature+(t<75?ensemble(t,room):'');if(t>=17.05&&t<18){const z=ease((t-17.05)/.95);scene=`<svg x="76" y="220" width="1148" height="485" viewBox="76 220 1148 485"><g transform="translate(${mix(328,650,z)} ${mix(371,460,z)}) scale(${mix(1,2.75,z)}) translate(-328 -371)">${scene}</g></svg>`;}return base(t)+scene+smileTransition(t)+bubble(t)+'</svg>';
}
export function poster(){return base(0)+livingRoom(16.6)+ensemble(16.6,true)+scrap(99,74,1092,128,sheet,-.5,text('Game night starts here.',640,133,48,ink,'hand','center')+text('An 80-second tour of Alibi',640,176,28,blue,'hand','center'),false)+'</svg>';}
