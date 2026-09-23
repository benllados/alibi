import fs from 'node:fs';
import {createRequire} from 'node:module';
import {sceneFrame} from '../public/playground-scene.js';
import {renderSceneSvg} from '../public/playground.js';
const require=createRequire(import.meta.url),sharp=require('sharp');
const L={width:1280,height:740,mobile:false,stage:{x:65,y:507,width:1130,height:176},logo:{x:90,y:95,width:470,height:240},sheet:{x:770,y:132,width:400,height:370},star:{x:1180,y:214},pencil:{x:1193,y:517}};
const scenes=[['two-stories',1.4],['bonk',2.74],['hat-and-paper',4.3],['wand-prep',8.4],['frog-sprouting',10.15],['frog-perched',11.1],['frog-sheet',12.6],['regrowth-folds',15.6],['plane-and-bow',16.4],['pencil-audition',20.3],['plane-catch',21.7],['pencil-ride',27.4],['pencil-stop',28.35],['repair-and-juggling',34.3],['star-fixed',37.3],['afterparty',44.2],['variant-repair',74.1],['variant-pencil',83.3]];
fs.mkdirSync('tools/playground-qa',{recursive:true});
const thumbs=[];
for(const [name,t] of scenes){
 const svg=renderSceneSvg(L,sceneFrame(L,t));
 fs.writeFileSync(`tools/playground-qa/${name}.svg`,svg);
 const png=await sharp(Buffer.from(svg)).flatten({background:'#f1ead7'}).png().toBuffer();
 await sharp(png).toFile(`tools/playground-qa/${name}.png`);
 const label=Buffer.from(`<svg width="480" height="30" xmlns="http://www.w3.org/2000/svg"><rect width="480" height="30" fill="#fff"/><text x="10" y="22" font-family="sans-serif" font-size="16">${name} · ${t}s</text></svg>`);
 thumbs.push({input:await sharp(png).resize(480,278).extend({bottom:30,background:'#fff'}).composite([{input:label,top:278,left:0}]).png().toBuffer(),left:(thumbs.length%3)*480,top:Math.floor(thumbs.length/3)*308});
}
await sharp({create:{width:1440,height:Math.ceil(scenes.length/3)*308,channels:4,background:'#fff'}}).composite(thumbs).png().toFile('tools/playground-qa/contact.png');
console.log('Rendered 18 frames from the actual animation model.');
