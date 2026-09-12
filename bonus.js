(()=>{
  const rarities={common:{color:'#ffffff',label:'GEWÖHNLICH',weight:25},uncommon:{color:'#1eff00',label:'UNGEWÖHNLICH',weight:35},rare:{color:'#0070dd',label:'SELTEN',weight:25},epic:{color:'#a335ee',label:'EPISCH',weight:13},legendary:{color:'#ff8000',label:'LEGENDÄR',weight:2}};
  const rewards=[
    ['shield',9,'SCHILD · 9s','◇','uncommon','Fängt einen Treffer ab.'],['magnet',8,'MAGNET · 8s','∩','uncommon','Zieht Münzen zu dir.'],['boost',5,'TURBO · 5s','↑↑','rare','Schneller steigen und sinken.'],['gold',6,'GOLD RUSH · 6s','★','epic','Eine sichere Welle voller Gold.'],['coins',30,'+30 MÜNZEN','$','common','Direkt in deine Reisekasse.'],
    ['ceasefire',8,'HAI-FERIEN · 8s','☀','rare','Augenlaser verpuffen. Fischen ausweichen!'],['mini',8,'MINI FLIEGER · 8s','↘','rare','Kleiner Pilot, kleinere Trefferfläche.'],['lifebuoy',20,'RETTUNGSENTE · 20s','◉','epic','Rettet dich einmal aus dem Wasser.'],['coconut',8,'KOKOSKANONE · 8s','●','epic','Knackt Hindernisse vor dir.'],['treasurewave',0,'MIDAS-WELLE','✦','legendary','Alle sichtbaren Gefahren werden zu Münzen.'],['coinrain',7,'MÜNZENMONSUN · 7s','$↓','uncommon','Mehr erreichbare Münzenbahnen.'],['comboanchor',9,'STREAK-ANKER · 9s','⚓','uncommon','Deine Streak läuft nicht ab.'],['daredevil',8,'MUTPROBE · 8s','!','rare','Knapp vorbei? Acht Extra-Münzen!'],['bounty',8,'PIRATENPRÄMIE · 8s','⚑','uncommon','Zwei Münzen je passiertem Hindernis.'],['dolphin',8,'DELFIN-POST · 8s','≈','epic','Ein Delfin sammelt verpasste Münzen.']
  ].map(([kind,amount,label,icon,rarity,description])=>Object.freeze({kind,amount,label,icon,rarity,description}));
  Object.freeze(rewards);for(const rarity of Object.values(rarities))Object.freeze(rarity);Object.freeze(rarities);
  function roll(random=Math.random){
    if(random()<.01)return{heaven:true};
    let pick=random()*100,rarity='legendary';
    for(const [key,value]of Object.entries(rarities)){pick-=value.weight;if(pick<0){rarity=key;break;}}
    const pool=rewards.filter(item=>item.rarity===rarity);
    return{...pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]};
  }
  function layout(reward,random=Math.random){
    const others=rewards.filter(item=>item.kind!==reward.kind),cells=[reward.kind,reward.kind,reward.kind,...others.flatMap(item=>[item.kind,item.kind]).slice(0,6)];
    for(let i=cells.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
    return cells;
  }
  function mount({onReward=()=>{},onResume=()=>{},onCue=()=>{}}={}){
    const overlay=document.createElement('section');overlay.className='bonus-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','bonus-heading');
    document.querySelector('.cabinet').append(overlay);
    let opened=false,won=false,previousFocus,frame=0,resetClock;
    document.addEventListener('visibilitychange',()=>{if(opened){resetClock?.();overlay.classList.toggle('bonus-hidden',document.hidden);}});
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','click','keyup'])overlay.addEventListener(type,event=>event.stopPropagation());
    overlay.addEventListener('keydown',event=>{
      event.stopPropagation();
      if(event.key==='Tab'){
        const buttons=[...overlay.querySelectorAll('button:not(:disabled):not([hidden]),summary')],first=buttons[0],last=buttons.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    });
    function close(){cancelAnimationFrame(frame);resetClock=null;opened=false;overlay.hidden=true;overlay.replaceChildren();previousFocus?.focus?.();}
    function scratch(selected){
      overlay.innerHTML='<div class="bonus-ticket"><span class="bonus-eyebrow">✦ INSELGLÜCK ✦</span><h2 id="bonus-heading">PARADISE LOS</h2><p class="bonus-instruction">3 GLEICHE = BONUS</p><div class="bonus-grid"></div><p class="bonus-result" role="status" aria-live="polite">Rubbel dein Glück frei!</p><button class="bonus-continue" disabled>WEITER</button><span class="bonus-footnote">Gratis-Bonus · jedes Los gewinnt</span></div>';
      overlay.hidden=false;
      const grid=overlay.querySelector('.bonus-grid'),result=overlay.querySelector('.bonus-result'),resume=overlay.querySelector('.bonus-continue');let matches=0;
      resume.onclick=()=>{if(!opened||!won)return;close();onResume();};
      for(const [index,kind]of layout(selected).entries()){
        const item=rewards.find(entry=>entry.kind===kind),button=document.createElement('button');button.className='bonus-tile';button.setAttribute('aria-label',`Losfeld ${index+1} freirubbeln`);
        button.innerHTML=`<span class="bonus-symbol" aria-hidden="true">${item.icon}</span><span class="bonus-tile-name" aria-hidden="true">${item.label.split(' · ')[0]}</span><canvas width="160" height="140" aria-hidden="true"></canvas>`;
        grid.append(button);
        const canvas=button.querySelector('canvas'),ctx=canvas.getContext('2d'),covered=new Set();let revealed=false,pointer=null,last=null,cueAt=0;
        const coat=ctx.createLinearGradient(0,0,160,140);coat.addColorStop(0,'#a9ebcc');coat.addColorStop(.48,'#e0ffe5');coat.addColorStop(1,'#68bfa8');ctx.fillStyle=coat;ctx.fillRect(0,0,160,140);ctx.fillStyle='#4e9f8b';
        for(let y=0;y<140;y+=16)for(let x=(y%32?8:0);x<160;x+=16)ctx.fillRect(x,y,2,2);
        ctx.font='bold 51px sans-serif';ctx.textAlign='center';ctx.fillStyle='#176655';ctx.fillText('$',80,87);
        function reveal(){
          if(revealed||!opened||won)return;revealed=true;button.classList.add('revealed');button.setAttribute('aria-label',item.label);button.setAttribute('aria-disabled','true');onCue('reveal',selected.rarity);
          if(kind===selected.kind){button.classList.add('matching');matches++;}
          result.textContent=matches?`${matches}/3 ${selected.label.split(' · ')[0]}`:'Weiter rubbeln!';
          if(matches===3){won=true;overlay.classList.add('bonus-won');result.textContent=selected.label;resume.disabled=false;onReward(selected.kind,selected.amount);onCue('win',selected.rarity);resume.focus();}
        }
        function erase(x,y){
          ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,19,0,Math.PI*2);ctx.fill();
          for(let gy=0;gy<7;gy++)for(let gx=0;gx<8;gx++)if(Math.hypot(gx*20+10-x,gy*20+10-y)<21)covered.add(gy*8+gx);
          if(covered.size>=12)reveal();
        }
        function scratch(event){
          if(revealed||won)return;
          const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*160/rect.width,y=(event.clientY-rect.top)*140/rect.height;
          const from=last||{x,y},steps=Math.max(1,Math.ceil(Math.hypot(x-from.x,y-from.y)/8));
          for(let step=1;step<=steps;step++)erase(from.x+(x-from.x)*step/steps,from.y+(y-from.y)*step/steps);
          last={x,y};if(event.timeStamp-cueAt>90){cueAt=event.timeStamp;onCue('scratch');}
        }
        canvas.onpointerdown=event=>{if(pointer!==null)return;event.preventDefault();pointer=event.pointerId;last=null;canvas.setPointerCapture(pointer);scratch(event);};
        canvas.onpointermove=event=>{if(event.pointerId===pointer){event.preventDefault();scratch(event);}};
        canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=event=>{if(event.pointerId===pointer){pointer=null;last=null;}};
        button.onclick=event=>{if(event.detail===0)reveal();};
      }
      overlay.classList.remove('bonus-won');grid.querySelector('button').focus();
    }
    function open(reward){
      if(opened)return;
      const selected=rewards.find(item=>item.kind===reward.kind);if(!selected)return;
      opened=true;won=false;previousFocus=document.activeElement;
      overlay.classList.remove('bonus-won','bonus-hidden');overlay.dataset.rarity=selected.rarity;overlay.style.setProperty('--prize-pop',1.05+Object.keys(rarities).indexOf(selected.rarity)*.025);overlay.style.setProperty('--rarity',rarities[selected.rarity].color);
      overlay.innerHTML=`<div class="bonus-ticket bonus-loot"><span class="bonus-eyebrow">✦ INSELGLÜCK ✦</span><h2 id="bonus-heading">PARADISE<br>SCHATZ</h2><p class="bonus-instruction">DEIN GRATIS-BONUS</p><div class="bonus-chest" aria-hidden="true"><div class="bonus-rays"></div><svg viewBox="0 0 96 76" shape-rendering="crispEdges"><path fill="#063b3f" d="M10 36h76v34H10z"/><path fill="#a85b2e" d="M14 38h68v26H14z"/><path fill="#e89a46" d="M18 40h60v7H18z"/><path fill="#7b3d2b" d="M18 52h60v5H18z"/><path fill="#f5d775" d="M20 38h8v26h-8zm48 0h8v26h-8zM10 62h76v6H10z"/><g class="bonus-chest-lid"><path fill="#07383c" d="M10 18h8V10h60v8h8v22H10z"/><path fill="#bd7031" d="M14 22h68v12H14zm8-8h52v8H22z"/><path fill="#ffe393" d="M20 14h8v20h-8zm48 0h8v20h-8zM14 32h68v6H14z"/><path fill="#f6bc51" d="M40 30h16v18H40z"/><path fill="#174641" d="M46 35h4v8h-4z"/></g><path fill="#72ebbc" d="M4 48h6v6H4zm80-40h4v4h-4zM32 4h4v4h-4z"/></svg></div><div class="bonus-reel" hidden><span class="bonus-pointer" aria-hidden="true">▼</span><div class="bonus-track"></div></div><p class="bonus-result" role="status" aria-live="polite">Was steckt in deiner Truhe?</p><p class="bonus-description"></p><button class="bonus-open">TRUHE ÖFFNEN</button><button class="bonus-scratch">LIEBER RUBBELN</button><button class="bonus-continue" hidden disabled>WEITER</button><details class="bonus-odds"><summary>CHANCEN</summary><p>Pro Geldschein: 1 % Himmel · 99 % Bonus. In jeder Truhe und jedem Los:</p>${Object.values(rarities).map(r=>`<span style="color:${r.color}">${r.label} ${r.weight} %</span>`).join('')}<p>Gleiche Chance je Bonus einer Seltenheit.</p></details><span class="bonus-footnote">Gratis · jedes Öffnen gewinnt</span></div>`;
      overlay.hidden=false;
      const openButton=overlay.querySelector('.bonus-open'),scratchButton=overlay.querySelector('.bonus-scratch'),resume=overlay.querySelector('.bonus-continue'),result=overlay.querySelector('.bonus-result'),description=overlay.querySelector('.bonus-description'),chest=overlay.querySelector('.bonus-chest'),reel=overlay.querySelector('.bonus-reel'),track=overlay.querySelector('.bonus-track');
      scratchButton.onclick=()=>scratch(selected);
      resume.onclick=()=>{if(!opened||!won)return;close();onResume();};
      openButton.onclick=()=>{
        if(openButton.disabled)return;openButton.disabled=true;scratchButton.hidden=true;openButton.hidden=true;resume.hidden=false;
        overlay.querySelector('.bonus-odds').open=false;chest.classList.add('opening');onCue('open',selected.rarity);result.textContent='DEIN SCHATZ …';
        const cards=Array.from({length:32},()=>rewards[Math.floor(Math.random()*rewards.length)]);cards[27]=selected;
        track.innerHTML=cards.map(item=>`<div class="bonus-card" style="--card-rarity:${rarities[item.rarity].color}"><span aria-hidden="true">${item.icon}</span><b>${item.label.split(' · ')[0]}</b><small>${rarities[item.rarity].label}</small></div>`).join('');
        const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let elapsed=0,last=performance.now(),lastCard=-1;
        resetClock=()=>{last=performance.now();};
        function animate(now){
          if(!opened)return;
          const delta=now-last;last=now;if(!document.hidden)elapsed+=Math.min(delta,100);
          const delay=reduced?0:520,duration=reduced?200:3450,progress=Math.max(0,Math.min(1,(elapsed-delay)/duration));
          if(elapsed>=delay){chest.hidden=true;reel.hidden=false;}
          const stride=104,offset=(reel.clientWidth-96)/2,travel=27*(1-Math.pow(1-progress,3));
          track.style.transform=`translate3d(${offset-travel*stride}px,0,0)`;
          const card=Math.round(travel);if(card!==lastCard&&elapsed>=delay){lastCard=card;if(!reduced)onCue('tick',cards[card].rarity);}
          if(progress<1){frame=requestAnimationFrame(animate);return;}
          won=true;overlay.classList.add('bonus-won');track.children[27].classList.add('bonus-prize');result.textContent=selected.label;description.textContent=rarities[selected.rarity].label+' · '+selected.description;resume.disabled=false;
          onReward(selected.kind,selected.amount);onCue('win',selected.rarity);resume.focus();
        }
        frame=requestAnimationFrame(animate);
      };
      openButton.focus();
    }
    return{open,close,isOpen:()=>opened};
  }
  globalThis.JetlevBonus={roll,layout,mount,rewards,rarities};
})();
