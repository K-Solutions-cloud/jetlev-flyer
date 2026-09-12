/* Soft adaptive placement suggestions. The reachability planner has final say. */
(() => {
 'use strict';
 const clamp=(value,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):min;
 function create({random=Math.random}={}){
  let heat=new Array(6).fill(0),lastZone=2;
  const roll=()=>clamp(random(),0,.999999999);
  const zone=y=>Math.min(5,Math.floor((clamp(y,37,277)-37)/40));
  function reset(){heat.fill(0);lastZone=2;}
  function update(dt,y){
   dt=clamp(dt,0,.1);lastZone=zone(y);
   for(let i=0;i<6;i++){
    const target=i===lastZone?1:0;
    heat[i]+=(target-heat[i])*(1-Math.exp(-dt/(target?3:6)));
   }
  }
  function pick(distance,y){
   const progress=clamp(distance,0,2000)/2000,localHeat=heat[zone(y)];
   let aimChance=.1+.4*progress+.25*localHeat;
   // Release the beginner cap gradually, without a difficulty cliff at 80 m.
   aimChance=Math.min(.22+.53*clamp((distance-80)/720,0,1),aimChance);
   aimChance=Math.min(.75,aimChance);
   const aimed=roll()<aimChance,spread=42-22*progress;
   const center=aimed?clamp(y+(roll()*2-1)*spread,70,245):70+roll()*175;
   return {center,aimChance,aimed};
  }
  return {reset,update,pick,getState:()=>({heat:heat.slice(),lastZone})};
 }
 globalThis.JetlevDirector=Object.freeze({create});
})();
