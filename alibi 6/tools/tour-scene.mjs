// Approved 50-second illustrative tour. Production art and articulated character rig.
import {readFileSync} from 'node:fs';
import {characterSvg,characterParts} from '../public/characters.js';
import {CAST,point,headPoint} from '../public/playground-scene.js';
import {renderSceneSvg} from '../public/playground.js';
import {wordmark} from '../public/logo.js';
import {doodle} from '../public/art.js';
const fonts=JSON.parse(readFileSync(new URL('./preview-fonts.json',import.meta.url)));
export const W=1280,H=720,DURATION=50,FPS=24;
const ink='#292720',paper='#f1ead7',sheet='#fffcf0',red='#bd4935',blue='#47718c',yellow='#e8bf54',sage='#849875';
const colors=[sage,red,blue,'#9a7330'],xs=[180,480,790,1090],memo=new Map();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>1-(1-clamp(n))**3,mix=(a,b,p)=>a+(b-a)*p;
const pulse=(t,a,b)=>Math.sin(Math.PI*clamp((t-a)/(b-a)));
export const DIALOGUE=[
 [0,2.75,2,'Alibi is a party game about your friends.'],
 [2.75,5,2,'Make up lies. Guess what’s true.'],
 [5,8.65,0,'Join on your phone, choose your character, and play.'],
 [8.65,10,0,'No downloads.'],
 [10,12.1,2,'One friend tells the truth.'],
 [12.1,14.4,2,'Everyone else makes up an answer.'],
 [14.4,16.6,1,'Earn points by guessing correctly—'],
 [16.6,19,1,'or getting friends to believe you.'],
 [19,22,3,'Next, write questions about each other.'],
 [22,25,3,'Secret roles give you special abilities.'],
 [25,27.5,2,'Final round: one player answers a question.'],
 [27.5,29.75,2,'Only one artist sees their answer.'],
 [29.75,32,2,'Everyone else draws a guess.'],
 [32,36,0,'Which drawing came from the artist who knew?'],
 [36,40.65,3,'The game handles timers, scores, and keeping answers private.'],
 [40.65,42.1,0,'Accidentally refreshed?'],
 [42.1,44,3,'You can rejoin.'],
 [44,47,2,'Three rounds. Your friends. Plenty of questionable answers.'],
 [47,50,1,'Think you know each other? Let’s find out.'],
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
function bubble(t){const [start,,speaker,words]=cue(t),size=40,lines=wrap(words,size,942),width=1020,x=clamp(xs[speaker]-width/2,82,1198-width),y=70,h=128,tail=clamp(xs[speaker],x+35,x+width-35),pop=.97+.03*ease((t-start)/.16);
 const body=`<path d="M${x+14} ${y+1}Q${x+width*.5} ${y-2} ${x+width-12} ${y+3}Q${x+width+3} ${y+5} ${x+width} ${y+20}L${x+width-2} ${y+h-14}Q${x+width-3} ${y+h+1} ${x+width-18} ${y+h}L${tail+22} ${y+h}L${tail} ${y+h+26}L${tail-18} ${y+h-1}L${x+17} ${y+h-3}Q${x-3} ${y+h-4} ${x} ${y+h-21}L${x+1} ${y+17}Q${x} ${y} ${x+14} ${y+1}Z" fill="${sheet}" stroke="${ink}" stroke-width="2.7"/>`;
 const first=lines.length===1?y+87:y+72;
 return `<g transform="translate(${x+width/2} ${y+h/2}) scale(${pop}) translate(${-x-width/2} ${-y-h/2})">${body}${tag(CAST[speaker].name.toUpperCase(),x+24,y+28,colors[speaker])}${lines.map((s,i)=>text(s,x+width/2,first+i*43,size,ink,'hand','center')).join('')}</g>`;
}
function base(t){const chapters=['meet alibi','join','lie + vote','your questions','draw','keep playing','one winner'],index=t<5?0:t<10?1:t<19?2:t<25?3:t<36?4:t<44?5:6;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><pattern id="rules" width="1280" height="32" patternUnits="userSpaceOnUse"><path d="M0 31.5H1280" stroke="#839e96" opacity=".16"/></pattern><pattern id="grain" width="71" height="67" patternUnits="userSpaceOnUse"><circle cx="7" cy="13" r=".7" fill="#6f6650" opacity=".13"/><circle cx="47" cy="53" r=".55" fill="#6f6650" opacity=".16"/></pattern><pattern id="binding" width="14" height="23" patternUnits="userSpaceOnUse"><rect width="14" height="23" fill="${ink}"/><ellipse cx="4" cy="5" rx="1.5" ry="2.5" fill="${paper}"/><ellipse cx="10" cy="16" rx="1.6" ry="2.8" fill="${paper}"/></pattern></defs><style>.logo-face{opacity:0}</style>${rect(0,0,W,H,paper)}${rect(0,0,W,H,'url(#rules)')}${rect(0,0,W,H,'url(#grain)')}${rect(15,0,15,H,'url(#binding)')}${line(62,0,62,H,'#bd493536',1)}${asset(wordmark(),82,14,95,42)}${tag(chapters[index].toUpperCase(),205,42)}${text('EXAMPLE GAME',1204,42,12,blue,'mono','right')}${rect(62,713,1218*clamp(t/50),7,red)}`;
}
function intro(t){const e=ease(t/.6);return `<g opacity="${e}" transform="translate(0 ${(1-e)*18})">${asset(wordmark(),365,220,555,245)}${pill('2–8 players',504,475,268)}${art('star',966,260,74)}${art('flower',232,353,72)}</g>`;}
function join(t){const p=t-5,hat=p<1.4?'beanie':p<2.2?'cowboy':'frog';let inside=text('room code',142,282,19,blue)+rect(140,296,238,50,'#e9dfc8',ink,1)+text('WORM'.slice(0,Math.min(4,Math.floor(p*9)+1)),260,333,33,ink,'mono','center');
 inside+=text('Frog',185,393,31)+avatar(0,284,356,74,92,{hat})+pill(p>2.7?'joined!':'your character',145,447,232,p>2.7?'#cbd6c2':yellow);
 let s=panelPhone(121,239,276,265,inside,'YOUR PHONE');
 s+=scrap(481,244,688,258,sheet,1,text('room WORM',507,278,23,blue,'mono')+text('the whole gang',1142,278,25,ink,'hand','right'));
 for(let i=0;i<4;i++){const k=ease((p-.65-i*.45)/.4);if(k>0)s+=`<g opacity="${k}" transform="translate(0 ${(1-k)*45})">${scrap(504+i*160,305,142,169,['#dfe5d4','#efd4c4','#d5e1e3','#f1dfa9'][i],[-3,2,-2,3][i],avatar(i,530+i*160,313,93,116)+text(CAST[i].name,575+i*160,458,22,ink,'hand','center'),false)}</g>`;}
 s+=line(417,361,456,361,blue,3)+line(445,351,457,361,blue,3)+line(445,371,457,361,blue,3);return s;
}
function smiles(t){if(t<9.08||t>=10)return '';const p=(t-9.08)/.92,draw=clamp(p/.47),smile=clamp((p-.15)/.45),z=1+ease((p-.64)/.36)*9;
 let mark=wordmark().replaceAll('class="logo-letter"',`class="logo-letter" opacity="${1-clamp((p-.1)/.3)}"`).replace('class="logo-face"','class="logo-face" style="opacity:1"').replace('pathLength="1"','pathLength="1" stroke-dasharray="4000" stroke-dashoffset="'+(4000*(1-draw))+'"').replace('class="face-smile" pathLength="1"',`class="face-smile" pathLength="1" stroke-dasharray="1050" stroke-dashoffset="${1050*(1-smile)}"`);
 return `<g opacity="${clamp(p*8)}">${rect(70,234,1160,295,paper)}<g transform="translate(650 360) scale(${z}) translate(-650 -360)">${asset(mark,292,268,540,242)}</g></g>`;
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
function questions(t){const p=t-19;if(p<3){const q='What would Frog buy with a million dollars?',part=q.slice(0,Math.min(q.length,Math.floor(p*44)));return scrap(233,263,818,239,sheet,-1,tag('YOUR QUESTION / ABOUT FROG',263,301)+text(part,642,370,31,ink,'hand','center')+pill(p>1.8?'question submitted':'write your question',479,413,316,p>1.8?'#dce5d1':yellow))+clock(60,1064,263,123);}
 let s='';const roles=[['Forger','beanie'],['Detective','bucket'],['Gambler','cap']];for(let i=0;i<3;i++){const x=146+i*233,w=i===1?224:199,focus=i===1;s+=scrap(x,259,w,250,focus?'#f1dfa9':sheet,[-5,0,4][i],avatar([0,2,1][i],x+55,275,107,135,{hat:roles[i][1],glasses:focus?'monocle':'none'})+text(roles[i][0],x+w/2,448,31,ink,'hand','center')+text(focus?'remove a wrong answer':'secret ability',x+w/2,481,focus?18:19,blue,'hand','center'));}
 s+=panelPhone(924,256,234,254,tag('PRIVATE VIEW',944,300)+text('Pick the truth',1041,341,27,ink,'hand','center'));
 for(let i=0;i<3;i++){const yy=360+i*39,disabled=i===1&&p>4.2;s+=rect(945,yy,191,32,disabled?'#ded8c9':'#f0e5c7')+text(answerNames[i],1040,yy+24,21,disabled?'#898270':ink,'hand','center');if(disabled)s+=line(957,yy+20,1122,yy+10,red,2);}
 return s;
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
 if(gallery){c+=text(reveal?(i===0?'Cape knew the answer':`${CAST[artists[i]].name}’s guess`):i===2?'Frog’s drawing: cannot vote':'pick the informed drawing',x+158,502,i===2?17:20,reveal&&i===0?'#4f7345':blue,'hand','center');if(p>=9&&i===0)c+=avatar(2,x+262,287,34,43);if(p>=9.3&&i===1)c+=avatar(0,x+262,287,34,43);}
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
function ending(t){const p=t-44;let s='';if(p<3){s+=scrap(289,259,696,228,sheet,-1,text('Flower wins!',637,325,46,ink,'hand','center')+avatar(2,423,348,97,121,{hat:'crown'})+text('1',560,405,31,blue,'mono')+text('Flower',613,405,34)+text('5,500',893,405,32,ink,'mono','right')+text('highest score takes the crown',656,457,25,blue,'hand','center'));
 for(let i=0;i<22;i++){const x=130+(i*137)%1040,y=237+(i*71+p*90)%280;s+=rotate(rect(x,y,6,12,[red,blue,yellow,sage][i%4]),i*20+p*50,x,y);}
 }else{s+=asset(wordmark(),437,233,409,183)+text('alib.app',640,475,66,red,'hand','center')+text('2–8 players · Your phones · One shared screen',640,523,25,blue,'hand','center');}
 return s;
}
function pose(i,t,speaker){const life=Math.sin(t*[3.2,2.4,2,2.8][i]+i),speaking=i===speaker,p={x:xs[i],y:692,s:i===speaker?.75:.65,hip:0,crouch:Math.max(0,life)*2,bodyX:1,bodyY:1+life*.012,lean:life*1.3,head:life*2,headY:1,turn:0,look:[speaking?0:clamp((xs[speaker]-xs[i])/100,-4,4),0],blink:(t+i*.67)%4.1<.13?.12:1,expression:'smile',hands:[[67,161],[154,160]],grips:['open','open'],wrists:[-20,20],feet:[[83,208],[140,208]],hatScale:1,hatAngle:life*1.6,hatLift:0,hatHidden:false,magic:0,wand:0,wandAngle:-24,glassesAngle:0,glassesDrop:0,cape:life*9,flower:life*7};
 if(speaking){p.head+=Math.sin(t*7)*2;p.expression=Math.sin(t*15)>.2?'laugh':'smile';p.hands[1]=[164+Math.sin(t*5)*8,126+Math.cos(t*4)*9];p.wrists[1]=-25+Math.sin(t*4)*18;p.grips[1]='point';p.lean+=Math.sin(t*3)*2;}
 else p.turn=clamp((xs[speaker]-xs[i])/500,-.5,.5);
 if(t<.65){const e=ease((t-i*.065)/.45);p.y+=80*(1-e);p.bodyY=1-.12*pulse(t,i*.065,.65);p.crouch=5*pulse(t,i*.065,.65);}
 if(t<3&&i===1){p.lean+=16*pulse(t,.35,1.25);p.hatAngle+=15*pulse(t,.5,1.6);p.expression=t<1.35?'surprise':'proud';}
 if(t<2.5&&i===3){p.hands[0]=[76,40];p.head=-5;}
 if(t>=5&&t<9&&i===0){p.hands=[[75,142],[129,139]];p.grips=['grip','point'];p.look=[1,5];}
 if(t>=10&&t<14.4){p.hands=[[75,147],[133,141]];p.grips=['grip','point'];if(i!==speaker){p.look=[0,5];p.expression='focused';}}
 if(t>=17.05&&t<19){if(i===0){p.expression='confused';p.head=-9;}if(i===1){p.hands=[[48,92],[174,91]];p.lean=-5;p.expression='proud';}if(i===2&&!speaking)p.expression='skeptical';if(i===3)p.expression='proud';}
 if(t>=22&&t<25&&i===3){p.magic=1;p.hatHidden=true;p.wand=1;p.hands[0]=[61,122];p.wandAngle=-28+Math.sin(t*8)*10;}
 if(t>=25&&t<32&&i!==1){p.hands=[[73,149],[134+Math.sin(t*9)*8,143+Math.cos(t*7)*6]];p.grips=['grip','point'];if(!speaking){p.expression='focused';p.look=[0,5];}}
 if(t>=25&&t<36&&i===1){p.hands=[[66,153],[155,160]];p.expression='proud';p.head=-4;}
 if(t>=40.65&&t<42.1&&i===0){p.expression='panic';p.head=-8;p.hands=[[71,118],[152,111]];p.bodyY=1.03;}
 if(t>=42.1&&t<44&&i===0){p.expression='relieved';p.hands[1]=[162,114];p.grips[1]='fist';}
 if(t>=44&&t<47){if(i===1){const jump=pulse(t,44.05,44.7);p.y-=jump*38;p.hands= t<44.7?[[50,87],[171,83]]:[[100,147],[118,147]];p.grips=t<44.7?['open','open']:['clap','clap'];p.expression=t<44.8?'proud':'embarrassed';}if(i===2){p.y-=pulse(t,44.7,45.4)*18;p.expression='proud';}}
 if(t>=47.1&&i===3){p.wand=1;p.hands[0]=[61,116];p.wandAngle=-53;p.magic=1;p.hatHidden=true;}
 if(t>=47.35&&i===0){p.hatHidden=t<49.15;p.hatScale=t>=49.15?ease((t-49.15)/.45):1;p.hands[0]=[68,40];p.expression=t<49.15?'surprise':'relieved';p.head=-5;}
 return p;
}
function actors(t){const speaker=cue(t)[2],poses=[0,1,2,3].map(i=>pose(i,t,speaker));let customs='',under='';
 poses.forEach((p,i)=>{under+=`<ellipse cx="${p.x}" cy="697" rx="${43*p.s}" ry="4" fill="${ink}" opacity=".1"/>`;if(i===speaker)under+=`<path d="M${p.x-51} 702Q${p.x} 708 ${p.x+54} 700" stroke="${colors[i]}" stroke-width="4" fill="none" opacity=".8"/>`;
 if((t>=5&&t<9&&i===0)||(t>=10&&t<14.4)||(t>=25&&t<32&&i!==1)){const q=point(p,103,143);customs+=rotate(tinyPhone(q.x-20,q.y-27,38,58),-8,q.x,q.y);}
 if(t>=44.7&&t<47&&i===2){const q=headPoint(p,108,14);customs+=`<g transform="translate(${q.x} ${q.y-5}) scale(${p.s*.7}) translate(-108 -25)">${characterParts({...CAST[2],hat:'crown'}).hats.crown}</g>`;}
 });
 const f={actors:poses,props:{},trail:[],effects:[]};
 if(t>=47.35){const v=clamp((t-47.35)/1.8),start=headPoint(poses[0],110,22);f.props.frog={x:mix(start.x,1055,ease(v)),y:mix(start.y,477,v)-180*Math.sin(Math.PI*v),scale:.52,angle:Math.sin(v*Math.PI)*12,stretch:1+.2*Math.sin(v*Math.PI),legs:Math.sin(v*Math.PI),blink:1};}
 let svg=renderSceneSvg({width:W,height:H,stage:{x:85,y:690,width:1119,height:8}},f).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
 svg=svg.replace('<g data-hands="0"',customs+'<g data-hands="0"');
 return under+svg;
}
export function frame(t){t=clamp(t,0,49.999);const feature=t<5?intro(t):t<10?join(t):t<19?bluff(t):t<25?questions(t):t<36?finale(t):t<44?controls(t):ending(t);
 return base(t)+feature+actors(t)+bubble(t)+smiles(t)+'</svg>';
}
export function poster(){return base(0)+asset(wordmark(),365,139,555,245)+text('See how Alibi works',640,445,48,ink,'hand','center')+text('50 seconds. Four questionable guides.',640,492,26,blue,'hand','center')+actors(2.4)+pill('2–8 players',516,529,252)+'</svg>';}
