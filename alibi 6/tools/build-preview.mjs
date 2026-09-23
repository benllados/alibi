// Render the approved 50-second character tour with production artwork and Paper Trails.
// Build-time dependencies only: sharp, ffmpeg, exported font outlines, and the music edit.
import {createRequire} from 'node:module';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {frame,poster,DIALOGUE,DURATION,FPS} from './tour-scene.mjs';
const require=createRequire(import.meta.url),sharp=require('sharp'),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=root+'/public/media',work=root+'/tools/tour-stills';
await mkdir(work,{recursive:true});await mkdir(out,{recursive:true});
const samples=[1.2,3.6,6.4,8.2,9.48,10.8,13,15.3,17.8,20.5,23.5,26.3,28.7,30.8,33.6,35.3,37.5,41.3,43.1,45.5,48.5,49.7];
if(process.argv.includes('--stills')){
 const thumbs=[];
 for(const t of samples){const data=await sharp(Buffer.from(frame(t))).png().toBuffer();await writeFile(`${work}/${t.toFixed(2)}.png`,data);thumbs.push(await sharp(data).resize(512,288).toBuffer());}
 await sharp({create:{width:1536,height:288*Math.ceil(samples.length/3),channels:3,background:'#d6cdb8'}}).composite(thumbs.map((input,i)=>({input,left:i%3*512,top:Math.floor(i/3)*288}))).jpeg({quality:85}).toFile(work+'/contact-sheet.jpg');
 await sharp(Buffer.from(poster())).resize(1920,1080).webp({quality:90}).toFile(out+'/preview-poster.webp');
 console.log('Rendered 22 story frames, a contact sheet, and the poster.');process.exit(0);
}
const audio=root+'/tools/tour-work/tour-mix.wav';
const encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size','1920x1080','-framerate',String(FPS),'-i','pipe:0','-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','21','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t',String(DURATION),'-movflags','+faststart',out+'/alibi-preview.mp4'],{stdio:['pipe','ignore','pipe']});
let errors='';encoder.stderr.on('data',b=>errors+=b);encoder.stdin.on('error',()=>{});const done=once(encoder,'close');
for(let i=0;i<DURATION*FPS;i++){
 const data=await sharp(Buffer.from(frame(i/FPS))).resize(1920,1080).flatten({background:'#f1ead7'}).removeAlpha().raw().toBuffer();
 if(encoder.exitCode!==null)throw Error(errors||'Encoder stopped');
 if(!encoder.stdin.write(data))await once(encoder.stdin,'drain');
 if(i%(FPS*5)===0)console.log(`Rendered ${i/FPS}s / ${DURATION}s`);
}
encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);
await sharp(Buffer.from(poster())).resize(1920,1080).webp({quality:90}).toFile(out+'/preview-poster.webp');
const stamp=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(3).padStart(6,'0')}`;
await writeFile(out+'/alibi-preview.vtt','WEBVTT\n\n'+DIALOGUE.map(([a,b,i,s])=>`${stamp(a)} --> ${stamp(b)}\n${['Frog','Cowboy','Flower','Cape'][i]}: ${s}\n`).join('\n'));
await copyFile(out+'/alibi-preview.mp4',root+'/../Alibi-Character-Tour-50s.mp4');
console.log('Finished the 50-second character tour with music.');
