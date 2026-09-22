// Shared, finite avatar vocabulary. The server stores choices, never user SVG.
export const PARTS = {
 head:['bean','round','square','pear','cloud','star','cat','alien'],
 hat:['none','beanie','party','cowboy','bucket','crown','cap','flower','chef','halo','frog','antenna'],
 glasses:['none','round','sunnies','square','heart','monocle','sleepy','goggles'],
 hair:['none','stache','beard','goatee','handlebar','freckles','stubble','sideburns'],
 outfit:['tee','stripes','overalls','hoodie','suit','dress','cape','turtleneck'],
 pose:['wave','hips','shrug','peace','dance','chill'],
 color:['tomato','butter','denim','sage','peach','lilac','paper','cocoa'],
};
export const LABELS={head:'Head',hat:'Hat',glasses:'Eyes',hair:'Face',outfit:'Fit',pose:'Pose',color:'Color'};
export const COLORS={tomato:'#d7573d',butter:'#e5b747',denim:'#4d7c9d',sage:'#849875',peach:'#dfaa87',lilac:'#aaa0bd',paper:'#eee3c6',cocoa:'#a5795a'};
export function defaultCharacter(seed=0){return {head:PARTS.head[seed%8],hat:['beanie','party','flower','cowboy','cap','bucket','frog','none'][seed%8],glasses:seed%3===0?'round':'none',hair:'none',outfit:PARTS.outfit[seed%8],pose:PARTS.pose[seed%6],color:PARTS.color[seed%8]};}
export function validateCharacter(value,seed=0){
 if(value===undefined)return defaultCharacter(seed);
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Choose a character from the doodle maker.');
 const result=defaultCharacter(seed);
 for(const [part,choices] of Object.entries(PARTS)){if(value[part]!==undefined){if(!choices.includes(value[part]))throw Error('That character option does not exist.');result[part]=value[part];}}
 if(Object.keys(value).some(k=>!Object.hasOwn(PARTS,k)))throw Error('Unknown character option.');
 return result;
}
export function randomCharacter(){return Object.fromEntries(Object.entries(PARTS).map(([key,values])=>[key,values[Math.floor(Math.random()*values.length)]]));}
export function characterSvg(config={}, {crown=false,faceOnly=false}={}){
 let a;try{a=validateCharacter(config);}catch{a=defaultCharacter();}
 const ink='#292720',fill=COLORS[a.color],paper='#f7edcf';
 const heads={
 bean:'M55 66C46 41 73 26 98 35C119 20 150 35 149 58C170 65 168 98 150 107C143 131 98 133 89 114C67 123 40 99 55 66Z',
 round:'M54 76C51 18 153 18 158 74C162 132 52 137 54 76Z',
 square:'M65 34L148 37Q159 38 158 50L154 115Q113 129 58 112L55 50Q53 33 65 34Z',
 pear:'M78 43C91 20 124 21 136 46L155 88C168 126 45 135 54 91Z',
 cloud:'M57 67C31 48 53 29 74 37C76 9 111 20 115 33C141 17 166 38 153 56C180 64 163 87 154 90C160 120 132 126 115 113C96 134 72 119 73 110C43 118 35 86 57 67Z',
 star:'M108 23L124 55L163 58L137 83L144 121L109 104L72 121L79 82L52 57L92 54Z',
 cat:'M57 80L58 24L88 45Q108 32 127 44L159 22L157 83C167 135 49 135 57 80Z',
 alien:'M48 64C47 7 171 9 168 65C166 95 122 128 108 130C94 126 50 98 48 64Z',
 };
 const poses={
 wave:'M85 135L60 143L38 98M137 136L159 157L171 137',hips:'M83 135L54 151L79 166M137 135L163 152L139 166',shrug:'M84 135L64 154L31 130M138 135L157 154L187 132',peace:'M84 135L54 146L40 110M137 136L157 144L175 96',dance:'M84 135L53 115L36 138M138 135L160 150L182 124',chill:'M84 135L66 166L86 170M139 135L155 165L137 170',
 };
 let outfit=`<path d="M85 125L137 126L147 184L76 184Z" fill="${fill}"/>`;
 if(a.outfit==='stripes')outfit+='<path d="M84 142L139 143M80 158L143 159M78 175L145 176" stroke="#f7edcf" stroke-width="8"/>';
 if(a.outfit==='overalls')outfit+='<path d="M90 126L90 150L131 150L131 126M82 151L80 184L145 184L140 150Z" fill="#4d7c9d"/><rect x="99" y="155" width="24" height="16" rx="3" fill="#f7edcf"/>';
 if(a.outfit==='hoodie')outfit+='<path d="M86 127Q109 148 136 128M100 140L96 160M121 141L125 160M94 171Q109 163 131 171" fill="none"/>';
 if(a.outfit==='suit')outfit+='<path d="M91 126L111 177L132 126" fill="#fff6df"/><path d="M108 136L115 136L119 164L111 174L104 164Z" fill="#d7573d"/>';
 if(a.outfit==='dress')outfit=`<path d="M85 125L137 126L162 186L61 183Z" fill="${fill}"/><path d="M79 151L142 152"/><circle cx="95" cy="169" r="5" fill="${paper}"/><circle cx="127" cy="177" r="5" fill="${paper}"/>`;
 if(a.outfit==='cape')outfit=`<path d="M86 122L51 186L106 176L168 186L136 123Z" fill="#d7573d"/>${outfit}<path d="M111 144L116 155L129 155L119 163L122 176L111 169L100 176L104 163L94 155L106 155Z" fill="#e5b747" stroke-width="2"/>`;
 if(a.outfit==='turtleneck')outfit+='<path d="M87 123L136 123L133 141L88 139Z" fill="#292720"/>';
 const glasses={none:'',round:'<circle cx="87" cy="73" r="17"/><circle cx="131" cy="73" r="17"/><path d="M104 72Q109 67 114 72M58 69L69 71M148 71L159 68"/>',sunnies:'<path d="M66 63L104 65L100 84L73 82ZM117 65L152 63L146 82L121 84Z" fill="#292720"/><path d="M104 68L117 68M72 67L85 76M125 69L137 75" stroke="#fff6df" stroke-width="2"/>',square:'<path d="M68 60L104 61L103 84L69 82ZM116 61L151 61L149 83L117 83ZM104 69L116 69"/>',heart:'<path d="M88 86C46 62 81 49 88 65C103 45 126 70 88 86ZM132 86C96 66 121 49 132 65C150 44 173 67 132 86Z" fill="#d7573d"/>',monocle:'<circle cx="133" cy="73" r="18"/><path d="M149 84Q178 98 153 130"/>',sleepy:'<path d="M72 73Q86 84 100 72M120 74Q133 84 146 71" stroke-width="5"/>',goggles:'<path d="M62 59Q110 53 157 60L153 89L64 89Z" fill="#c2d5d5"/><path d="M109 58L110 88M69 66L81 79M124 65L137 80"/>'};
 const hair={none:'',stache:'<path d="M109 89C100 82 91 97 79 90C85 111 109 99 110 94C117 105 139 107 142 90C129 99 120 82 109 89Z" fill="#292720"/>',beard:'<path d="M70 96Q83 116 110 111Q135 111 146 95Q150 137 110 146Q72 136 70 96Z" fill="#7f583d"/>',goatee:'<path d="M97 108L119 110L111 133Z" fill="#292720"/>',handlebar:'<path d="M109 91Q94 103 79 97Q64 98 73 82M110 92Q127 104 142 95Q153 89 146 81" stroke-width="6"/>',freckles:'<g fill="#a5795a" stroke="none"><circle cx="72" cy="87" r="2"/><circle cx="81" cy="91" r="2"/><circle cx="68" cy="95" r="2"/><circle cx="143" cy="91" r="2"/><circle cx="152" cy="86" r="2"/><circle cx="149" cy="98" r="2"/></g>',stubble:'<path d="M82 102L79 108M90 108L88 114M99 113L98 119M112 115L112 121M124 110L126 117M135 104L139 110" stroke-width="2"/>',sideburns:'<path d="M56 69L68 72L72 103L60 98ZM149 71L159 66L155 99L145 104Z" fill="#7f583d"/>'};
 const hats={none:'',beanie:'<path d="M65 47Q64 1 107 7Q148 7 148 48Z" fill="#d7573d"/><path d="M60 40L152 41L151 55L60 53Z" fill="#d7573d"/><path d="M73 28L141 29M84 13L82 39M127 12L130 40" stroke="#f7edcf" stroke-width="2"/>',party:'<path d="M78 40L108 -9L137 42Z" fill="#e5b747"/><path d="M87 23L119 8M82 35L127 19" stroke="#d7573d" stroke-width="6"/><circle cx="108" cy="-9" r="6" fill="#d7573d"/>',cowboy:'<path d="M61 42L76 11L102 21L131 8L149 40Q182 21 173 48Q110 70 46 49Q34 29 61 42Z" fill="#a5795a"/><path d="M67 40Q108 52 149 38"/>',bucket:'<path d="M78 12L139 15L152 43L64 43Z" fill="#849875"/><path d="M64 40L151 39L166 58Q114 70 50 56Z" fill="#849875"/>',crown:'<path d="M63 47L54 9L87 28L111 0L132 27L159 7L151 49Z" fill="#e5b747"/><path d="M66 40L147 40"/>',cap:'<path d="M63 46Q66 9 111 14Q149 17 150 46Z" fill="#4d7c9d"/><path d="M112 46Q153 31 177 49Q156 60 112 53Z" fill="#4d7c9d"/>',flower:'<path d="M116 40L127 16" stroke="#849875"/><g fill="#d7573d"><ellipse cx="133" cy="10" rx="17" ry="7" transform="rotate(-30 133 10)"/><ellipse cx="131" cy="9" rx="7" ry="17"/><ellipse cx="131" cy="9" rx="17" ry="7" transform="rotate(30 131 9)"/></g><circle cx="131" cy="9" r="7" fill="#e5b747"/>',chef:'<path d="M72 46L66 21C38 -2 65 -20 85 -6C91 -29 128 -24 134 -6C160 -17 183 7 151 25L147 47Z" fill="#fffdf2"/>',halo:'<ellipse cx="109" cy="10" rx="48" ry="10" stroke="#e5b747" stroke-width="6"/>',frog:'<path d="M65 48Q61 13 108 16Q152 15 155 48Z" fill="#849875"/><circle cx="77" cy="15" r="14" fill="#849875"/><circle cx="138" cy="15" r="14" fill="#849875"/><circle cx="78" cy="13" r="4" fill="#292720"/><circle cx="137" cy="13" r="4" fill="#292720"/>',antenna:'<path d="M89 40L80 7M131 38L145 3"/><circle cx="79" cy="6" r="9" fill="#d7573d"/><circle cx="145" cy="3" r="9" fill="#4d7c9d"/>'};
 return `<svg class="character-art" viewBox="${faceOnly?'34 -28 148 164':'10 -28 200 250'}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${!faceOnly?`<path d="M93 177L84 208L64 208M128 178L139 207L157 207" stroke-width="7"/><path d="${poses[a.pose]}" stroke-width="5"/>${a.pose==='peace'?'<path d="M175 101L168 84M176 99L184 84M40 114L32 103"/>':''}${outfit}`:''}<path d="${heads[a.head]}" fill="${paper}"/><g fill="${ink}">${a.glasses==='sleepy'?'':'<ellipse cx="87" cy="73" rx="4" ry="6"/><ellipse cx="131" cy="73" rx="4" ry="6"/>'}</g><path d="M95 95Q109 110 126 94"/>${glasses[a.glasses]}${hair[a.hair]}${hats[crown?'crown':a.hat]}</g></svg>`;
}
