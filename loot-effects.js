/* Small canvas companions and waterline timers for the island loot. */
(()=>{
 'use strict';
 let bursts=[],hudKey='';
 const colors={mini:'#80cfff',lifebuoy:'#ffd65c',coconut:'#dbb07a',treasurewave:'#ffb343',coinrain:'#ffe36a',comboanchor:'#83f5b1',daredevil:'#ff926f',bounty:'#fff0be',dolphin:'#8bdfff',ceasefire:'#70eace'};
 function reset(){bursts=[];hudKey='';const el=globalThis.document?.getElementById('loot-effects');if(el)el.replaceChildren();}
 function burst(kind,point){bursts.push({kind,...point,age:0});bursts=bursts.slice(-12);}
 function update(dt){for(const b of bursts)b.age+=dt;bursts=bursts.filter(b=>b.age<.85);}
 function hud(active){
  const el=globalThis.document?.getElementById('loot-effects');if(!el)return;
  const items=Object.entries(active).filter(([,v])=>v>0),key=items.map(([k,v])=>k+Math.ceil(v)).join();if(key===hudKey)return;hudKey=key;
  const catalog=globalThis.JetlevBonus?.rewards||[];
  el.innerHTML=items.map(([kind,time])=>{
   const item=catalog.find(r=>r.kind===kind);if(!item)return '';
   const color=globalThis.JetlevBonus.rarities[item.rarity].color;
   return `<div class="effect-card loot-chip${time<=2?' ending':''}" style="--effect-color:${color}" role="status" aria-label="${item.label}: ${Math.ceil(time)} Sekunden" title="${item.label}: ${item.description}"><span class="loot-chip-icon" aria-hidden="true">${item.icon}</span><strong>${Math.ceil(time)}<small>s</small></strong><div class="effect-track"><i style="width:${Math.min(100,time/item.amount*100)}%"></i></div></div>`;
  }).join('');
 }
 function draw(g,{p,t,W,H,active={},reducedMotion=false}){
  const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  const phase=reducedMotion?0:t,bob=Math.sin(phase*4)*2;
  function coconut(x,y){rect(x-5,y-4,10,8,'#533b31');rect(x-4,y-5,8,10,'#a57549');rect(x-3,y-4,3,6,'#d0a372');rect(x+1,y-2,1,1,'#352b28');rect(x+3,y,1,1,'#352b28');rect(x-2,y-8,7,2,'#8fea9c');rect(x+3,y-7,3,2,'#4ba57e');}
  for(const [kind,time]of Object.entries(active)){
   if(time<=0)continue;const color=colors[kind]||'#fff';g.save();
   if(time<1.5)g.globalAlpha=.65;
   if(kind==='dolphin'){
    const x=p.x-23,y=p.y+23+bob;rect(x-10,y-3,19,8,'#24526d');rect(x-7,y-5,13,10,'#24526d');rect(x+7,y-2,7,4,'#24526d');rect(x-9,y-2,17,6,'#42a9ce');rect(x-6,y-4,11,8,'#86dcf0');rect(x-4,y+2,10,3,'#d8f6e9');rect(x+7,y-1,6,2,'#86dcf0');rect(x-10,y-5+bob,3,8,'#4eabd0');rect(x-3,y-7,3,4,'#4eabd0');rect(x+4,y-3,1,1,'#142f47');rect(x-2,y+5,3,3,'#4eabd0');
   }else if(kind==='lifebuoy'){
    const x=p.x+19,y=p.y+19+bob;rect(x-7,y-3,13,7,'#db9d33');rect(x-6,y-4,11,5,'#ffdf6f');rect(x-3,y-2,5,2,'#28687b');rect(x+4,y-8,6,6,'#ffe988');rect(x+9,y-5,4,2,'#ff8658');rect(x+7,y-7,1,1,'#223944');
   }else if(kind==='coconut'){coconut(p.x-20,p.y+3+bob);rect(p.x-23,p.y+9+bob,10,2,'#77c89d');
   }else if(kind==='bounty'){
    const x=p.x-23,y=p.y-22;rect(x,y,2,18,'#dcb483');rect(x+2,y,13,9,'#273c53');rect(x+5,y+2,5,4,'#fff0be');rect(x+6,y+3,1,1,'#273c53');rect(x+9,y+3,1,1,'#273c53');rect(x+6,y+6,3,1,'#fff0be');
   }else if(kind==='comboanchor'){
    const x=p.x+19,y=p.y+17;for(let i=0;i<3;i++)rect(x,y-9+i*3,1,2,color);rect(x-1,y-1,3,8,color);rect(x-5,y+4,11,2,color);rect(x-6,y+1,2,4,color);rect(x+5,y+1,2,4,color);rect(x-3,y,7,1,color);
   }else if(kind==='ceasefire'){
    // Holiday shades and two soft peace rings distinguish the laser truce.
    rect(p.x-7,p.y-23,6,4,'#14354a');rect(p.x+1,p.y-23,6,4,'#14354a');rect(p.x-1,p.y-22,3,1,color);rect(p.x-6,p.y-23,3,1,color);rect(p.x+2,p.y-23,3,1,color);
    for(let i=0;i<2;i++){const q=(phase*.7+i*.5)%1;g.globalAlpha=(1-q)*.35;g.strokeStyle=color;g.lineWidth=1;g.beginPath();g.arc(p.x,p.y-7,18+q*14,0,Math.PI*2);g.stroke();}
   }else if(kind==='daredevil'){
    rect(p.x-5,p.y-28,12,2,color);rect(p.x-10,p.y-27+bob,6,2,color);rect(p.x-13,p.y-25+bob,4,2,'#ffc59a');
   }else if(kind==='mini'){
    for(const side of [-1,1]){rect(p.x+side*16,p.y-15,1,24,color);rect(p.x+side*16-(side>0?3:0),p.y-15,4,1,color);rect(p.x+side*16-(side>0?3:0),p.y+8,4,1,color);}
   }else if(kind==='coinrain'){
    for(let i=0;i<5;i++){const q=(phase*.55+i/5)%1,x=p.x-19+i*9,y=p.y-37+q*58;g.globalAlpha=Math.sin(q*Math.PI)*.8;rect(x,y,3,4,color);rect(x,y-4,1,2,'#fff1c0');}
   }else if(kind==='treasurewave'){rect(p.x-9,p.y+23,18,2,color);}
   g.restore();
  }
  for(const b of bursts){
   const q=b.age/.85,color=b.active===false?'#b6d4d4':colors[b.kind]||'#fff';g.save();g.globalAlpha=(1-q)**1.5*(b.active===false?.55:1);
   if(b.kind==='coconut'&&Number.isFinite(b.targetX)){
    const travel=Math.min(1,q*2.6),x=b.x+(b.targetX-b.x)*travel,y=b.y+(b.targetY-b.y)*travel-Math.sin(travel*Math.PI)*15;
    if(travel<1)coconut(x,y);else for(let i=0;i<7;i++)rect(x+Math.cos(i)*q*18,y+Math.sin(i)*q*18,2,3,i%2?color:'#fff2bc');
   }else{
    const radius=b.active===false?8+(1-q)*22:8+q*(b.kind==='treasurewave'?Math.min(W,160):30),count=reducedMotion?6:16;
    for(let i=0;i<count;i++){const a=i/count*Math.PI*2,x=b.x+Math.cos(a)*radius,y=b.y+Math.sin(a)*radius*.65;rect(x,y,2,i%3?2:4,i%3?color:'#fff');}
   }
   g.restore();
  }
 }
 globalThis.JetlevLootEffects={reset,burst,update,hud,draw};
})();
