import { randomInt } from 'node:crypto';

const shuffle = values => {
  const result = [...values];
  for (let i=result.length-1;i>0;i--) {const j=randomInt(i+1);[result[i],result[j]]=[result[j],result[i]];}
  return result;
};
const key = text => text.toLowerCase().replace(/^(?:at|in|on)\s+(?:the\s+)?|^(?:a|an|the)\s+/,'').replace(/[^\p{L}\p{N}]/gu,'');
const words = text => text.trim().split(/\s+/).length;

// These are plausible answer families, not a random pool of joke punchlines.
// Explicit question context takes precedence over an answer that happens to
// contain a word from a different category (for example a movie called Cars).
const FAMILIES = [
  {pattern:/\b(safe\s*(space|place)|comfort\s*(place|spot)|feel.*safe|unwind|relax|happy place)\b/i,
    answers:['my bedroom','my house','the beach','my car','the library','my backyard','a quiet park','my childhood home']},
  {pattern:/\b(first kiss|first date|dream date)\b/i,
    answers:['a movie theater','a house party','a school dance','the beach','a park','a friend’s house','a restaurant','a car']},
  {pattern:/\b(restaurant|fast food|takeout|takeaway)\b/i,
    answers:['Chipotle','Taco Bell','In-N-Out','McDonald’s','Chick-fil-A','Panda Express','Shake Shack','Five Guys']},
  {pattern:/\b(dessert|sweet|candy)\b/i,
    answers:['ice cream','brownies','chocolate cake','cheesecake','cookies','apple pie','churros','tiramisu']},
  {pattern:/\b(celebrity|actor|actress|famous person|celebrity crush)\b/i,
    answers:['Ryan Gosling','Zendaya','Pedro Pascal','Emma Stone','Michael B. Jordan','Margot Robbie','Oscar Isaac','Florence Pugh']},
  {pattern:/\b(name.*(?:pet|dog|cat|goose)|(?:pet|dog|cat).*name)\b/i,
    answers:['Charlie','Max','Luna','Milo','Bella','Daisy','Cooper','Leo']},
  {pattern:/\b(snack|food|meal|dish|pizza|cook|cooking|eat|eats|eaten|ate|dinner|breakfast|lunch)\b/i,
    answers:['pizza','pasta','tacos','sushi','burgers','mac and cheese','dumplings','ramen','chicken nuggets','cereal','ice cream','grilled cheese']},
  {pattern:/\b(drink|beverage|cocktail|coffee|tea|order.*bar)\b/i,
    answers:['iced coffee','a margarita','lemonade','hot chocolate','iced tea','a mojito','orange juice','sparkling water']},
  {pattern:/\b(movie|film)\b/i,
    answers:['Shrek','Ratatouille','The Princess Bride','School of Rock','The Incredibles','Toy Story','Finding Nemo','Superbad']},
  {pattern:/\b(song|music|karaoke|soundtrack)\b/i,
    answers:['Dancing Queen','Call Me Maybe','Toxic','Mr. Brightside','Wonderwall','Party in the USA','Sweet Caroline','Hey Ya!']},
  {pattern:/\b(video game|videogame|game.*play|favorite game)\b/i,
    answers:['Minecraft','Mario Kart','The Sims','Stardew Valley','Animal Crossing','Rocket League','Super Smash Bros.','Fortnite']},
  {pattern:/\b(sport|sports)\b/i,
    answers:['soccer','basketball','tennis','swimming','volleyball','surfing','baseball','golf']},
  {pattern:/\b(animal|pet)\b/i,
    answers:['a dog','a cat','a sloth','a raccoon','a bear','a goose','a rabbit','a dolphin']},
  {pattern:/\b(fear|afraid|scared|phobia)\b/i,
    answers:['heights','spiders','deep water','clowns','needles','flying','snakes','getting stuck in an elevator']},
  {pattern:/\b(color|colour)\b/i,
    answers:['blue','green','purple','red','orange','yellow','pink','black']},
  {pattern:/\b(job|career|profession|work as|be when.*gr|be as a kid|want.*be.*kid|want.*be.*gr)\b/i,
    answers:['a teacher','a firefighter','an astronaut','a doctor','a chef','a veterinarian','an actor','a pilot']},
  {pattern:/\b(vacation|holiday|travel|visit|country|dream trip)\b/i,
    answers:['Japan','Italy','Greece','Spain','Costa Rica','New Zealand','Portugal','Mexico']},
  {pattern:/\b(city|hometown|born|grow up|grew up)\b/i,
    answers:['Los Angeles','New York','Chicago','Miami','San Diego','Boston','Seattle','San Francisco']},
  {pattern:/\b(class|subject|course)\b/i,
    answers:['history','math','chemistry','English','art','biology','geography','physics']},
  {pattern:/\b(chore|cleaning|housework)\b/i,
    answers:['folding laundry','washing dishes','vacuuming','taking out the trash','changing bedsheets','cleaning the bathroom']},
  {pattern:/\b(talent|skill|bad at|good at|hobby|hobbies|day off)\b/i,
    answers:['cooking','dancing','singing','drawing','skateboarding','playing guitar','swimming','gardening']},
  {pattern:/\b(excuse|reason.*leave|skip.*party)\b/i,
    answers:['I have an early morning','I’m not feeling well','I have work to finish','I need to feed my dog','I have a family dinner','I forgot about another plan']},
  {pattern:/\b(buy|purchase|gift|present|bag|forget|bring|save.*room|object)\b/i,
    answers:['a phone','a pair of shoes','headphones','a hoodie','a backpack','a camera','a notebook','a houseplant']},
  {pattern:/\b(where|location|place|hide|hang out)\b/i,
    answers:['my house','the beach','a park','a coffee shop','the library','a friend’s house','the gym','a bookstore']},
  {pattern:/\b(who|person|relative|family member)\b/i,
    answers:['my mom','my dad','my brother','my sister','my best friend','my cousin','my grandma','my roommate']},
];

function numericCandidates(prompt, references) {
  // Only vary quantities when the question actually asks for one.
  if(!/\b(how (old|many|much|long)|what (age|year|time)|which year|when)\b/i.test(prompt))return [];
  const reference=references.find(a=>/\d/.test(a));
  if(!reference)return [];
  const match=reference.match(/\d+/),number=Number(match[0]);
  const step=/how much/i.test(prompt)&&number>=100?Math.max(5,Math.round(number*.1)):1;
  return [-3,-2,-1,1,2,3].map(delta=>number+delta*step).filter(n=>n>=0&&(!/\bage\b|how old/i.test(prompt)||n<=110)).map(n=>reference.replace(match[0],String(n)));
}

function candidateFamily(prompt, references, seeds) {
  const numeric=numericCandidates(prompt,references);
  if(numeric.length)return numeric;
  // A generated question's original answers are guaranteed to belong to it.
  if(seeds.length)return seeds;
  // A location question needs locations, even when it mentions food or music.
  if(/^where\b/i.test(prompt)) {
    const locationFamilies=FAMILIES.filter(f=>/safe|first kiss|vacation|hometown|location|restaurant/.test(f.pattern.source));
    const location=locationFamilies.find(f=>f.pattern.test(prompt));
    return (location||FAMILIES.find(f=>f.pattern.source.includes('location'))).answers;
  }
  const family=FAMILIES.find(f=>f.pattern.test(prompt));
  if(family)return family.answers;
  // Unknown custom questions can still be recognized from multiple submitted
  // answers. Never infer a topic from only the truth and leak its answer type.
  const votes=FAMILIES.map(f=>({family:f,count:references.filter(a=>f.answers.some(b=>key(a)===key(b))).length})).sort((a,b)=>b.count-a.count);
  return votes[0]?.count>=2?votes[0].family.answers:[];
}

export function answerReferences({truth,answers=[]}) {
  return [truth,...answers].filter(a=>typeof a==='string'&&a.trim()).filter((a,i,all)=>all.findIndex(b=>key(a)===key(b))===i);
}

export function inferAnswerStyle(references) {
  const majority=Math.floor(references.length/2)+1;
  const parts=references.map(a=>a.trim().split(/\s+/));
  const shared=[];
  if(parts.length>=2)for(let i=0;i<Math.min(...parts.map(p=>p.length))-1&&i<10;i++) {
    if(parts.every(p=>p[i].toLowerCase()===parts[0][i].toLowerCase()))shared.push(parts[0][i]);else break;
  }
  const prefix=shared.join(' ');
  const endings=parts.map(p=>p.map(w=>w.replace(/[.!?]+$/,'')));
  const tail=[];
  if(parts.length>=2)for(let n=1;n<=Math.min(3,...parts.map(p=>p.length-shared.length-1));n++){
    if(endings.every(p=>p.at(-n).toLowerCase()===endings[0].at(-n).toLowerCase()))tail.unshift(endings[0].at(-n));else break;
  }
  const suffix=tail.join(' ');
  const content=references.map(a=>shared.length?a.split(/\s+/).slice(shared.length).join(' '):a);
  const terminal=references.map(a=>a.match(/[.!?]+$/)?.[0]||'');
  const punctuation=terminal.find(p=>terminal.filter(v=>v===p).length>=majority)??'';
  const lengths=references.map(words).sort((a,b)=>a-b);
  return {
    prefix,suffix,
    casing:references.filter(a=>/[a-z]/i.test(a)&&a===a.toUpperCase()).length>=majority?'upper':references.filter(a=>a===a.toLowerCase()).length>=majority?'lower':references.filter(a=>/^[A-Z]/.test(a)).length>=majority?'sentence':'mixed',
    bare:content.filter(a=>!/^(my|our|their|a|an|the|at|in|on)\b/i.test(a)).length>=majority,
    firstPerson:content.filter(a=>/^my\b/i.test(a)).length>=majority,
    locationPrefix:['at','in','on'].find(p=>content.filter(a=>a.toLowerCase().startsWith(p+' ')).length>=majority)||'',
    punctuation,
    medianWords:lengths[Math.floor(lengths.length/2)]||1,
    maxWords:Math.max(1,...lengths),
  };
}

export function matchAnswerStyle(candidate, references) {
  if(!references.length)return candidate;
  const style=inferAnswerStyle(references);
  let result=candidate.trim().replace(/[.!?]+$/,'');
  // A shared sentence stem belongs on the generated answer exactly once.
  if(style.prefix&&result.toLowerCase().startsWith(style.prefix.toLowerCase()+' '))result=result.slice(style.prefix.length+1);
  if(style.firstPerson)result=result.replace(/^their\s+|^(?:a|an|the)\s+(?=(?:house|home|bedroom|room|backyard|car|phone|laptop|hoodie|wallet)\b)/i,'my ');
  else if(style.bare&&!/^(?:The|A|An)\s+[A-Z]/.test(result))result=result.replace(/^(?:my|our|their|a|an|the)\s+/i,'');
  if(style.prefix)result=style.prefix+' '+result;
  else if(style.locationPrefix&&!/^(at|in|on)\b/i.test(result))result=style.locationPrefix+' '+result;
  if(style.suffix&&!result.toLowerCase().endsWith(' '+style.suffix.toLowerCase()))result+=' '+style.suffix;
  if(style.casing==='upper')result=result.toUpperCase();
  else if(style.casing==='lower')result=result.toLowerCase();
  else if(style.casing==='sentence')result=result[0].toUpperCase()+result.slice(1);
  return result+style.punctuation;
}

export function filterDecoys(context,candidates,{preserveOrder=false}={}) {
  const references=answerReferences(context),style=inferAnswerStyle(references);
  const existing=new Set(references.map(key));
  let valid=(Array.isArray(candidates)?candidates:[]).filter(text=>typeof text==='string'&&text.trim()&&text.length<=140&&!/[\r\n<>]/.test(text));
  if(style.prefix.toLowerCase()==='my'||(!style.prefix&&style.firstPerson)){const matching=valid.filter(text=>/^my\b/i.test(text));if(matching.some(text=>!existing.has(key(text))))valid=matching;}
  const result=(preserveOrder?valid:shuffle(valid)).map(text=>matchAnswerStyle(text,references)).filter(text=>{
    const k=key(text);if(!k||existing.has(k)||text.length>140)return false;
    if([...existing].some(other=>other.length>=4&&k.length>=4&&(k.includes(other)||other.includes(k))))return false;
    // Reject a conspicuously long answer when the group is using short phrases.
    if(words(text)>Math.max(style.maxWords+2,style.medianWords*2)+(style.suffix?words(style.suffix):0))return false;
    existing.add(k);return true;
  });
  if(!preserveOrder)result.sort((a,b)=>Math.abs(words(a)-style.medianWords)-Math.abs(words(b)-style.medianWords));
  return result.slice(0,Math.max(0,context.count??2));
}

export function generateDecoys(context) {
  const candidates=candidateFamily(context.prompt,answerReferences(context),context.seeds||[]);
  return filterDecoys(context,candidates);
}
