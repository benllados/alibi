import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { Game } from './game.mjs';
import { loadConfigFile } from './config.mjs';
import { hostingConfig } from './hosting.mjs';
import { createOpenAIDecoyGenerator } from './ai-decoys.mjs';
import { createOpenAISketchGenerator } from './ai-sketches.mjs';

loadConfigFile();
const hosting = hostingConfig();
const aiDecoys=createOpenAIDecoyGenerator({apiKey:process.env.OPENAI_API_KEY||'',model:process.env.OPENAI_MODEL||'gpt-4.1-mini',onError:reason=>console.warn(`AI house answers unavailable (${reason}); using local fallback.`)});

const aiSketches=createOpenAISketchGenerator({apiKey:process.env.OPENAI_API_KEY||'',model:process.env.OPENAI_MODEL||'gpt-4.1-mini',onError:reason=>console.warn(`Computer artist unavailable (${reason}); using local drawings where possible.`)});
const connections = new Map();
function interfaces(){try{return Object.values(networkInterfaces()).flat();}catch{return [];}}
export const game = new Game({aiDecoys,aiSketches,onChange(room){for(const c of connections.get(room.code)||[]){try{c.res.write(`data: ${JSON.stringify(game.snapshot(room,c.token))}\n\n`);}catch{c.res.end();}}}});
const publicDir=fileURLToPath(new URL('./public/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.otf':'font/otf','.mp4':'video/mp4','.mp3':'audio/mpeg','.json':'application/json','.vtt':'text/vtt; charset=utf-8'};
const files=new Map([['/','index.html'],['/join','index.html'],['/host','index.html'],['/app.js','app.js'],['/style.css','style.css'],['/favicon.svg','favicon.svg'],['/favicon-yellow.png','favicon-yellow.png'],['/favicon-smiley.webp','favicon-smiley.webp'],...['entrance.css','playground.css','playground.js','playground-scene.js','media/alibi-preview.mp4','media/preview-poster.webp','media/alibi-preview.vtt','music/paper-trails-bed.mp3','music/paper-trails-spark.mp3','music/theme.json','characters.js','art.js','audio.js','logo.js','fonts/smile-moon.otf','art/paper.svg'].map(file=>['/'+file,file])]);
const limits=new Map();
function rateLimit(req){const key=req.socket.remoteAddress;const now=Date.now();let item=limits.get(key);if(!item||now-item.time>60000){item={time:now,count:0};limits.set(key,item);}if(++item.count>400)throw Error('Too many requests. Please wait a moment.');}
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>512000)throw Error('Request is too large.');}try{return JSON.parse(text);}catch{throw Error('Invalid request.');}}
export const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
 try{const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true});
 if(req.method==='GET'&&url.pathname==='/api/network'){const port=server.address().port;const addresses=hosting.hosted?[]:interfaces().filter(x=>x.family==='IPv4'&&!x.internal).map(x=>`http://${x.address}:${port}`);return json(res,200,{addresses});}
 if(req.method==='GET'&&['/api/events','/api/state'].includes(url.pathname)){const room=game.room(url.searchParams.get('room'));const token=url.searchParams.get('token');const snapshot=game.snapshot(room,token);if(url.pathname==='/api/state')return json(res,200,snapshot);res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(`data: ${JSON.stringify(snapshot)}\n\n`);const c={token,res};if(!connections.has(room.code))connections.set(room.code,new Set());connections.get(room.code).add(c);req.on('close',()=>connections.get(room.code)?.delete(c));return;}
 if(req.method==='POST'&&url.pathname.startsWith('/api/')){rateLimit(req);if(!hosting.allowsOrigin(req.headers.origin,req.headers.host))return json(res,403,{error:'Open the game from its own address.'});const data=await body(req);if(url.pathname==='/api/rooms'){if(game.rooms.size>=250)throw Error('Too many rooms. Please try again later.');return json(res,201,game.create());}if(url.pathname==='/api/join')return json(res,200,game.join(data.room,data.name,data.character));if(url.pathname==='/api/action')return json(res,200,game.action(data.room,data.token,data));return json(res,404,{error:'Not found.'});}
 if(['GET','HEAD'].includes(req.method)&&files.has(url.pathname)){
  const file=files.get(url.pathname),ext=file.slice(file.lastIndexOf('.')),content=await readFile(publicDir+file);
  const headers={'Content-Type':types[ext],'Cache-Control':'no-cache','Content-Length':content.length};
  if(['.mp4','.mp3'].includes(ext))headers['Accept-Ranges']='bytes';
  // Byte ranges let native video controls seek without downloading the whole clip again.
  if(['.mp4','.mp3'].includes(ext)&&req.method==='GET'&&req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   let start=NaN,end=NaN;
   if(match&&(match[1]||match[2])){
    if(match[1]){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),content.length-1):content.length-1;}
    else if(Number(match[2])>0){start=Math.max(0,content.length-Number(match[2]));end=content.length-1;}
   }
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=content.length||start>end){res.writeHead(416,{'Content-Range':`bytes */${content.length}`,'Content-Length':0});res.end();return;}
   res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${content.length}`,'Content-Length':end-start+1});res.end(content.subarray(start,end+1));return;
  }
  res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:content);return;
 }
 json(res,404,{error:'Not found.'});
 }catch(err){if(!res.headersSent)json(res,400,{error:err.message});else res.end();}
});
const timer=setInterval(()=>game.tick(),250);timer.unref();const heartbeat=setInterval(()=>{for(const group of connections.values())for(const c of group)c.res.write(': heartbeat\n\n');const now=Date.now();for(const [key,item]of limits)if(now-item.time>60000)limits.delete(key);},15000);heartbeat.unref();
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||3000;server.listen(port,'0.0.0.0',()=>{console.log(`\nALIBI is ready.\nTV / computer: http://localhost:${port}`);for(const addr of interfaces())if(addr.family==='IPv4'&&!addr.internal)console.log(`Phones on the same Wi-Fi: http://${addr.address}:${port}`);console.log(aiDecoys?'House answers: AI enabled.':'House answers: local mode. To enable AI, set OPENAI_API_KEY in .env.');console.log('\nKeep this terminal open. Press Ctrl+C to stop.\n');});server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is in use. Try: PORT=3001 npm start`:e.message);process.exit(1);});}
