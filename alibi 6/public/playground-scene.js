// Authored, overlapping action tracks. All geometry is a pure function of visible
// time, measured menu anchors and cycle variant, so captures/replays are repeatable.
export const CAST=[
 {name:'Frog',head:'bean',hat:'frog',glasses:'none',hair:'freckles',outfit:'overalls',pose:'chill',color:'sage'},
 {name:'Cowboy',head:'square',hat:'cowboy',glasses:'none',hair:'stache',outfit:'stripes',pose:'hips',color:'tomato'},
 {name:'Flower',head:'pear',hat:'flower',glasses:'heart',hair:'none',outfit:'dress',pose:'chill',color:'denim'},
 {name:'Cape',head:'alien',hat:'party',glasses:'none',hair:'none',outfit:'cape',pose:'wave',color:'butter'},
];
export const CYCLE=48;
export const PROGRAM=[
 {name:'football',start:0,end:7,actors:[0,1]},
 {name:'paper craft',start:0,end:15.1,actors:[2]},
 {name:'wand practice',start:0,end:7,actors:[3]},
 {name:'magic',start:7,end:18.6,actors:[0,3]},
 {name:'plane',start:15.1,end:23,actors:[0,1,2]},
 {name:'pencil audition',start:18.6,end:23,actors:[3]},
 {name:'pencil',start:23,end:31.5,actors:[0,1,2,3]},
 {name:'repair',start:31.5,end:40,actors:[0,1,2]},
 {name:'solo juggling',start:32.5,end:40,actors:[3]},
 {name:'afterparty',start:40,end:48,actors:[0,1,2,3]},
];
export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,p)=>a+(b-a)*p;
const ease=p=>{p=clamp(p);return p*p*(3-2*p);};
const out=p=>1-(1-clamp(p))**3;
const rad=n=>n*Math.PI/180;
export function track(t,keys,curve=ease){if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(t<keys[i][0]){const a=keys[i-1],b=keys[i],p=curve((t-a[0])/(b[0]-a[0]));return Array.isArray(a[1])?a[1].map((v,j)=>mix(v,b[1][j],p)):mix(a[1],b[1],p);}return keys.at(-1)[1];}
const bump=(t,start,end)=>Math.sin(Math.PI*clamp((t-start)/(end-start)));
const wobble=(t,start,strength=1,decay=7)=>t<start?0:Math.sin((t-start)*24)*Math.exp(-(t-start)*decay)*strength;
const between=(t,a,b)=>t>=a&&t<b;
export function schedule(variant=0){return PROGRAM.map(e=>({...e,...(variant%2&&e.name==='pencil'?{start:31.5,end:40}:variant%2&&e.name==='repair'?{start:23,end:31.5}:variant%2&&e.name==='solo juggling'?{start:24,end:31.5}:{})}));}
export function cueAt(time){const variant=Math.floor(Math.max(time,0)/CYCLE)%2,t=((time%CYCLE)+CYCLE)%CYCLE;const active=schedule(variant).filter(e=>between(t,e.start,e.end));return {t,variant,active,name:active.map(e=>e.name).join(' + ')};}

// Body transform matches the SVG rig, while the feet remain in ground space.
export function point(p,x,y){const a=rad(p.lean),dx=(x-110)*p.bodyX,dy=(y-177)*p.bodyY;return {x:p.x+(dx*Math.cos(a)-dy*Math.sin(a)+p.hip)*p.s,y:p.y+(dx*Math.sin(a)+dy*Math.cos(a)-31+p.crouch)*p.s};}
export function headPoint(p,x,y){const a=rad(p.head),dx=(x-108)*(1-Math.abs(p.turn)*.12),dy=(y-93)*p.headY;return point(p,108+dx*Math.cos(a)-dy*Math.sin(a)+p.turn*9,93+dx*Math.sin(a)+dy*Math.cos(a));}
export function aimHand(p,side,target,grip='grip'){const a=-rad(p.lean),dx=(target.x-p.x)/p.s-p.hip,dy=(target.y-p.y)/p.s+31-p.crouch;p.hands[side]=[110+(dx*Math.cos(a)-dy*Math.sin(a))/p.bodyX,177+(dx*Math.sin(a)+dy*Math.cos(a))/p.bodyY];p.grips[side]=grip;}
const prop=(q,scale=1,angle=0,extra={})=>({x:q.x,y:q.y,scale,angle,opacity:1,...extra});
function hold(f,key,actor,hand,extra={}){const p=f.actors[actor],q=point(p,...p.hands[hand]);const slot=`${actor}:${hand}`;if(f.held[slot])throw Error(`Occupied hand ${slot}: ${key}`);f.held[slot]=key;p.grips[hand]='grip';f.props[key]=prop(q,p.s,0,{owner:actor,hand,...extra});return f.props[key];}
function flight(a,b,p,height){p=clamp(p);return {x:mix(a.x,b.x,p),y:mix(a.y,b.y,p)-4*height*p*(1-p)};}
function lookAt(p,q){const eye=headPoint(p,110,73);p.look=[clamp((q.x-eye.x)/(p.s*24),-6,6),clamp((q.y-eye.y)/(p.s*35),-5,5)];p.turn=clamp((q.x-p.x)/(p.s*350),-.75,.75);}
function spark(f,q,age,color='#bd4935'){if(age>=0&&age<.6)f.effects.push({kind:'burst',x:q.x,y:q.y,r:8+age*45,angle:age*80,opacity:1-age/.6,color});}
function caption(f,p,text,age){if(age>=0&&age<.65)f.captions.push({...headPoint(p,110,-13),text,angle:-8,opacity:1-age/.65});}

function layout(L,t,variant){
 const s=clamp((L.stage.height-7)/242,.23,.74),floor=L.stage.y+L.stage.height-5;
 const home=[.14,.35,.64,.85].map(v=>L.stage.x+L.stage.width*v),mid=L.stage.x+L.stage.width*.52;
 const pencilStart=variant?31.5:23,repairStart=variant?23:31.5;
 const repairX=clamp(L.star.x-60*s,home[0]+100*s,L.width-75*s);
 const rideX=mid+L.stage.width*.13;
 const journey=(i)=>{
  let keys=[[0,home[i]]];
  if(i===0)keys.push([7,home[0]],[9,home[0]-12*s],[15.5,home[0]-12*s],[18.2,home[0]+48*s],[22,home[0]+48*s]);
  if(i===1)keys.push([5,home[1]],[6.8,home[1]+25*s],[21,home[1]+25*s],[22.5,home[1]+10*s]);
  if(i===2)keys.push([5.1,home[2]],[5.8,home[2]-14*s],[7,home[2]],[22.5,home[2]]);
  if(i===3)keys.push([7,home[3]],[8.5,home[0]+136*s],[16,home[0]+136*s],[18.5,home[2]+120*s],[22.5,home[2]+120*s]);
  for(const [name,start] of (variant?[['repair',repairStart],['pencil',pencilStart]]:[['pencil',pencilStart],['repair',repairStart]])){
   if(name==='pencil'){
    const offset=[-145,125,260,-15][i]*s;
    keys.push([start+.9,mid+offset],[start+2,mid+offset],[start+5,rideX+offset],[start+6.3,rideX+offset],[start+8.3,home[i]+[25,20,0,-70][i]*s]);
   }else{
    const target=[repairX+20*s,repairX,home[2],home[3]-40*s][i];
    keys.push([start+1.1,target],[start+4.8,target],[start+8.3,home[i]+[35,-20,15,-25][i]*s]);
   }
  }
  keys.push([43,home[i]+[35,-20,15,-25][i]*s],[47.4,home[i]],[48,home[i]]);
  return keys.sort((a,b)=>a[0]-b[0]);
 };
 return {s,floor,home,mid,rideX,pencilStart,repairStart,journeys:[0,1,2,3].map(journey)};
}
function actor(i,G,time,t,still){
 const s=G.s*[.97,1,1.035,1.025][i],keys=G.journeys[i],x=track(t,keys),velocity=(track(t+.025,keys)-track(t-.025,keys))/.05;
 const walking=!still&&Math.abs(velocity)>1,step=walking?x/(s*47)*Math.PI:0;
 const life=still?0:Math.sin(time*[3.6,2.5,2,2.8][i]+i);
 const p={x,y:G.floor,s,hip:0,crouch:0,bodyX:1,bodyY:1,lean:0,head:0,headY:1,turn:0,look:[0,0],blink:!still&&((time+i*.71)%3.9)<.12?.08:1,expression:'smile',hands:[[67,161],[154,160]],grips:['open','open'],wrists:[-20,20],feet:[[83,208],[140,208]],hatScale:1,hatAngle:0,hatLift:0,hatHidden:false,magic:0,wand:0,wandAngle:-32,glassesAngle:0,glassesDrop:0,cape:life*8,flower:life*6,action:'minding someone else’s business'};
 p.crouch=Math.max(0,life)*[2.5,1,1,2][i];p.head=life*[2,1.5,2,3][i];p.lean=life*[1.5,1.3,.8,2][i];p.bodyY=1+life*.008;
 if(walking){
  const direction=Math.sign(velocity),amount=clamp(Math.abs(velocity)/(s*90));p.turn=direction*.65;p.lean=clamp(velocity/(s*170),-12,12);p.crouch=-Math.abs(Math.sin(step))*3;p.cape+=clamp(-velocity/(s*10),-24,24);
  for(let side=0;side<2;side++){
   const phase=((x/s*direction+side*40)%80+80)%80;
   const swing=phase>50,progress=(phase-50)/30;
   const offset=swing?mix(-25,25,ease(progress)):25-phase;
   p.feet[side]=[[85,137][side]+direction*offset*amount,208-(swing?Math.sin(Math.PI*progress)*22*amount:0)];
   p.hands[side]=[[65,155][side]+Math.cos(step+side*Math.PI)*14,153+Math.sin(step+side*Math.PI)*12];
  }
 }
 if(!still&&!walking){const g=bump((time+i*1.4)%7.2,.4,2.2);if(i===0){p.hands[0]=[mix(67,70,g),mix(161,38,g)];p.head-=g*7;p.hatAngle=g*3;}
 if(i===1){p.hands[1]=[mix(154,156,g),mix(160,38,g)];p.hatLift=g*4;p.turn=g*.3;p.expression=g>.7?'proud':'smile';}
 if(i===2){p.hands[1]=[mix(154,149,g),mix(160,77,g)];p.glassesAngle=life*1.5;p.expression=g>.4?'skeptical':'smile';}
 if(i===3){p.hands[0]=[mix(67,53,g),mix(161,124,g)];p.lean+=g*6;p.cape+=g*13;}}
 return p;
}

function paperCraft(f,G,t){const p=f.actors[2];p.action='folding a plane';p.lean=-5;p.crouch=6;p.expression='focused';p.turn=-.2;
 // The two crease passes pause while she catches, tries on and returns the hat.
 const progress=t<3?t/3:t<6.8?1:1+(t-6.8)/8.3*3;
 p.hands=[[90+Math.sin(t*5)*5,164],[135-Math.sin(t*5)*5,164]];p.grips=['press','press'];p.head=6+Math.sin(t*3)*2;
 const q=point(p,110,167);f.props.paper=prop(q,p.s*1.15,Math.sin(t)*2,{fold:clamp(progress,0,3.9)});
 if(t>6.8){p.hands[0][0]=90+Math.sin(t*8)*9;p.hands[1][0]=133-Math.sin(t*8)*9;}
 if(t>14.2){const k=ease((t-14.2)/.9);p.hands[1]=[133,mix(164,150,k)];const held=point(p,133,150);f.props.paper.x=mix(q.x,held.x,k);f.props.paper.y=mix(q.y,held.y,k);f.props.paper.scale=p.s*mix(1.15,.95,k);p.lean=mix(-5,-6,k);} 
}
function practice(f,G,t,v){const p=f.actors[3];p.action='practicing a very questionable trick';p.turn=-.35;p.expression='focused';
 p.hands=[[72,146],[135,152]];p.head=track(t,[[0,2],[1,-6],[2,10],[2.2,-10],[3,2],[5,0],[6.2,-9],[7,0]]);p.lean=track(t,[[0,0],[.6,9],[1.5,-6],[2,0],[4.2,11],[5.1,0],[7,0]]);
 p.hands[0]=track(t,[[0,[76,150]],[.5,[105,172]],[1.2,[55,123]],[2.2,[55,123]],[2.8,[112,170]],[4.2,[56,104]],[5.2,[70,150]],[7,[70,150]]]);
 if(between(t,1.2,2.8))hold(f,'receipt',3,0,{variant:v});
 if(between(t,4.2,5.2)){p.wand=1;p.wandAngle=-15+Math.sin(t*12)*15;p.expression='surprise';}
 if(between(t,2.75,3.8)){p.expression='laugh';p.hands[1]=[158,102];p.head=-8;}
}
function football(f,L,G,t,v){const [a,b,c,d]=f.actors;a.action='throwing';b.action='very confident about catching';
 a.hands[1]=track(t,[[0,[155,147]],[.5,[160,185]],[1,[155,147]],[1.55,[156,125]],[1.95,[52,74]],[2.17,[182,110]],[2.6,[174,132]],[3,[156,159]],[7,[156,159]]]);
 a.lean=track(t,[[0,0],[1.5,-4],[1.95,-19],[2.2,16],[2.5,10],[3,0]]);a.crouch=track(t,[[0,0],[1.95,11],[2.17,-4],[2.5,8],[3,0]]);a.expression=t<2.2?'focused':t<3.3?'surprise':'guilty';a.turn=.6;
 b.hands=[[61,113],[166,103]];b.turn=-.5;b.expression=t<2.5?'proud':'surprise';
 if(t<2.05){b.hands[1]=[153,35];b.hatLift=bump(t,.8,2)*10;}
 b.lean=track(t,[[0,0],[2.63,0],[2.71,16],[2.84,-7],[3.05,7],[3.45,0]]);b.head=track(t,[[0,-3],[2.63,-3],[2.71,17],[2.9,-9],[3.3,4],[4,0]]);
 b.bodyX=1+bump(t,2.65,3)*.12;b.bodyY=1-bump(t,2.65,3)*.12;b.hatAngle=wobble(t,2.67,24);
 b.hatHidden=between(t,2.67,6.45);b.hatAngle+=track(t,[[0,0],[6.44,0],[6.45,v?-27:155],[6.7,v?-27:155],[7,0]]);
 if(t>3.3){b.hands[0]=[71,65];b.hands[1]=t>6.45?[153,35]:[150,160];b.expression=t>5.5?'guilty':'dizzy';}
 const hit=headPoint(b,97,63),star=L.star;
 if(t<1){const q=point(a,...a.hands[1]);const down=bump(t,.05,.94);f.props.ball=prop({x:q.x+down*5*G.s,y:mix(q.y,G.floor-18*G.s,down)},G.s,20+t*80);}
 else if(t<2.17)hold(f,'ball',0,1,{angle:-35});
 else if(t<2.67){const launch=point(a,182,110),q=flight(launch,hit,(t-2.17)/.5,22*G.s);f.props.ball=prop(q,G.s,t*660);}
 else if(t<4.15){f.props.ball=prop(flight(hit,star,(t-2.67)/1.48,L.mobile?20:62),G.s,t*700);}
 else if(t<5.25)f.props.ball=prop(flight(star,{x:L.width+45,y:G.floor},(t-4.15)/1.1,25),G.s,t*750);
 if(t>=2.67&&t<6.45){const origin=headPoint(b,108,25);let q;
  c.hands[0]=track(t,[[2.67,[82,158]],[3.35,[62,69]],[3.65,[62,55]],[4.2,[94,0]],[4.8,[94,0]],[5.2,[57,99]],[5.8,[57,99]],[6.45,[85,160]]]);c.grips[0]='grip';c.head=t>3.7&&t<5?-7:0;c.expression=t>3.7&&t<5?'proud':'flat';
  if(t<3.5)q=flight(origin,point(c,...c.hands[0]),(t-2.67)/.83,100*G.s);
  else if(t<5.8)q=point(c,...c.hands[0]);
  else q=flight(point(c,57,99),headPoint(b,108,27),(t-5.8)/.65,70*G.s);
  f.props.hat=prop(q,b.s,t<3.5?(t-2.67)*400:t>5.8?(t-5.8)*240:v?-12:8);
  if(t>=3.5&&t<5.8)f.held['2:0']='hat';
 }
 if(between(t,2.67,3.15)){spark(f,hit,t-2.67);caption(f,b,'bonk.',t-2.67);}
 if(t>4.15)spark(f,star,t-4.15,'#e5b747');
 if(t>2.7&&t<4){d.expression='laugh';d.hands[1]=[175,70];d.head=-8;d.y-=Math.abs(Math.sin((t-2.7)*11))*13*G.s;}
 lookAt(a,t<2.67?hit:f.props.ball||hit);lookAt(b,t<2.67?f.props.ball||a:headPoint(c,110,40));
}
function magic(f,L,G,u){const t=u-7,[a,b,c,d]=f.actors;a.action='protecting a suspicious hat';d.action='performing';
 d.magic=track(t,[[0,0],[1.2,0],[1.48,.2],[1.75,1.18],[2,1],[9.8,1],[10.6,0]]);d.hatHidden=d.magic>.02;d.wand=t>1.55&&t<10.2?1:0;
 d.hands[0]=track(t,[[0,[70,159]],[.5,[114,174]],[1.1,[48,128]],[1.55,[48,128]],[1.8,[106,169]],[2.15,[41,75]],[2.5,[49,98]],[2.9,[37,76]],[6,[37,76]],[7,[58,138]],[8.5,[74,162]],[11.6,[70,159]]]);
 d.hands[1]=track(t,[[0,[153,160]],[2,[162,103]],[2.5,[178,85]],[4,[162,111]],[8,[164,100]],[9.3,[163,155]],[10.6,[153,160]]]);
 d.wandAngle=track(t,[[0,-32],[2,-8],[2.5,-49],[2.75,-19],[2.98,-43],[4,-36],[8,-30]]);
 d.lean=track(t,[[0,0],[.8,12],[1.5,-3],[2.8,-8],[3.15,9],[4,0],[8.2,0],[8.65,29],[9.4,29],[10,0]]);
 d.head=track(t,[[0,0],[1.3,12],[1.6,-10],[2.4,-7],[3,4],[8.5,12],[9.3,-13],[10.2,0]]);d.expression=t<1.8?'confused':t<7.7?'focused':'proud';d.turn=-.65;
 if(between(t,1.1,1.7))hold(f,'receipt',3,0,{variant:1});
 a.hands=[[69,44],[151,43]];a.grips=['open','open'];a.expression=t<3?'skeptical':t<8.2?'panic':'relieved';
 a.head=track(t,[[0,0],[1,-9],[2,4],[2.3,4],[2.42,-14],[2.65,-14],[3,6],[4,0],[5,12],[6,-10],[7,0],[9,0]]);
 a.look=[0,-5];a.turn=track(t,[[0,.2],[1,.65],[2.3,.65],[2.5,0],[4,0],[5.4,-.4],[7,.35],[9,0]]);
 a.hands[1]=track(t,[[0,[151,43]],[2.55,[151,43]],[2.85,[171,134]],[5.5,[171,134]],[6,[144,34]],[7.4,[144,34]],[8.5,[151,42]],[10,[145,154]]]);
 a.hands[0]=track(t,[[0,[69,44]],[2.55,[69,44]],[2.9,[50,130]],[5.3,[50,130]],[5.8,[82,32]],[6.8,[82,32]],[7.8,[69,44]],[10,[71,156]]]);
 a.hatHidden=between(t,3.3,7.65);a.hatScale=track(t,[[0,1],[7.64,1],[7.65,.04],[7.95,.24],[8.3,.55],[8.55,1.2],[8.75,.94],[9,1]]);
 a.hatLift=track(t,[[0,0],[2.7,0],[2.9,5],[3.15,10],[3.3,12],[3.31,0]]);a.crouch+=bump(t,3.2,3.65)*10;a.hatAngle=wobble(t,8.55,12);
 if(between(t,2.3,2.48))f.props.hatBlink=prop(headPoint(a,110,27),a.s);
 if(between(t,2.9,3.3))f.props.frogFeet=prop(headPoint(a,110,27),a.s,0,{legs:clamp((t-2.9)/.4)});
 const origin=headPoint(a,110,17),cowHat=headPoint(b,108,7),ledge={x:L.sheet.x+L.sheet.width*.88,y:L.sheet.y+L.sheet.height+5*G.s};
 if(between(t,3.05,3.65))spark(f,origin,t-3.05,'#4d7c9d');
 if(between(t,3.3,7.35)){let q,legs=.1,stretch=1;
  if(t<3.87){const p=(t-3.3)/.57;q=flight(origin,cowHat,p,93*G.s);legs=Math.sin(Math.PI*p);stretch=1+Math.sin(Math.PI*p)*.2;}
  else if(t<4.65){q=cowHat;legs=bump(t,4.32,4.65);stretch=1-bump(t,3.87,4.16)*.22;}
  else if(t<5.4){const p=(t-4.65)/.75;q=flight(cowHat,ledge,p,L.mobile?45:110);legs=Math.sin(Math.PI*p);stretch=1+Math.sin(Math.PI*p)*.16;}
  else if(t<6.05){q=ledge;legs=.2;stretch=1-bump(t,5.4,5.7)*.2;}
  else{const p=(t-6.05)/1.3;q=flight(ledge,{x:5,y:G.floor},p,L.mobile?45:100);legs=Math.sin(Math.PI*p);}
  f.props.frog=prop(q,a.s,0,{legs,stretch,blink:(t%1.1)<.11?.1:1,...(between(t,3.87,4.65)?{attachment:{actor:1,part:'head',at:[108,7]}}:{})});
 }
 if(between(t,3.8,5.1)){b.hatAngle=wobble(t,3.87,17);b.crouch+=bump(t,3.87,4.2)*9;b.expression='panic';b.look=[0,-6];b.hands[1]=[172,118];b.grips[1]='point';b.turn=0;b.head=-4;}
 if(t>5.1&&t<7.4){b.head=Math.sin(t*12)*6;b.hands[0]=[62,39];b.look=[0,-5];b.expression='confused';}
 if(t>8.2&&t<10){const clap=(Math.sin(t*25)+1)/2;c.hands=[[96+clap*13,133],[126-clap*12,133]];c.grips=['clap','clap'];c.expression='laugh';c.head=-5;}
 if(f.props.frog){lookAt(b,f.props.frog);if(t<5.3)lookAt(c,f.props.frog);}
}
function planePosition(L,G,actors,t,v){
 const [a,b,c]=actors,launch=point(c,174,105),hit=headPoint(b,108,70),end=point(a,165,126),r=L.logo;
 // Cubic Bezier segments meet with continuous velocity; the paper banks through corners.
 const upper=v?.27:.43;
 const nodes=[launch,{x:r.x+r.width*.1,y:r.y+r.height*.72},{x:r.x+r.width*.72,y:r.y+r.height*upper},{x:Math.min(L.width-14,L.sheet.x+L.sheet.width+17),y:L.sheet.y+10},{x:Math.min(L.width-14,L.sheet.x+L.sheet.width+21),y:L.sheet.y+L.sheet.height*.88},hit,end];
 const times=[15.45,16.45,17.5,18.6,19.6,20.55,21.3];
 if(t<=times[0])return nodes[0];if(t>=times.at(-1))return nodes.at(-1);
 let i=0;while(times[i+1]<t)i++;const u=(t-times[i])/(times[i+1]-times[i]),p0=nodes[Math.max(0,i-1)],p1=nodes[i],p2=nodes[i+1],p3=nodes[Math.min(nodes.length-1,i+2)];
 const q={};for(const k of ['x','y'])q[k]=.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u);q.x=clamp(q.x,10,L.width-10);return q;
}
function plane(f,L,G,t,v){const [a,b,c]=f.actors;c.action='launching and judging';c.expression=t>21?'flat':'focused';
 c.hands[1]=track(t,[[15.1,[133,150]],[15.32,[129,91]],[15.45,[174,105]],[15.7,[182,116]],[16,[149,160]]]);c.grips[1]='grip';c.lean=track(t,[[15.1,-6],[15.32,-11],[15.5,10],[16,0]]);
 a.hands[1]=track(t,[[15.1,[149,160]],[20.8,[149,160]],[21.3,[165,126]],[22.1,[166,72]],[22.8,[150,147]]]);
 b.crouch=track(t,[[15.1,0],[18.2,0],[18.4,41],[19.1,41],[19.4,0],[20.54,0],[20.65,11],[20.9,0]]);b.bodyX=1+b.crouch/500;b.hands=t<19.4?[[76,57],[148,53]]:[[72,155],[151,156]];b.expression=t<20.55?'worried':'dizzy';b.head+=wobble(t,20.55,22);b.hatAngle=wobble(t,20.55,25);
 if(t<15.45){hold(f,'plane',2,1,{scale:G.s*.95,angle:-18});}
 else if(t<21.3){const q=planePosition(L,G,f.actors,t,v),next=planePosition(L,G,f.actors,t+.018,v),angle=Math.atan2(next.y-q.y,next.x-q.x)*180/Math.PI;f.props.plane=prop(q,G.s*.95,angle,{bank:Math.sin(t*7)*8});f.backPlane=between(t,16,17.9);for(let age=.05;age<.7;age+=.065){const x=planePosition(L,G,f.actors,t-age,v);f.trail.push({...x,opacity:(1-age/.7)*.36});}lookAt(a,q);lookAt(b,q);lookAt(c,q);}
 else{hold(f,'plane',0,1,{angle:-25,scale:G.s*.95});a.expression='proud';a.lean=-8;a.head=-6;c.head=-9;lookAt(c,headPoint(a,110,70));f.props.plane.opacity=1-clamp((t-22.4)/.6);}
 if(t>20.55){spark(f,headPoint(b,110,70),t-20.55,'#4d7c9d');caption(f,b,'again?',t-20.55);}
}
function audition(f,L,G,t){const p=f.actors[3],u=t-18.6;p.action='failing to lift the pencil';
 const reach=track(u,[[0,0],[.65,1],[3.35,1],[4.4,0]]),anchor={x:Math.min(L.width-54*p.s,L.pencil.x-43*p.s),y:Math.min(G.floor,L.pencil.y+95*p.s)};
 p.x=mix(p.x,anchor.x,reach);p.y=mix(p.y,anchor.y,reach);p.expression=u<2.5?'strained':'guilty';p.crouch=12+Math.abs(Math.sin(u*7))*4;p.lean=-12;p.head=10;
 const q={x:L.pencil.x+Math.sin(u*16)*1.5*reach,y:L.pencil.y-Math.max(0,Math.sin(u*4))*2*reach};
 f.props.pencil=prop(q,G.s*.72,-38);f.pencilAway=true;
 if(reach>.8){aimHand(p,0,{x:q.x-34*G.s,y:q.y+25*G.s});aimHand(p,1,{x:q.x-8*G.s,y:q.y+7*G.s});f.held['3:0']='pencil';f.held['3:1']='pencil';p.feet=[[76,204],[142,190]];}
 if(u>2.5){p.hands[0]=[52,112];p.grips[0]='point';delete f.held['3:0'];p.head=-8;p.turn=-.6;p.expression='pleading';}
}
function pencil(f,L,G,t,start){const u=t-start,[a,b,c,d]=f.actors,center=(a.x+b.x)/2;
 const y=G.floor-track(u,[[0,0],[.4,0],[1,18],[1.5,28],[7,28],[8.4,0]])*G.s;
 const angle=track(u,[[0,-38],[.6,-9],[1.1,8],[1.5,0],[4.9,0],[5.02,-4],[5.2,2],[5.5,0],[7,0],[8.3,-38]]);
 let q={x:center,y};if(u<.6)q=flight(L.pencil,q,out(u/.6),20);if(u>7)q=flight(q,L.pencil,ease((u-7)/1.4),40);
 const pen=prop(q,G.s,angle);f.props.pencil=pen;f.pencilAway=u<8.4;
 const contact=(x)=>({x:q.x+x*G.s*Math.cos(rad(angle)),y:q.y+x*G.s*Math.sin(rad(angle))});
 a.action='carrying the pencil';b.action='carrying the pencil';d.action='surfing then regretting it';
 
 a.expression=u<1.5?'strained':u<5?'smile':'surprise';b.expression=u<5?'focused':'surprise';a.crouch+=bump(u,.1,1.4)*13;b.crouch+=bump(u,.3,1.5)*16;
 if(u>.6&&u<7){aimHand(a,1,contact(-85));aimHand(b,0,contact(83));f.held['0:1']='pencil';f.held['1:0']='pencil';}
 d.y-=track(u,[[0,0],[.7,0],[1.1,44],[1.5,37],[4.9,37],[5.15,28],[6.6,28],[7.2,0]])*G.s;
 d.hands=[[43,99],[181,93]];d.lean=track(u,[[0,0],[1.1,-16],[1.5,7],[2,0],[4.9,-7],[5.05,18],[5.3,61],[6.25,61],[7,0]]);d.turn=.5;d.expression=u<5?'proud':'panic';d.cape=clamp(-25+Math.sin(u*13)*10,-35,35);
 d.x+=track(u,[[0,0],[4.98,0],[5.22,60*G.s],[6.5,60*G.s],[7.3,0]]);d.hatAngle=wobble(u,5,22);
 d.y+=track(u,[[0,0],[5.05,0],[5.3,48*G.s],[6.5,48*G.s],[7.1,0]]);
 if(u>5.25&&u<6.6){d.feet=[[85,166],[137,175]];aimHand(d,0,contact(-10));aimHand(d,1,contact(36));d.expression='embarrassed';d.head=-13;}
 if(u>4.2&&u<6.3){aimHand(c,0,contact(134),'point');c.expression='flat';c.head=-6;}
 if(u>4.98){spark(f,contact(134),u-4.98);caption(f,c,'nope.',u-4.98);}
 if(u>7){d.hands=[[75,151],[147,149]];d.expression='guilty';}
}
function repair(f,L,G,t,start){const u=t-start,[a,b,c,d]=f.actors;a.action='climbing to fix the star';b.action='providing questionable support';
 const climb=track(u,[[0,0],[.7,0],[2.1,1],[3.5,1],[4.5,0],[8.5,0]]);
 const reach={x:L.star.x-41*a.s,y:L.star.y+190*a.s};
 a.x=mix(a.x,reach.x,climb);a.y=mix(a.y,reach.y,climb);a.hands=[[72,145],[151,18]];a.grips[1]='press';a.lean=0;a.turn=.4;a.crouch=0;
 b.x=mix(b.x,L.sheet.x+L.sheet.width-30*b.s,climb);b.y=mix(b.y,reach.y+178*b.s,climb);b.lean=Math.sin(u*19)*climb*3;b.crouch=0;b.hands=climb>0?[[87,24],[151,31]]:[[78,160],[145,160]];b.expression='strained';b.head=-5;
 a.feet=climb>0?[[85,208],[140,208]]:a.feet;
 f.starTilt=track(u,[[0,19],[2.35,19],[2.55,-27],[5.5,-27],[5.68,4],[5.9,0]]);
 if(u>3.9){a.expression='skeptical';b.expression='skeptical';a.hands=[[58,122],[163,116]];b.hands=[[51,115],[169,125]];a.grips[1]='point';b.grips[0]='point';a.head=-10;b.head=9;}
 const hop=track(u,[[0,0],[4.6,0],[5.35,1],[5.85,1],[6.5,0],[8.5,0]]);
 c.x=mix(c.x,L.star.x-22*c.s,hop);c.y=mix(c.y,L.star.y+201*c.s,hop);c.lean=0;c.crouch=0;c.hands[1]=hop?[132,7]:[149,160];c.grips[1]='press';c.expression='flat';c.head=-4;c.glassesAngle=wobble(u,6.5,4);
 if(u>6.1){a.look=[4,-4];b.look=[4,-4];a.expression='confused';b.expression='confused';}
 // Cape makes a small bow in the clear bottom area while the others climb.
 d.hands[1]=[161,131];
}
function juggling(f,G,t,start){const p=f.actors[3],u=t-start;p.action='juggling one ball with excessive confidence';p.expression=u<5?'focused':'proud';p.turn=-.3;
 const phase=u%1.4,side=Math.floor(u/1.4)%2;p.hands=[[67,139],[160,138]];p.hands[side][1]-=bump(phase,0,.22)*18;
 const from=point(p,...p.hands[side]),to=point(p,...p.hands[1-side]);const q=flight(from,to,phase/1.4,80*G.s);f.props.ball=prop(q,G.s*.85,u*300);lookAt(p,q);p.cape=Math.sin(u*4)*9;
}
function afterparty(f,G,t,v){const u=t-40,[a,b,c,d]=f.actors;
 a.action='imitating the frog';a.crouch=bump(u,.2,1)*18;a.y-=bump(u,1,1.8)*23*G.s;a.hands=[[60,137],[160,134]];a.expression='proud';a.hatAngle=wobble(u,1.8,12);
 b.action='checking that nobody saw';b.hands[0]=[70,62];b.head=Math.sin(u*3)*7;b.turn=Math.sin(u*2)*.65;b.expression='guilty';
 c.action='making a paper moustache';c.hands=[[84,139],[135,138]];c.expression='smile';c.glassesAngle=Math.sin(u*3)*2;
 const q=point(c,110,142);f.props.paper=prop(q,c.s,Math.sin(u)*5,{fold:3.2});
 d.action='untangling a cape';d.hands=[[64,161],[132,173]];d.lean=bump(u,.7,3.5)*12;d.expression=u<3?'strained':'proud';d.cape=Math.sin(u*9)*18;
 if(u>3.4&&u<5.4){c.hands[1]=[138,88];hold(f,'moustache',2,1);c.expression='proud';b.expression='skeptical';lookAt(b,headPoint(c,110,90));}
 if(u>6.3){for(const p of f.actors){const k=ease((u-6.3)/1.7);p.lean*=1-k;p.turn*=1-k;p.head*=1-k;p.hands=p.hands.map((h,i)=>h.map((n,j)=>mix(n,[[67,161],[154,160]][i][j],k)));}f.props.paper.opacity=1-clamp((u-6.3)/1.7);}
}
export function sceneFrame(L,time,{quiet=false,still=false,life=time}={}){
 const cue=cueAt(time),{t,variant}=cue,G=layout(L,t,variant);
 const f={name:cue.name,t,variant,active:quiet||still?[]:cue.active.map(e=>e.name),actors:[],props:{},held:{},trail:[],backPlane:false,starTilt:t>=4.15&&t<G.repairStart+5.9?19:0,pencilAway:false,captions:[],effects:[]};
 for(let i=0;i<4;i++)f.actors.push(actor(i,G,life,t,still));
 if(quiet||still){
  f.actors.forEach((p,i)=>{
   const breathe=still?0:Math.sin(life*2+i),gesture=still?0:bump((life+i*1.1)%6,.5,2.2);
   p.y=G.floor;p.action='quiet';p.feet=[[83,208],[140,208]];p.hands=[[67,161],[154,160]];p.lean=breathe;p.crouch=Math.max(0,breathe);p.head=breathe*2;p.bodyY=1+breathe*.005;p.turn=0;
   if(i===0)p.hands[0]=[mix(67,70,gesture),mix(161,38,gesture)];
   if(i===1){p.hands[1]=[mix(154,156,gesture),mix(160,38,gesture)];p.hatLift=gesture*3;}
   if(i===2){p.hands[1]=[mix(154,145,gesture),mix(160,75,gesture)];p.glassesAngle=breathe;}
   if(i===3){p.hands[0]=[mix(67,52,gesture),mix(161,137,gesture)];p.cape=breathe*4;}
   if(still){p.head=p.lean=p.crouch=p.cape=p.flower=0;p.bodyY=1;}
  });f.starTilt=0;return f;
 }
 if(t<15.1)paperCraft(f,G,t);
 if(t<7)practice(f,G,t,variant);
 if(t<7)football(f,L,G,t,variant);
 if(between(t,7,18.6))magic(f,L,G,t);
 if(between(t,15.1,23))plane(f,L,G,t,variant);
 if(between(t,18.6,23))audition(f,L,G,t);
 if(between(t,G.pencilStart,G.pencilStart+8.5))pencil(f,L,G,t,G.pencilStart);
 if(between(t,G.repairStart,G.repairStart+8.5))repair(f,L,G,t,G.repairStart);
 if(between(t,G.repairStart+1,G.repairStart+8.5))juggling(f,G,t,G.repairStart+1);
 if(t>=40)afterparty(f,G,t,variant);
 // Accessory follow-through is additive, so actors keep breathing and reacting
 // even when a story owns their arms or position.
 f.actors.forEach((p,i)=>{p.hatAngle+=Math.sin(life*4.3+i)*.6;p.flower+=-p.head*.5;p.glassesAngle+=-p.head*.035;});
 for(const prop of Object.values(f.props)){if(prop.owner!==undefined)Object.assign(prop,point(f.actors[prop.owner],...f.actors[prop.owner].hands[prop.hand]));if(prop.attachment)Object.assign(prop,headPoint(f.actors[prop.attachment.actor],...prop.attachment.at));}
 return f;
}
