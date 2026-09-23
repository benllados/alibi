// Version 5 / level L, byte mode. One Reed–Solomon block; no external requests.
// Capacity is 106 UTF-8 bytes, enough for ordinary room invitation URLs.
export function qrMatrix(text){
 const bytes=new TextEncoder().encode(text);if(bytes.length>106)return null;
 const bits=[];const put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push(v>>>i&1);};put(4,4);put(bytes.length,8);for(const b of bytes)put(b,8);put(0,Math.min(4,864-bits.length));while(bits.length%8)bits.push(0);
 const data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((v,b)=>v*2+b,0));for(let i=0;data.length<108;i++)data.push(i%2?17:236);
 const mul=(a,b)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11d);z^=(b>>>i&1)*a;}return z;};
 const generator=Array(26).fill(0);generator[25]=1;let root=1;for(let i=0;i<26;i++){for(let j=0;j<26;j++){generator[j]=mul(generator[j],root);if(j<25)generator[j]^=generator[j+1];}root=mul(root,2);}
 const ecc=Array(26).fill(0);for(const b of data){const factor=b^ecc.shift();ecc.push(0);for(let j=0;j<26;j++)ecc[j]^=mul(generator[j],factor);}
 const all=[...data,...ecc].flatMap(b=>Array.from({length:8},(_,i)=>b>>>(7-i)&1)),size=37,m=Array.from({length:size},()=>Array(size).fill(false)),reserved=m.map(r=>r.slice());
 const set=(x,y,v)=>{if(x>=0&&y>=0&&x<size&&y<size){m[y][x]=!!v;reserved[y][x]=true;}};
 for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
 for(const [x,y] of [[3,3],[size-4,3],[3,size-4]])for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy));set(x+dx,y+dy,d!==2&&d!==4);}
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(30+dx,30+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 function format(){let rem=8;for(let i=0;i<10;i++)rem=(rem<<1)^((rem>>>9)*0x537);const f=((8<<10)|rem)^0x5412,bit=i=>f>>>i&1;
  for(let i=0;i<=5;i++)set(8,i,bit(i));set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));for(let i=9;i<15;i++)set(14-i,8,bit(i));
  for(let i=0;i<8;i++)set(size-1-i,8,bit(i));for(let i=8;i<15;i++)set(8,size-15+i,bit(i));set(8,size-8,true);
 }format();let n=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<size;v++){const y=((right+1)&2)===0?size-1-v:v;for(let j=0;j<2;j++){const x=right-j;if(!reserved[y][x])m[y][x]=Boolean((all[n++]||0)^((x+y)%2===0));}}}format();return m;
}
export function qrSvg(text){const m=qrMatrix(text);if(!m)return '';const path=m.flatMap((row,y)=>row.flatMap((v,x)=>v?[`M${x+4} ${y+4}h1v1h-1z`]:[])).join('');return `<svg viewBox="0 0 45 45" role="img" aria-label="Scan to join this room" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="45" height="45" fill="white"/><path d="${path}" fill="#292720"/></svg>`;}
