import {randomInt} from 'node:crypto';

// Local computer artists use slightly uneven pen strokes. Geometry is plain
// drawing data, never markup or executable code. Unknown answers return null.
function pen(){
 const strokes=[];
 const color=['#202031','#202031','#7655ed'][randomInt(3)];
 const wobble=()=> (Math.random()-.5)*.008;
 const line=(...points)=>{const sampled=[];for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];const steps=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*24));for(let j=0;j<steps;j++)sampled.push([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]);}sampled.push(points.at(-1));strokes.push({color,size:3+randomInt(3),points:sampled.map(p=>p.map(n=>Math.max(.01,Math.min(.99,n+wobble()))))});};
 const rect=(x,y,w,h)=>line([x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]);
 const oval=(x,y,rx,ry)=>line(...Array.from({length:29},(_,i)=>[x+Math.cos(i/28*Math.PI*2)*rx,y+Math.sin(i/28*Math.PI*2)*ry]));
 return {strokes,line,rect,oval};
}
const ART = {
 house:p=>{p.line([.18,.45],[.5,.15],[.82,.45]);p.rect(.24,.43,.52,.4);p.rect(.44,.61,.14,.22);p.rect(.31,.51,.09,.09);p.rect(.62,.51,.08,.1);},
 bed:p=>{p.rect(.2,.43,.62,.26);p.rect(.21,.4,.16,.16);p.line([.2,.3],[.2,.84]);p.line([.82,.43],[.82,.84]);p.line([.38,.44],[.38,.68]);},
 sofa:p=>{p.rect(.23,.36,.54,.32);p.rect(.14,.48,.12,.26);p.rect(.75,.48,.12,.26);p.line([.26,.61],[.75,.61]);p.line([.5,.37],[.5,.66]);p.line([.23,.74],[.23,.82]);p.line([.77,.74],[.77,.82]);},
 car:p=>{p.line([.14,.65],[.14,.49],[.3,.43],[.4,.25],[.66,.25],[.78,.45],[.88,.49],[.88,.65],[.14,.65]);p.oval(.31,.67,.08,.1);p.oval(.72,.67,.08,.1);p.line([.4,.29],[.36,.44],[.69,.44],[.63,.29]);p.line([.52,.29],[.52,.44]);},
 beach:p=>{p.line([.12,.72],[.3,.66],[.45,.72],[.62,.66],[.85,.72]);p.line([.12,.83],[.3,.77],[.48,.83],[.65,.77],[.89,.83]);p.oval(.78,.2,.09,.11);p.line([.24,.63],[.27,.29]);p.line([.11,.29],[.42,.29],[.27,.12],[.11,.29]);},
 tree:p=>{p.rect(.44,.52,.12,.31);p.oval(.5,.35,.23,.25);p.line([.25,.85],[.78,.85]);},
 book:p=>{p.line([.49,.28],[.22,.2],[.18,.72],[.49,.8],[.81,.72],[.77,.2],[.49,.28],[.49,.8]);p.line([.26,.34],[.41,.38]);p.line([.59,.37],[.72,.33]);},
 library:p=>{ART.house(p);p.rect(.31,.47,.4,.12);p.line([.35,.48],[.35,.58]);p.line([.42,.48],[.42,.58]);p.line([.5,.48],[.5,.58]);p.line([.61,.48],[.61,.58]);},
 phone:p=>{p.rect(.34,.15,.32,.7);p.rect(.37,.23,.26,.48);p.oval(.5,.77,.025,.025);p.line([.45,.19],[.55,.19]);},
 guitar:p=>{p.oval(.43,.68,.18,.21);p.oval(.47,.49,.12,.13);p.rect(.49,.13,.065,.4);p.rect(.475,.08,.095,.12);p.oval(.46,.61,.065,.08);p.line([.52,.17],[.45,.78]);},
 wallet:p=>{p.rect(.19,.31,.6,.4);p.rect(.53,.44,.3,.16);p.oval(.66,.52,.025,.025);p.line([.23,.38],[.71,.38]);p.rect(.29,.24,.29,.07);},
 chain:p=>{for(let i=0;i<12;i++){const a=i/12*Math.PI*2;p.oval(.5+Math.cos(a)*.24,.43+Math.sin(a)*.25,.045,.055);}p.line([.5,.68],[.42,.81],[.5,.91],[.58,.81],[.5,.68]);},
 laptop:p=>{p.rect(.25,.2,.5,.39);p.line([.25,.59],[.14,.79],[.86,.79],[.75,.59]);p.line([.32,.68],[.69,.68]);p.rect(.44,.7,.12,.05);},
 toilet:p=>{p.rect(.3,.19,.36,.24);p.oval(.5,.51,.25,.1);p.line([.27,.54],[.38,.69],[.4,.83],[.65,.83],[.6,.67],[.73,.55]);p.line([.54,.25],[.61,.25]);},
 fridge:p=>{p.rect(.29,.12,.43,.76);p.line([.29,.38],[.72,.38]);p.line([.35,.23],[.35,.31]);p.line([.35,.47],[.35,.61]);},
 sandwich:p=>{p.line([.16,.38],[.66,.25],[.87,.53],[.36,.66],[.16,.38]);p.line([.16,.5],[.36,.78],[.87,.65]);p.line([.25,.5],[.32,.52],[.38,.6],[.49,.55],[.59,.59],[.71,.5]);},
 pizza:p=>{p.line([.25,.22],[.8,.32],[.47,.85],[.25,.22]);p.line([.26,.3],[.75,.4]);p.oval(.41,.41,.05,.05);p.oval(.58,.51,.045,.05);p.oval(.48,.67,.04,.05);},
 taco:p=>{p.line([.18,.71],[.23,.46],[.37,.29],[.56,.25],[.73,.4],[.85,.7],[.18,.71]);p.line([.23,.58],[.32,.54],[.41,.59],[.5,.51],[.61,.59],[.73,.54]);},
 burger:p=>{p.line([.19,.43],[.24,.28],[.4,.2],[.63,.23],[.79,.4],[.19,.43]);p.rect(.19,.5,.6,.09);p.line([.19,.67],[.3,.78],[.68,.78],[.8,.64],[.19,.67]);p.line([.26,.44],[.45,.6],[.62,.44]);},
 icecream:p=>{p.line([.34,.43],[.53,.9],[.71,.43]);p.oval(.5,.34,.21,.2);p.line([.4,.52],[.6,.64]);p.line([.58,.51],[.45,.69]);},
 coffee:p=>{p.rect(.29,.36,.36,.39);p.oval(.7,.51,.09,.13);p.line([.38,.27],[.34,.19],[.39,.1]);p.line([.52,.27],[.56,.18],[.52,.09]);},
 banana:p=>{p.line([.25,.2],[.27,.47],[.48,.68],[.71,.66],[.83,.49],[.65,.77],[.42,.83],[.22,.65],[.16,.37],[.25,.2]);},
 potato:p=>{p.oval(.5,.51,.24,.29);p.oval(.42,.38,.015,.018);p.oval(.58,.61,.02,.02);p.line([.39,.64],[.43,.66]);p.line([.6,.34],[.63,.38]);},
 duck:p=>{p.oval(.47,.64,.25,.15);p.oval(.68,.4,.095,.14);p.line([.73,.36],[.87,.42],[.73,.46]);p.oval(.69,.37,.012,.016);p.line([.25,.6],[.14,.49],[.24,.73]);p.line([.45,.79],[.42,.9]);},
 cat:p=>{p.oval(.48,.55,.22,.25);p.line([.29,.4],[.27,.2],[.43,.32]);p.line([.58,.32],[.7,.19],[.68,.43]);p.oval(.4,.47,.018,.025);p.oval(.56,.47,.018,.025);p.line([.48,.55],[.43,.61],[.52,.61],[.48,.55]);p.line([.25,.56],[.13,.51]);p.line([.66,.55],[.84,.51]);p.line([.64,.74],[.78,.82],[.85,.69]);},
 dog:p=>{p.oval(.49,.53,.22,.24);p.oval(.28,.45,.09,.23);p.oval(.7,.45,.09,.23);p.oval(.41,.45,.018,.02);p.oval(.57,.45,.018,.02);p.oval(.49,.61,.08,.06);p.line([.46,.72],[.47,.84],[.54,.84],[.55,.72]);},
 bear:p=>{p.oval(.5,.52,.25,.29);p.oval(.3,.25,.09,.1);p.oval(.71,.25,.09,.1);p.oval(.4,.45,.02,.02);p.oval(.6,.45,.02,.02);p.oval(.5,.61,.09,.07);},
 spider:p=>{p.oval(.5,.5,.15,.18);for(const y of [.36,.45,.55,.65]){p.line([.39,y],[.23,y-.08],[.1,y+.09]);p.line([.61,y],[.78,y-.08],[.89,y+.09]);}},
 chair:p=>{p.rect(.31,.2,.38,.28);p.line([.31,.48],[.23,.65],[.72,.65],[.69,.48]);p.line([.26,.65],[.25,.85]);p.line([.67,.65],[.71,.85]);},
 crown:p=>{p.line([.2,.67],[.12,.28],[.36,.46],[.5,.15],[.65,.46],[.88,.28],[.8,.67],[.2,.67]);p.rect(.21,.68,.58,.13);},
 shoe:p=>{p.line([.28,.25],[.44,.28],[.5,.51],[.8,.58],[.9,.72],[.14,.72],[.18,.42],[.28,.25]);p.line([.44,.46],[.36,.53]);p.line([.5,.52],[.42,.59]);},
 umbrella:p=>{p.line([.15,.41],[.26,.19],[.5,.09],[.77,.2],[.86,.41],[.15,.41]);p.line([.5,.11],[.5,.8],[.44,.89],[.36,.82]);},
 cone:p=>{p.line([.49,.15],[.24,.78],[.76,.78],[.49,.15]);p.line([.39,.41],[.6,.41]);p.line([.31,.61],[.69,.61]);p.rect(.16,.79,.67,.07);},
 toothbrush:p=>{p.rect(.43,.34,.09,.52);p.rect(.37,.13,.22,.23);for(let y=.17;y<.34;y+=.04)p.line([.39,y],[.57,y]);},
 sword:p=>{p.line([.49,.09],[.57,.2],[.54,.65],[.45,.65],[.43,.2],[.49,.09]);p.line([.27,.65],[.72,.65]);p.rect(.44,.67,.12,.22);},
 pillow:p=>{p.line([.16,.27],[.37,.31],[.65,.28],[.83,.24],[.78,.49],[.84,.74],[.57,.7],[.34,.74],[.17,.78],[.23,.53],[.16,.27]);},
 fork:p=>{p.line([.5,.42],[.5,.86]);p.line([.36,.15],[.36,.38],[.5,.46],[.64,.38],[.64,.15]);p.line([.5,.16],[.5,.44]);},
 backpack:p=>{p.rect(.27,.29,.47,.55);p.oval(.51,.23,.13,.08);p.rect(.35,.55,.3,.21);p.line([.24,.37],[.14,.7]);p.line([.77,.36],[.87,.68]);},
 key:p=>{p.oval(.34,.33,.15,.19);p.oval(.34,.33,.045,.055);p.line([.44,.47],[.76,.84],[.84,.77],[.75,.7],[.79,.63],[.7,.54]);},
 money:p=>{p.rect(.15,.33,.69,.35);p.rect(.19,.37,.6,.27);p.oval(.49,.5,.09,.12);p.line([.2,.75],[.87,.75],[.87,.4]);},
 boat:p=>{p.line([.15,.67],[.31,.84],[.7,.84],[.86,.67],[.15,.67]);p.line([.5,.12],[.5,.66]);p.line([.46,.18],[.22,.57],[.46,.57]);p.line([.54,.22],[.77,.58],[.54,.58]);},
 rocket:p=>{p.line([.35,.7],[.36,.32],[.5,.11],[.66,.32],[.66,.7],[.35,.7]);p.oval(.51,.39,.09,.12);p.line([.35,.57],[.2,.81],[.35,.74]);p.line([.66,.57],[.79,.81],[.66,.74]);p.line([.43,.75],[.49,.94],[.58,.75]);},
 ghost:p=>{p.line([.24,.78],[.23,.36],[.33,.17],[.51,.12],[.72,.28],[.76,.8],[.64,.72],[.54,.82],[.4,.73],[.24,.78]);p.oval(.4,.4,.035,.06);p.oval(.61,.4,.035,.06);p.oval(.51,.6,.05,.07);},
 tent:p=>{p.line([.49,.18],[.11,.81],[.88,.81],[.49,.18],[.46,.8]);p.line([.5,.45],[.65,.8]);},
 mountain:p=>{p.line([.12,.83],[.39,.18],[.59,.57],[.72,.29],[.9,.83],[.12,.83]);p.line([.3,.42],[.39,.5],[.46,.35]);},
 tv:p=>{p.rect(.19,.25,.62,.49);p.line([.36,.09],[.49,.25],[.65,.11]);p.line([.31,.74],[.25,.85]);p.line([.68,.74],[.76,.85]);p.rect(.25,.31,.42,.36);},
 cake:p=>{p.rect(.23,.43,.53,.34);p.oval(.5,.43,.265,.09);p.line([.49,.39],[.49,.2]);p.oval(.5,.14,.025,.045);p.line([.23,.6],[.37,.64],[.5,.6],[.63,.65],[.76,.6]);},
 fish:p=>{p.oval(.5,.5,.24,.19);p.line([.27,.43],[.1,.29],[.1,.73],[.27,.57]);p.oval(.64,.45,.02,.025);p.line([.48,.31],[.42,.19],[.62,.33]);},
 human:p=>{p.oval(.5,.24,.11,.13);p.line([.5,.37],[.5,.64],[.31,.88]);p.line([.5,.64],[.69,.88]);p.line([.24,.54],[.5,.43],[.77,.54]);},
};
Object.assign(ART,{
 cinema:p=>{p.rect(.15,.14,.7,.42);for(const x of [.23,.43,.63]){p.rect(x,.67,.14,.14);p.line([x,.81],[x,.89]);p.line([x+.14,.81],[x+.14,.89]);}},
 goose:p=>{p.oval(.44,.68,.23,.14);p.line([.59,.65],[.61,.33],[.67,.2]);p.oval(.7,.24,.07,.09);p.line([.76,.22],[.88,.28],[.76,.29]);p.oval(.7,.22,.01,.015);p.line([.4,.82],[.36,.93]);},
 raccoon:p=>{ART.bear(p);p.line([.32,.42],[.44,.5],[.5,.44],[.57,.5],[.69,.41]);p.line([.32,.5],[.43,.41]);p.line([.58,.41],[.69,.5]);},
 sloth:p=>{p.oval(.5,.4,.22,.21);p.oval(.4,.38,.05,.04);p.oval(.6,.38,.05,.04);p.line([.43,.49],[.5,.53],[.57,.48]);p.line([.32,.54],[.2,.81],[.4,.74]);p.line([.68,.54],[.8,.81],[.6,.74]);},
 astronaut:p=>{ART.human(p);p.oval(.5,.24,.17,.18);p.rect(.37,.17,.26,.12);p.rect(.54,.42,.15,.22);},
 pirate:p=>{ART.human(p);p.line([.32,.16],[.42,.05],[.56,.05],[.68,.16],[.32,.16]);p.line([.41,.21],[.59,.3]);p.oval(.45,.24,.035,.035);},
 chef:p=>{ART.human(p);p.oval(.4,.08,.08,.06);p.oval(.51,.065,.08,.065);p.oval(.6,.08,.08,.06);p.line([.41,.14],[.59,.14]);},
 firefighter:p=>{ART.human(p);p.line([.31,.16],[.68,.16]);p.line([.37,.15],[.4,.065],[.6,.065],[.64,.15]);},
 superhero:p=>{ART.human(p);p.line([.43,.4],[.2,.74],[.38,.68]);p.line([.58,.4],[.79,.75],[.61,.68]);},
});
const ALIASES=[
 ['house',/\b(house|home|treehouse)\b/],['bed',/\b(bed|bedroom|sleeping|sleep)\b/],['sofa',/\b(sofa|couch)\b/],['car',/\b(car|vehicle|driving)\b/],['beach',/\b(beach|ocean|surfing|surf|sea)\b/],['tree',/\b(tree|park|backyard|forest|garden)\b/],['library',/\blibrary\b/],['book',/\b(book|notebook|diary|journal)\b/],['phone',/\b(phone|iphone|cellphone)\b/],['guitar',/\bguitar\b/],['wallet',/\bwallet\b/],['chain',/\b(chain|necklace)\b/],['laptop',/\b(computer|laptop|gaming|video games)\b/],['toilet',/\b(toilet|bathroom)\b/],['fridge',/\b(fridge|refrigerator)\b/],['sandwich',/\b(sandwich|grilled cheese)\b/],['pizza',/\bpizza\b/],['taco',/\btacos?\b/],['burger',/\b(burger|hamburger)\b/],['icecream',/\bice cream\b/],['coffee',/\b(coffee|mug|tea|cup)\b/],['banana',/\bbanana\b/],['potato',/\bpotato\b/],['goose',/\bgoose\b/],['duck',/\bduck\b/],['cat',/\bcat\b/],['dog',/\bdog\b/],['raccoon',/\braccoon\b/],['sloth',/\bsloth\b/],['bear',/\bbear\b/],['spider',/\bspider\b/],['chair',/\bchair\b/],['crown',/\bcrown\b/],['shoe',/\b(shoe|sneaker|boot)\b/],['umbrella',/\bumbrella\b/],['cone',/\b(traffic cone|cone)\b/],['toothbrush',/\btoothbrush\b/],['sword',/\bsword\b/],['pillow',/\bpillow\b/],['fork',/\bfork\b/],['backpack',/\b(backpack|bag)\b/],['key',/\bkeys?\b/],['money',/\b(money|cash|dollar)\b/],['boat',/\bboat\b/],['astronaut',/\bastronaut\b/],['rocket',/\b(rocket|spaceship)\b/],['ghost',/\bghost\b/],['tent',/\b(tent|camping)\b/],['mountain',/\b(mountain|hiking|hike)\b/],['cinema',/\b(movie theater|cinema)\b/],['tv',/\b(tv|television)\b/],['cake',/\bcake\b/],['fish',/\bfish\b/],['chef',/\bchef\b/],['pirate',/\bpirate\b/],['firefighter',/\bfirefighter\b/],['superhero',/\bsuperhero\b/],['human',/\b(teacher|doctor|pilot|actor)\b/],
];
export function sketchKind(answer){return ALIASES.find(([,pattern])=>pattern.test(String(answer).toLowerCase()))?.[0]||null;}
export function drawLocal(answer){const kind=sketchKind(answer);if(!kind)return null;const p=pen();ART[kind](p);return p.strokes;}
export function localComputerBluffs({truth,seeds,count=2}) {
 const real=sketchKind(truth),seen=new Set(real?[real]:[]),result=[];
 const candidates=[...seeds];for(let i=candidates.length-1;i>0;i--){const j=randomInt(i+1);[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 for(const answer of candidates){const kind=sketchKind(answer);if(!kind||seen.has(kind))continue;seen.add(kind);result.push({answer,strokes:drawLocal(answer)});if(result.length===count)break;}
 return result;
}
