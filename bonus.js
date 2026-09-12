(()=>{
  const rewards=[{kind:'shield',amount:9,label:'SCHILD · 9s',icon:'◇'},{kind:'magnet',amount:8,label:'MAGNET · 8s',icon:'∩'},{kind:'boost',amount:5,label:'TURBO · 5s',icon:'↑↑'},{kind:'gold',amount:6,label:'GOLD RUSH · 6s',icon:'★'},{kind:'coins',amount:30,label:'+30 MÜNZEN',icon:'$'}];
  function roll(random=Math.random){return random()<.01?{heaven:true}:{...rewards[Math.floor(random()*rewards.length)]};}
  function layout(reward,random=Math.random){
    const others=rewards.filter(item=>item.kind!==reward.kind),cells=[reward.kind,reward.kind,reward.kind,...others.flatMap(item=>[item.kind,item.kind]).slice(0,6)];
    for(let i=cells.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
    return cells;
  }
  function mount({onReward=()=>{},onResume=()=>{},onCue=()=>{}}={}){
    const overlay=document.createElement('section');overlay.className='bonus-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','bonus-heading');
    document.querySelector('.cabinet').append(overlay);
    let opened=false,won=false,previousFocus;
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','click','keyup'])overlay.addEventListener(type,event=>event.stopPropagation());
    overlay.addEventListener('keydown',event=>{
      event.stopPropagation();
      if(event.key==='Tab'){
        const buttons=[...overlay.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    });
    function close(){opened=false;overlay.hidden=true;overlay.replaceChildren();previousFocus?.focus?.();}
    function open(reward){
      if(opened)return;
      const selected=rewards.find(item=>item.kind===reward.kind);if(!selected)return;
      opened=true;won=false;previousFocus=document.activeElement;
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
          if(revealed||!opened||won)return;revealed=true;button.classList.add('revealed');button.setAttribute('aria-label',item.label);button.setAttribute('aria-disabled','true');onCue('reveal');
          if(kind===selected.kind){button.classList.add('matching');matches++;}
          result.textContent=matches?`${matches}/3 ${selected.label.split(' · ')[0]}`:'Weiter rubbeln!';
          if(matches===3){won=true;overlay.classList.add('bonus-won');result.textContent=selected.label;resume.disabled=false;onReward(selected.kind,selected.amount);onCue('win');resume.focus();}
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
    return{open,close,isOpen:()=>opened};
  }
  globalThis.JetlevBonus={roll,layout,mount};
})();
