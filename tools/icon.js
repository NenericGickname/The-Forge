const { chromium } = require('playwright');
const svg=(pad)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#3a2415"/><stop offset=".55" stop-color="#1a1014"/><stop offset="1" stop-color="#0b080c"/></radialGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb347" stop-opacity=".95"/><stop offset=".4" stop-color="#ff7a1a" stop-opacity=".45"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
<linearGradient id="anv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f949a"/><stop offset=".25" stop-color="#5b6066"/><stop offset="1" stop-color="#2c2f33"/></linearGradient>
<linearGradient id="hot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7a1a"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7dc98"/><stop offset="1" stop-color="#b8863a"/></linearGradient>
</defs>
<rect width="512" height="512" fill="url(#bg)"/>
<g transform="translate(256 262) scale(${pad}) translate(-256 -262)">
<circle cx="256" cy="215" r="150" fill="url(#glow)"/>
<!-- hammer -->
<g transform="rotate(-38 300 170)">
<rect x="292" y="120" width="20" height="170" rx="6" fill="#9a6538" stroke="#2a1a10" stroke-width="3"/>
<rect x="248" y="92" width="110" height="52" rx="10" fill="url(#anv)" stroke="#1c1d20" stroke-width="4"/>
</g>
<!-- sparks -->
<g fill="#ffd27a">
<circle cx="186" cy="196" r="7"/><circle cx="160" cy="170" r="5"/><circle cx="210" cy="160" r="4"/><circle cx="142" cy="208" r="3.5"/><circle cx="228" cy="186" r="3"/>
</g>
<!-- anvil -->
<path d="M110 250 H392 Q402 250 400 262 Q376 282 332 292 L322 330 H190 L180 292 Q150 284 124 270 Q96 262 110 250 Z" fill="url(#anv)" stroke="#1c1d20" stroke-width="5" stroke-linejoin="round"/>
<rect x="150" y="244" width="200" height="12" rx="4" fill="url(#hot)"/>
<path d="M190 330 H322 L346 372 H166 Z" fill="#3a3d42" stroke="#1c1d20" stroke-width="5" stroke-linejoin="round"/>
<text x="256" y="440" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="58" letter-spacing="10" fill="url(#gold)">FORGE</text>
</g>
</svg>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:512,height:512}});
for(const [f,pad,size] of [['icon-512',1,512],['icon-192',1,192],['apple-touch-icon',1,180],['icon-maskable-512',.78,512]]){
 await p.setViewportSize({width:512,height:512});
 await p.setContent(`<html><body style="margin:0">${svg(pad)}</body></html>`);
 await p.screenshot({path:`site/icons/${f}_big.png`,clip:{x:0,y:0,width:512,height:512}});}
await b.close();})();
