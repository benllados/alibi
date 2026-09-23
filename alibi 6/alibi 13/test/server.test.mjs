import test from 'node:test';
import assert from 'node:assert/strict';
import { server, game } from '../server.mjs';
let base;
test.before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
test.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
async function post(path,data){const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const value=await response.json();return {status:response.status,value};}
async function command(auth,type,extra={}){const response=await post('/api/action',{...auth,type,...extra});assert.equal(response.status,200,response.value.error);return response.value;}
async function readEvent(reader){let text='';while(!text.includes('\n\n')){const part=await reader.read();if(part.done)throw Error('Stream ended');text+=new TextDecoder().decode(part.value);}return JSON.parse(text.split('\n').find(l=>l.startsWith('data: ')).slice(6));}
test('Static assets, health, network discovery, and source files stay private',async()=>{for(const path of ['/','/host','/join','/app.js','/playground.js','/playground-scene.js','/playground.css','/style.css','/favicon.svg','/favicon-yellow.png','/favicon-smiley.webp','/characters.js','/art.js','/audio.js','/logo.js','/fonts/smile-moon.otf','/art/paper.svg','/api/health','/api/network']){const r=await fetch(base+path);assert.equal(r.status,200,path);assert.ok(r.headers.get('content-security-policy'));}for(const path of ['/game.mjs','/server.mjs','/package.json'])assert.equal((await fetch(base+path)).status,404);});
test('SSE streams lobby changes immediately and reconnects to current state',async()=>{const {value:host}=await post('/api/rooms',{});const url=`${base}/api/events?room=${host.room}&token=${host.token}`;const abort=new AbortController();const stream=await fetch(url,{signal:abort.signal});assert.match(stream.headers.get('content-type'),/event-stream/);const reader=stream.body.getReader();const first=await readEvent(reader);assert.equal(first.players.length,0);const {value:p1}=await post('/api/join',{room:host.room,name:'Ben'});const joined=await readEvent(reader);assert.equal(joined.players[0].name,'Ben');assert.equal(joined.me,undefined);abort.abort();const reconnect=new AbortController();const stream2=await fetch(url,{signal:reconnect.signal});const fresh=await readEvent(stream2.body.getReader());assert.equal(fresh.version,joined.version);assert.equal(fresh.players.length,1);reconnect.abort();const snapshot=await fetch(`${base}/api/state?room=${host.room}&token=${p1.token}`).then(r=>r.json());assert.equal(snapshot.me.id,p1.playerId);});
test('A complete two-player match works over HTTP with isolated seat credentials',async()=>{const {value:host}=await post('/api/rooms',{});const seats=[];for(const name of ['Ben','Friend'])seats.push((await post('/api/join',{room:host.room,name})).value);const seatFor=id=>seats.find(s=>s.playerId===id);const room=game.room(host.room);await command(host,'start');let normal=0,draws=0;while(room.phase!=='finished'){if(room.phase==='write'){const subject=seatFor(room.t.subject);const result=await command(subject,'answer',{text:'The actual answer',lie:'The invented answer'});assert.equal(result.phase,'vote');assert.equal(room.t.options.length,4);const truth=room.t.options.find(o=>o.truth);const voter=game.eligible(room)[0];const voterSeat=seatFor(voter.id);const privateState=await fetch(`${base}/api/state?room=${host.room}&token=${voterSeat.token}`).then(r=>r.json());assert.equal(privateState.me.truth,undefined);assert.ok(privateState.turn.options.every(o=>!('truth' in o)));await command(voterSeat,'vote',{choices:[truth.id]});await command(host,'next');normal++;}else if(room.phase==='questions'){for(const s of seats)await command(s,'question',{text:'What is your favorite ridiculous snack?'});}else if(room.phase==='truth'){await command(seatFor(room.t.subject),'truth',{text:'A big pizza'});await command(seatFor(game.artists(room)[0].id),'drawing',{strokes:[{color:'#7655ed',size:5,points:[[.1,.1],[.8,.8]]}]});await command(seatFor(game.eligible(room)[0].id),'vote',{choices:[room.t.options.find(o=>o.truth).id]});await command(host,'next');draws++;}else assert.fail(room.phase);}assert.equal(normal,4);assert.equal(draws,1);assert.deepEqual(room.players.map(p=>p.score).sort((a,b)=>a-b),[1500,2000]);});
test('HTTP rejects forged host actions and cross-origin writes',async()=>{const {value:host}=await post('/api/rooms',{});const {value:seat}=await post('/api/join',{room:host.room,name:'Player'});assert.equal((await post('/api/action',{...seat,type:'start'})).status,400);assert.equal((await fetch(`${base}/api/state?room=${host.room}&token=incorrect`)).status,400);const cross=await fetch(base+'/api/rooms',{method:'POST',headers:{Origin:'http://untrusted.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(cross.status,403);});

test('Character edits reach other devices over HTTP and font assets use the correct MIME type',async()=>{
 const {value:host}=await post('/api/rooms',{});
 const {value:a}=await post('/api/join',{room:host.room,name:'Doodle A',character:{head:'cloud',hat:'flower'}});
 const {value:b}=await post('/api/join',{room:host.room,name:'Doodle B'});
 await command(a,'character',{character:{head:'cat',hat:'frog',pose:'dance'}});
 const snapshot=await fetch(`${base}/api/state?room=${host.room}&token=${b.token}`).then(r=>r.json());
 assert.equal(snapshot.players[0].character.head,'cat');assert.equal(snapshot.players[0].character.hat,'frog');assert.equal(snapshot.players[0].character.pose,'dance');
 assert.equal((await post('/api/action',{...a,type:'character',character:{hat:'<img onerror=alert(1)>'}})).status,400);
 const font=await fetch(base+'/fonts/smile-moon.otf');assert.equal(font.status,200);assert.equal(font.headers.get('content-type'),'font/otf');
 assert.equal(Buffer.from(await font.arrayBuffer()).subarray(0,4).toString(),'OTTO');
 for(const path of ['/fonts/../../game.mjs','/.env','/config.mjs'])assert.equal((await fetch(base+path)).status,404);
});

test('Walkthrough video supports native playback, HEAD, seeking, and invalid-range rejection',async()=>{
 const poster=await fetch(base+'/media/preview-poster.webp');assert.equal(poster.status,200);assert.equal(poster.headers.get('content-type'),'image/webp');
 assert.equal((await fetch(base+'/entrance.css')).status,200);
 const path=base+'/media/alibi-preview.mp4',head=await fetch(path,{method:'HEAD'}),length=Number(head.headers.get('content-length'));
 assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'video/mp4');assert.equal(head.headers.get('accept-ranges'),'bytes');assert.ok(length>1000);assert.equal((await head.arrayBuffer()).byteLength,0);
 const start=await fetch(path,{headers:{Range:'bytes=0-31'}}),bytes=Buffer.from(await start.arrayBuffer());
 assert.equal(start.status,206);assert.equal(bytes.length,32);assert.equal(bytes.subarray(4,8).toString(),'ftyp');assert.equal(start.headers.get('content-range'),`bytes 0-31/${length}`);
 for(const range of ['bytes=-16',`bytes=${length-16}-`,`bytes=${length-16}-${length+100}`]){const r=await fetch(path,{headers:{Range:range}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,16);}
 for(const range of [`bytes=${length}-`,'bytes=20-10','bytes=-0','bytes=abc','bytes=-']){const r=await fetch(path,{headers:{Range:range}});assert.equal(r.status,416);assert.equal(r.headers.get('content-range'),`bytes */${length}`);assert.equal((await r.arrayBuffer()).byteLength,0);}
 for(const path of ['/tools/build-preview.mjs','/tools/preview-fonts.json','/media/../../server.mjs'])assert.equal((await fetch(base+path)).status,404);
});

test('Original music is served as seekable audio; synthesis source and reference recordings are not public',async()=>{
 const meta=await fetch(base+'/music/theme.json').then(r=>r.json());assert.equal(meta.seconds,120);assert.equal(meta.bpm,96);
 for(const path of [meta.bed,meta.spark]){
  const head=await fetch(base+path,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'audio/mpeg');
  assert.equal(head.headers.get('accept-ranges'),'bytes');assert.ok(Number(head.headers.get('content-length'))>100000);
  const range=await fetch(base+path,{headers:{Range:'bytes=0-63'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,64);
 }
 for(const path of ['/tools/compose-theme.py','/tools/audio-work/bed.wav','/upload/The%20Orb%20Of%20Dreamers.mp3'])assert.equal((await fetch(base+path)).status,404);
});
