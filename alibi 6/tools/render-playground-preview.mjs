// Motion review using production character paths. The menu backdrop is staged,
// not a browser screenshot. Needs optional sharp + ffmpeg, never used by the game.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {sceneFrame} from '../public/playground-scene.js';
import {renderSceneSvg} from '../public/playground.js';
import {wordmark} from '../public/logo.js';
import {doodle} from '../public/art.js';
const require=createRequire(import.meta.url),sharp=require('sharp');
const output=process.argv[2]||'/tmp/alibi-character-motion.mp4';
const fps=24,duration=48,L={width:1280,height:740,mobile:false,stage:{x:65,y:507,width:1130,height:176},logo:{x:90,y:95,width:470,height:240},sheet:{x:770,y:132,width:400,height:370},star:{x:1180,y:214},pencil:{x:1193,y:517}};
const nested=(svg,x,y,w,h)=>svg.replace('<svg ',`<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const logo=nested(wordmark(),90,95,470,240),star=nested(doodle('star'),1140,174,80,80),pencil=nested(doodle('pencil'),1153,467,80,100);
function backdrop(f){return `<defs><pattern id="rule" width="1280" height="32" patternUnits="userSpaceOnUse"><path d="M0 31H1280" stroke="#8dada2" opacity=".18"/></pattern></defs><rect width="1280" height="740" fill="#f1ead7"/><rect width="1280" height="740" fill="url(#rule)"/><rect x="18" width="13" height="740" fill="#292720"/><path d="M53 0V740" stroke="#bd4935" opacity=".18"/><text x="70" y="36" font-family="sans-serif" font-size="13" fill="#47718c">CHARACTER MOTION PREVIEW · STAGED MENU LAYOUT</text>${logo}<g fill="#292720" font-family="sans-serif"><text x="95" y="377" font-size="31" font-weight="bold">Your friends are the trivia.</text><text x="95" y="415" font-size="20">Make up lies. Find the truth.</text><text x="95" y="445" font-size="20">Finish with terrible drawings.</text></g><rect x="777" y="140" width="400" height="370" fill="#bdb39e" opacity=".4"/><rect x="770" y="132" width="400" height="370" fill="#fffcf0" stroke="#d7cfbc"/><path d="M915 126L981 129L978 143L911 140Z" fill="#d7cda5"/><g font-family="sans-serif" fill="#292720"><text x="803" y="193" font-size="29" font-weight="bold">get in here.</text><rect x="802" y="226" width="336" height="52" fill="#e8bf54" stroke="#292720" stroke-width="2"/><text x="970" y="260" text-anchor="middle" font-size="23">Host a game</text><text x="803" y="307" font-size="15">Your laptop is the shared screen.</text><rect x="802" y="331" width="336" height="52" fill="#bd4935" stroke="#292720" stroke-width="2"/><text x="970" y="365" text-anchor="middle" font-size="23" fill="#fffaf0">Join a game</text><text x="803" y="413" font-size="15">Bring a room code. And questionable judgment.</text><text x="803" y="465" font-size="17">See it in action ↗</text></g><g transform="rotate(${f.starTilt} 1180 214)">${star}</g>${f.pencilAway?'':pencil}<text x="70" y="723" font-family="sans-serif" font-size="12" fill="#706b5b">Actual animation model and character artwork. Live browser layout is a separate check.</text>`;}
const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:['pipe','ignore','pipe']});
let errors='';ff.stderr.on('data',b=>errors+=b);ff.stdin.on('error',()=>{});
for(let frame=0;frame<fps*duration;frame++){
 const f=sceneFrame(L,frame/fps),svg=renderSceneSvg(L,f,{background:backdrop(f)}),png=await sharp(Buffer.from(svg)).png().toBuffer();
 if(!ff.stdin.write(png))await once(ff.stdin,'drain');
 if(frame===Math.round(2.8*fps))await sharp(png).toFile(output.replace(/\.mp4$/,'.png'));
 if(frame%(fps*12)===0)process.stdout.write(`${frame/fps}s rendered\n`);
}
ff.stdin.end();const [code]=await once(ff,'close');if(code)throw Error(errors);console.log(JSON.stringify({output,seconds:duration,fps,bytes:fs.statSync(output).size}));
