(()=>{
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const navIcon=kind=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${kind==='home'?'<path d="m9 4 11 7-11 7z"/><path d="M3 20c2-2 4 2 6 0s4 2 6 0 4 2 6 0"/>':kind==='islands'?'<path d="M3 21h18M12 19V7m0 0C6 1 3 7 3 9c3-2 6-1 9-2Zm0 0c3-6 9-3 9 0-4-1-6 1-9 0Zm0 0c-4 0-7 4-5 7l5-7Zm0 0c6 0 7 5 6 7l-6-7Z"/>':'<path d="M4 21V8l8-5 8 5v13H4Zm4 0V11h8v10M8 15h8M8 18h8"/>'}</svg>`;
const navigation=attribute=>`<button type="button" ${attribute}="home">${navIcon('home')}<span>SPIELEN</span></button><button type="button" ${attribute}="islands">${navIcon('islands')}<span>INSELN</span></button><button type="button" ${attribute}="garage">${navIcon('garage')}<span>GARAGE</span></button>`;
const coin='<img src="assets/icons/coin.svg" alt="Münzen" width="22" height="22">';
function islandArt(index=0){return `<svg class="career-island-art" viewBox="0 0 240 72" aria-hidden="true" shape-rendering="crispEdges"><path fill="${['#57d8d3','#60c4d3','#eaaa82'][index]||'#57d8d3'}" d="M0 0h240v72H0z"/><path fill="#ffffff55" d="M12 18h39v3H12zm126 35h30v3h-30zm61-32h23v3h-23zM23 59h31v3H23z"/><path fill="#b7f0d2" d="M71 39h91v6h14v13h-14v6H67v-6H55V45h16z"/><path fill="#f5dd9c" d="M76 34h73v7h15v14H72v-6H61V40h15z"/><path fill="#3c955e" d="M86 29h53v8h13v9H77V36h9z"/><path fill="#78593d" d="M108 14h5v28h-5z"/><path fill="#176c47" d="M87 7h21V3h12v5h17v6h-20v6h-7v-6H88zm40 25h15v-5h6v24h-6V37h-14z"/><path fill="#fff" d="M185 40h23v5h-23zm4-19h3v19h-3z"/><path fill="#ed1c24" d="M193 22h4v4h4v4h4v5h-12z"/>${index===1?'<path fill="#705844" d="M155 34h68v8h-9v21h-5V42h-31v16h-5V42h-18z"/><path fill="#fff0cc" d="M162 23h9v11h-9zm32 0h9v11h-9z"/>':index===2?'<path fill="#3c6863" d="M56 38h8v-8h8v-8h8V12h12v10h8v8h8v8h8v10H56z"/><path fill="#fad2a8" d="M80 12h12v10h8v5H72v-5h8z"/>':''}</svg>`;}
function mount({getProfile,onSelectIsland,onBuy,onEquip,definitions,renderPreview}){
 const islands=definitions.islands,cosmetics=definitions.cosmetics;
 let tab='islands',opener=null;
 const launcher=document.createElement('div');launcher.className='career-launcher';
 launcher.setAttribute('aria-label','Hauptmenü');launcher.innerHTML=navigation('data-career');launcher.querySelector('[data-career=home]').setAttribute('aria-current','page');
 document.getElementById('intro').append(launcher);
 const page=document.createElement('section');page.className='career-page';page.hidden=true;page.setAttribute('aria-labelledby','career-title');
 page.innerHTML=`<header class="career-header"><button class="career-close" type="button" aria-label="Zurück zum Spiel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><div><span class="career-eyebrow">JETLEV · PARADISE GLIDE</span><h2 id="career-title">DEINE INSELN</h2></div><strong class="career-wallet">${coin}<span></span></strong></header><div class="career-content"></div><p class="career-status" role="status" aria-live="polite"></p><nav class="career-tabs" aria-label="Hauptmenü">${navigation('data-tab')}</nav>`;
 document.getElementById('cabinet').append(page);
 const result=document.createElement('div');result.className='career-result';result.hidden=true;document.querySelector('#result .score-card').after(result);
 function missionValue(profile,island,mission){return Math.min(mission.target,Math.max(0,Number(profile.islands?.[island.id]?.[mission.metric])||0));}
 function unlocked(profile,island,index){if(definitions.isUnlocked)return definitions.isUnlocked(profile,island.id);return index===0||islands.slice(0,index).every(i=>i.missions.every(m=>missionValue(profile,i,m)>=m.target));}
 function refresh(){
  const profile=getProfile(),selected=islands.find(i=>i.id===profile.selectedIsland)||islands[0];
  document.getElementById('home-island').innerHTML=esc(selected.name)+' <i>›</i>';
  document.getElementById('home-bank').textContent=profile.bank;
  const next=selected.missions.filter(m=>missionValue(profile,selected,m)<m.target).sort((a,b)=>missionValue(profile,selected,b)/b.target-missionValue(profile,selected,a)/a.target)[0];
  document.getElementById('home-mission-label').textContent=next?next.label:'INSELPASS KOMPLETT';
  document.getElementById('home-mission-value').textContent=next?`${missionValue(profile,selected,next)} / ${next.target}`:'✓';
  const progress=document.getElementById('home-mission-progress');progress.max=next?.target||1;progress.value=next?missionValue(profile,selected,next):1;
  page.querySelector('.career-wallet span').textContent=profile.bank;
  page.querySelector('#career-title').textContent=tab==='islands'?'DEINE INSELN':'DEIN LOOK';
  page.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-current',button.dataset.tab===tab?'page':'false'));
  const content=page.querySelector('.career-content'),focusKey=document.activeElement?.dataset?.focus;
  if(tab==='islands')content.innerHTML=`<p class="career-lead">3 MISSIONEN → NÄCHSTE INSEL<small>Jeder Run zählt.</small></p><div class="career-islands">${islands.map((island,index)=>{
   const open=unlocked(profile,island,index),active=profile.selectedIsland===island.id,done=island.missions.filter(m=>missionValue(profile,island,m)>=m.target).length;
   return `<article class="career-island ${active?'selected':''} ${open?'':'locked'}" style="--island-color:${esc(island.color)}">${islandArt(index)}<div class="career-island-heading"><div><span class="career-eyebrow">INSEL 0${index+1} · ${open?`${done}/3 ✓`:'GESPERRT'}</span><h3>${esc(island.name)}</h3></div><button type="button" data-island="${esc(island.id)}" data-focus="island-${esc(island.id)}" ${!open||active?'disabled':''}>${active?'AKTIV ✓':open?'WÄHLEN':'⌁'}</button></div>${open?`<div class="career-missions">${island.missions.map(m=>{const value=missionValue(profile,island,m);return `<div class="career-mission ${value>=m.target?'complete':''}"><div><span>${value>=m.target?'✓ ':''}${esc(m.label)}</span><b>${value}/${m.target}</b></div><progress value="${value}" max="${m.target}" aria-label="${esc(m.label)}"></progress></div>`;}).join('')}</div>`:`<p class="career-unlock">${esc(islands[index-1]?.name)} abschließen</p>`}</article>`;
  }).join('')}</div>`;
  else content.innerHTML=`<p class="career-lead">DEIN STIL. DEIN WASSERSTRAHL.</p><div class="career-garage">${cosmetics.map(kit=>{
   const owned=profile.owned.includes(kit.id),equipped=profile.equipped===kit.id;
   return `<article class="career-kit ${kit.rainbow?'rainbow-kit':''} ${equipped?'selected':''}"><canvas class="career-kit-preview" data-kit-preview="${esc(kit.id)}" width="160" height="150" aria-label="${esc(kit.name)} · Jetlev-Vorschau"></canvas><h3>${esc(({classic:'ORIGINAL',coral:'KORALLE',aqua:'LAGUNE',sunset:'ABENDGOLD',rainbow:'REGENBOGEN'})[kit.id]||kit.name)}</h3><button type="button" data-${owned?'equip':'buy'}="${esc(kit.id)}" data-focus="kit-${esc(kit.id)}" ${equipped||(!owned&&profile.bank<kit.price)?'disabled':''}>${equipped?'AKTIV ✓':owned?'ANZIEHEN':`${coin} ${kit.price}`}</button></article>`;
  }).join('')}</div><p class="career-note">Anzugdetails & Wasserlicht · rein kosmetisch</p>`;
  if(renderPreview)content.querySelectorAll('[data-kit-preview]').forEach(canvas=>renderPreview(canvas,cosmetics.find(kit=>kit.id===canvas.dataset.kitPreview)));
  if(focusKey)content.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`)?.focus({preventScroll:true});
 }
 function close(){if(page.hidden)return;page.hidden=true;document.getElementById('game').inert=false;document.getElementById('cabinet').classList.remove('menu-browsing');document.getElementById('intro').hidden=false;opener?.focus({preventScroll:true});}
 function open(which,event){if(which==='home'){close();return;}tab=which;opener=event?.currentTarget||document.activeElement;refresh();page.querySelector('.career-status').textContent='';document.getElementById('intro').hidden=true;page.hidden=false;document.getElementById('game').inert=true;document.getElementById('cabinet').classList.add('menu-browsing');page.querySelector('.career-content').scrollTop=0;page.querySelector('.career-close').focus();}
 launcher.querySelectorAll('button').forEach(button=>button.addEventListener('click',event=>open(button.dataset.career,event)));
 document.querySelectorAll('[data-open-islands]').forEach(button=>button.addEventListener('click',event=>open('islands',event)));
 page.querySelector('.career-close').addEventListener('click',close);
 page.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
 page.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.tab){if(button.dataset.tab==='home'){close();return;}tab=button.dataset.tab;refresh();page.querySelector('.career-content').scrollTop=0;page.querySelector('.career-status').textContent='';}
  if(button.dataset.island){onSelectIsland(button.dataset.island);refresh();page.querySelector('.career-status').textContent='INSEL GEWÄHLT · BEREIT ZUM ABHEBEN';}
  if(button.dataset.buy){const before=getProfile().owned.includes(button.dataset.buy);onBuy(button.dataset.buy);refresh();page.querySelector('.career-status').textContent=!before&&getProfile().owned.includes(button.dataset.buy)?'DEIN NEUER LOOK ✓':'NICHT GENUG MÜNZEN';}
  if(button.dataset.equip){onEquip(button.dataset.equip);refresh();page.querySelector('.career-status').textContent='LOOK AKTIV ✓';}
 });
 ['pointerdown','pointerup','keydown','keyup'].forEach(type=>page.addEventListener(type,event=>event.stopPropagation()));
 function showResults(summary={}){
  refresh();const earned=summary.earned??summary.coins??0,completed=summary.completedMissions?.length??0,unlockedCount=summary.unlockedIslands?.length??0;
  const profile=getProfile(),island=islands.find(i=>i.id===profile.selectedIsland)||islands[0],next=island.missions.filter(m=>missionValue(profile,island,m)<m.target).sort((a,b)=>missionValue(profile,island,b)/b.target-missionValue(profile,island,a)/a.target)[0];
  result.hidden=false;result.innerHTML=`<span>${coin} +${esc(earned)} IN DER GARAGE</span>${unlockedCount?`<strong>${esc(islands.find(i=>i.id===(summary.unlockedIslands[0]?.id||summary.unlockedIslands[0]))?.name||'NEUE INSEL')} FREI!</strong>`:completed?`<strong>${completed} MISSION${completed>1?'EN':''} GESCHAFFT ✓</strong>`:''}${next?`<span class="career-next-mission">${esc(next.label)} <b>${missionValue(profile,island,next)}/${next.target}</b><progress value="${missionValue(profile,island,next)}" max="${next.target}" aria-label="${esc(next.label)}"></progress></span>`:'<span>INSELPASS KOMPLETT ✓</span>'}`;
 }
 refresh();return {refresh,showResults,close};
}
 globalThis.JetlevCareer={mount};
})();
