/* Momentum-carrying water filaments, surface foam and quiet pixel ripples. */
(() => {
 'use strict';
 const spectrum=['#ff6480','#ffb65e','#ffe873','#7aeeae','#64d5ff','#a39bff','#df8eff'];
 const clamp=(n,a,b)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;
 function create({random=Math.random}={}){
  let particles=[],ripples=[],clock=0,carry=0,jetSpeed=100,emitted=0,impacts=0;
  const rand=(a,b)=>a+(b-a)*clamp(random(),0,1);
  function reset(){particles=[];ripples=[];clock=carry=emitted=impacts=0;jetSpeed=100;}
  function update(dt,{nozzles=[],thrust=0,velocityY=0,color='#c9fbff',rainbow=false,surface=303,reducedMotion=false,widthScale=1}={}){
   dt=clamp(dt,0,.05);if(!dt)return;
   clock+=dt;const amount=clamp(thrust,0,1),cap=reducedMotion?72:180;
   jetSpeed+=(100+90*amount-jetSpeed)*(1-Math.exp(-dt*8));
   // Each parcel keeps the pilot's velocity at release, then follows its own arc.
   for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.age+=dt;p.vx*=Math.exp(-dt*.3);
    p.x+=p.vx*dt;p.y+=p.vy*dt+60*dt*dt;p.vy+=120*dt;
    if(p.y>=surface||p.age>2.3){
     if(p.y>=surface){
      impacts++;
      const near=ripples.find(r=>r.age<.1&&Math.abs(r.x-p.x)<8);
      if(!near&&ripples.length<(reducedMotion?5:14))ripples.push({x:p.x,y:surface,age:0,life:reducedMotion?.35:.6,width:rand(4,8)});
     }
     particles.splice(i,1);
    }
   }
   for(let i=ripples.length-1;i>=0;i--){ripples[i].age+=dt;if(ripples[i].age>=ripples[i].life)ripples.splice(i,1);}
   if(!nozzles.length){carry=0;return;}
   carry+=dt*(reducedMotion?22:42);
   while(carry>=1){
    carry--;
    for(let index=0;index<Math.min(nozzles.length,2);index++){
     const nozzle=nozzles[index];if(!Number.isFinite(nozzle.x)||!Number.isFinite(nozzle.y))continue;
     if(particles.length>=cap)particles.shift();
     const tint=rainbow?spectrum[Math.floor(clock*4)%spectrum.length]:color;
     particles.push({x:nozzle.x+rand(-.45,.45),y:nozzle.y,originY:nozzle.y,vx:(index===0?-1:1)*rand(1,5),vy:jetSpeed+clamp(velocityY,-120,120)*.65,age:0,life:2.3,color:tint,rainbow,width:(reducedMotion?2.5:rand(2,3.2))*clamp(widthScale,1,2),length:reducedMotion?11:rand(8,12)});
     emitted++;
    }
   }
  }
  function draw(g){
   g.save();
   for(const p of particles){
    const fade=Math.min(1,(p.life-p.age)*2),length=Math.max(1,Math.min(18,p.length+p.age*4,p.y-p.originY+1));
    // Adjacent parcels overlap into a continuous flexible filament; the bright
    // narrow center makes thrust readable even against pale clouds.
    g.globalAlpha=.24*fade;g.fillStyle=p.color;
    g.fillRect(Math.round(p.x-p.width),Math.round(p.y-length),Math.ceil(p.width*2),Math.ceil(length));
    g.globalAlpha=.78*fade;
    g.fillRect(Math.round(p.x-p.width*.45),Math.round(p.y-length),Math.max(1,Math.round(p.width*.9)),Math.ceil(length));
    g.globalAlpha=(p.rainbow?.3:.65)*fade;g.fillStyle='#f1fffa';
    g.fillRect(Math.round(p.x),Math.round(p.y-length*.7),1,Math.ceil(length*.65));
   }
   for(const r of ripples){
    const q=r.age/r.life,w=r.width+q*17;g.globalAlpha=(1-q)*.65;g.fillStyle='#e3fff5';
    g.fillRect(Math.round(r.x-w/2),Math.round(r.y),Math.round(w),1);
    g.fillRect(Math.round(r.x-w*.3),Math.round(r.y+2),Math.round(w*.6),1);
    if(q<.5){const lift=Math.sin(q*Math.PI)*4;g.fillRect(Math.round(r.x-w*.35),Math.round(r.y-lift),2,2);g.fillRect(Math.round(r.x+w*.35),Math.round(r.y-lift*.8),1,2);}
   }
   g.restore();
  }
  return {update,draw,reset,getState:()=>({particles:particles.map(p=>({...p})),ripples:ripples.map(r=>({...r})),jetSpeed,emitted,impacts})};
 }
 globalThis.JetlevWater=Object.freeze({create});
})();
