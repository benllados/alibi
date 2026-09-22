import {readFileSync} from 'node:fs';

// Only the named application settings below are accepted. Nothing is executed or
// interpolated, and an existing environment variable always takes precedence.
export function loadConfigFile(path=new URL('./.env',import.meta.url),env=process.env) {
  let contents;
  try{contents=readFileSync(path,'utf8');}catch(error){if(error.code==='ENOENT')return;throw error;}
  for(const line of contents.split(/\r?\n/)) {
    const match=line.match(/^\s*(OPENAI_API_KEY|OPENAI_MODEL|PUBLIC_ORIGIN)\s*=\s*(.*?)\s*$/);
    if(!match||env[match[1]]!==undefined)continue;
    let value=match[2];
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    else value=value.replace(/\s+#.*$/,'').trim();
    env[match[1]]=value;
  }
}
