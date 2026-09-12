(()=>{
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coin='<img src="assets/icons/coin.svg" alt="Münzen" width="22" height="22">';
function islandArt(index=0){return `<svg class="career-island-art" viewBox="0 0 240 72" aria-hidden="true" shape-rendering="crispEdges"><path fill="${['#57d8d3','#60c4d3','#eaaa82'][index]||'#57d8d3'}" d="M0 0h240v72H0z"/><path fill="#ffffff55" d="M12 18h39v3H12zm126 35h30v3h-30zm61-32h23v3h-23zM23 59h31v3H23z"/><path fill="#b7f0d2" d="M71 39h91v6h14v13h-14v6H67v-6H55V45h16z"/><path fill="#f5dd9c" d="M76 34h73v7h15v14H72v-6H61V40h15z"/><path fill="#3c955e" d="M86 29h53v8h13v9H77V36h9z"/><path fill="#78593d" d="M108 14h5v28h-5z"/><path fill="#176c47" d="M87 7h21V3h12v5h17v6h-20v6h-7v-6H88zm40 25h15v-5h6v24h-6V37h-14z"/><path fill="#fff" d="M185 40h23v5h-23zm4-19h3v19h-3z"/><path fill="#ed1c24" d="M193 22h4v4h4v4h4v5h-12z"/>${index===1?'<path fill="#705844" d="M155 34h68v8h-9v21h-5V42h-31v16h-5V42h-18z"/><path fill="#fff0cc" d="M162 23h9v11h-9zm32 0h9v11h-9z"/>':index===2?'<path fill="#3c6863" d="M56 38h8v-8h8v-8h8V12h12v10h8v8h8v8h8v10H56z"/><path fill="#fad2a8" d="M80 12h12v10h8v5H72v-5h8z"/>':''}</svg>`;}
function mount({getProfile,onSelectIsland,onBuy,onEquip,definitions,renderPreview}){
 const islands=definitions.islands,cosmetics=definitions.cosmetics;
 let tab='islands',opener=null;
 const launcher=document.createElement('div');launcher.className='career-launcher';
 launcher.innerHTML='<button type="button" data-career="islands"><span>INSELPASS</span><small></small></button><button type="button" data-career="garage"><span>GARAGE</span><small></small></button>';
 document.querySelector('.home-bottom').insertBefore(launcher,document.getElementById('start'));
 const dialog=document.createElement('dialog');dialog.className='career-dialog';dialog.setAttribute('aria-labelledby','career-title');
 dialog.innerHTML=`<header class="career-header"><div><span class="career-eyebrow">JETLEV · WATER RUSH</span><h2 id="career-title">DEINE INSELN</h2></div><button class="career-close" type="button" aria-label="Schließen">×</button></header><div class="career-navigation"><div class="career-tabs" aria-label="Bereich"><button type="button" data-tab="islands">INSELPASS</button><button type="button" data-tab="garage">GARAGE</button></div><strong class="career-wallet">${coin}<span></span></strong></div><div class="career-content"></div><p class="career-status" role="status" aria-live="polite"></p>`;
 document.body.append(dialog);
 const result=document.createElement('div');result.className='career-result';result.hidden=true;document.querySelector('#result .score-card').after(result);
 function missionValue(profile,island,mission){return Math.min(mission.target,Math.max(0,Number(profile.islands?.[island.id]?.[mission.metric])||0));}
 function unlocked(profile,island,index){if(definitions.isUnlocked)return definitions.isUnlocked(profile,island.id);return index===0||islands.slice(0,index).every(i=>i.missions.every(m=>missionValue(profile,i,m)>=m.target));}
 function refresh(){
  const profile=getProfile(),selected=islands.find(i=>i.id===profile.selectedIsland)||islands[0];
  launcher.querySelector('[data-career="islands"] small').textContent=selected.name;
  launcher.querySelector('[data-career="garage"] small').innerHTML=coin+esc(profile.bank);
  dialog.querySelector('.career-wallet span').textContent=profile.bank;
  dialog.querySelector('#career-title').textContent=tab==='islands'?'DEINE INSELN':'DEIN LOOK';
  dialog.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tab===tab)));
  const content=dialog.querySelector('.career-content'),focusKey=document.activeElement?.dataset?.focus;
  if(tab==='islands')content.innerHTML=`<p class="career-lead">3 MISSIONEN → NÄCHSTE INSEL<small>Jeder Run zählt.</small></p><div class="career-islands">${islands.map((island,index)=>{
   const open=unlocked(profile,island,index),active=profile.selectedIsland===island.id,done=island.missions.filter(m=>missionValue(profile,island,m)>=m.target).length;
   return `<article class="career-island ${active?'selected':''} ${open?'':'locked'}" style="--island-color:${esc(island.color)}">${islandArt(index)}<div class="career-island-heading"><div><span class="career-eyebrow">INSEL 0${index+1} · ${open?`${done}/3 ✓`:'GESPERRT'}</span><h3>${esc(island.name)}</h3></div><button type="button" data-island="${esc(island.id)}" data-focus="island-${esc(island.id)}" ${!open||active?'disabled':''}>${active?'AKTIV ✓':open?'WÄHLEN':'⌁'}</button></div>${open?`<div class="career-missions">${island.missions.map(m=>{const value=missionValue(profile,island,m);return `<div class="career-mission ${value>=m.target?'complete':''}"><div><span>${value>=m.target?'✓ ':''}${esc(m.label)}</span><b>${value}/${m.target}</b></div><progress value="${value}" max="${m.target}" aria-label="${esc(m.label)}"></progress></div>`;}).join('')}</div>`:`<p class="career-unlock">${esc(islands[index-1]?.name)} abschließen</p>`}</article>`;
  }).join('')}</div>`;
  else content.innerHTML=`<p class="career-lead">DEIN STIL. DEIN WASSERSTRAHL.</p><div class="career-garage">${cosmetics.map(kit=>{
   const owned=profile.owned.includes(kit.id),equipped=profile.equipped===kit.id;
   return `<article class="career-kit ${equipped?'selected':''}"><canvas class="career-kit-preview" data-kit-preview="${esc(kit.id)}" width="160" height="150" aria-label="${esc(kit.name)} · Jetlev-Vorschau"></canvas><h3>${esc(({classic:'ORIGINAL',coral:'KORALLE',aqua:'LAGUNE',sunset:'ABENDGOLD'})[kit.id]||kit.name)}</h3><button type="button" data-${owned?'equip':'buy'}="${esc(kit.id)}" data-focus="kit-${esc(kit.id)}" ${equipped||(!owned&&profile.bank<kit.price)?'disabled':''}>${equipped?'AKTIV ✓':owned?'ANZIEHEN':`${coin} ${kit.price}`}</button></article>`;
  }).join('')}</div><p class="career-note">Anzugdetails & Wasserlicht · rein kosmetisch</p>`;
  if(renderPreview)content.querySelectorAll('[data-kit-preview]').forEach(canvas=>renderPreview(canvas,cosmetics.find(kit=>kit.id===canvas.dataset.kitPreview)));
  if(focusKey)content.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`)?.focus({preventScroll:true});
 }
 function close(){if(dialog.open)dialog.close();}
 function open(which,event){tab=which;opener=event?.currentTarget||document.activeElement;refresh();dialog.querySelector('.career-status').textContent='';dialog.showModal();dialog.querySelector('.career-close').focus();}
 launcher.querySelectorAll('button').forEach(button=>button.addEventListener('click',event=>open(button.dataset.career,event)));
 dialog.querySelector('.career-close').addEventListener('click',close);
 dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();return;}
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.tab){tab=button.dataset.tab;refresh();dialog.querySelector('.career-status').textContent='';}
  if(button.dataset.island){onSelectIsland(button.dataset.island);refresh();dialog.querySelector('.career-status').textContent='INSEL GEWÄHLT · BEREIT ZUM ABHEBEN';}
  if(button.dataset.buy){const before=getProfile().owned.includes(button.dataset.buy);onBuy(button.dataset.buy);refresh();dialog.querySelector('.career-status').textContent=!before&&getProfile().owned.includes(button.dataset.buy)?'DEIN NEUER LOOK ✓':'NICHT GENUG MÜNZEN';}
  if(button.dataset.equip){onEquip(button.dataset.equip);refresh();dialog.querySelector('.career-status').textContent='LOOK AKTIV ✓';}
 });
 ['pointerdown','pointerup','keydown','keyup'].forEach(type=>dialog.addEventListener(type,event=>event.stopPropagation()));
 function showResults(summary={}){
  refresh();const earned=summary.earned??summary.coins??0,completed=summary.completedMissions?.length??0,unlockedCount=summary.unlockedIslands?.length??0;
  const profile=getProfile(),island=islands.find(i=>i.id===profile.selectedIsland)||islands[0],next=island.missions.filter(m=>missionValue(profile,island,m)<m.target).sort((a,b)=>missionValue(profile,island,b)/b.target-missionValue(profile,island,a)/a.target)[0];
  result.hidden=false;result.innerHTML=`<span>${coin} +${esc(earned)} IN DER GARAGE</span>${unlockedCount?`<strong>${esc(islands.find(i=>i.id===(summary.unlockedIslands[0]?.id||summary.unlockedIslands[0]))?.name||'NEUE INSEL')} FREI!</strong>`:completed?`<strong>${completed} MISSION${completed>1?'EN':''} GESCHAFFT ✓</strong>`:''}${next?`<span class="career-next-mission">${esc(next.label)} <b>${missionValue(profile,island,next)}/${next.target}</b><progress value="${missionValue(profile,island,next)}" max="${next.target}" aria-label="${esc(next.label)}"></progress></span>`:'<span>INSELPASS KOMPLETT ✓</span>'}`;
 }
 refresh();return {refresh,showResults,close};
}
 globalThis.JetlevCareer={mount};
})();
