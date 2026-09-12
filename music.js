/* Original, quiet island miniatures. Notes are synthesized locally, never sampled. */
(() => {
 'use strict';
 const tracks=[
  {id:'lagoon-lullaby',name:'Lagunenlicht',bpm:88,bars:16,root:60,scale:[0,2,4,7,9],chords:[0,3,4,1],motif:[0,null,2,3,null,2,1,null,0,2,null,4,3,null,1,null]},
  {id:'palm-breeze',name:'Palmenwind',bpm:92,bars:16,root:65,scale:[0,2,4,7,9],chords:[0,4,1,3],motif:[2,null,1,null,0,2,null,3,4,null,3,2,null,1,null,0]},
  {id:'pearl-tide',name:'Perlenflut',bpm:84,bars:16,root:62,scale:[0,3,5,7,10],chords:[0,2,3,1],motif:[4,null,2,1,null,0,null,1,2,3,null,2,0,null,null,1]},
  {id:'sunset-sails',name:'Abendsegel',bpm:90,bars:16,root:67,scale:[0,2,4,7,9],chords:[0,1,3,4],motif:[0,null,null,1,2,null,4,3,null,2,1,null,3,2,null,0]}
 ];
 const hz=midi=>440*2**((midi-69)/12);
 const clamp=(value,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):min;
 function create({random=Math.random}={}) {
  let bag=[],track=null,previous=null,elapsed=0,step=0,next=0;
  function select(){
   if(!bag.length){
    bag=tracks.slice();
    for(let i=bag.length-1;i>0;i--){const j=Math.floor(clamp(random(),0,.999999)*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
    if(bag[0].id===previous)[bag[0],bag[1]]=[bag[1],bag[0]];
   }
   track=bag.shift();previous=track.id;elapsed=0;step=0;next=0;
  }
  function reset(){select();}
  function pitch(degree,octave=0){return track.root+track.scale[((degree%5)+5)%5]+Math.floor(degree/5)*12+octave*12;}
  function update(dt,{enabled=true,playing=true,duck=1,eruption=0}={},note){
   if(!enabled||!playing||typeof note!=='function')return;
   dt=clamp(dt,0,.1);if(!dt)return;
   if(!track)select();
   const interval=60/track.bpm/2,duration=interval*track.bars*8;
   elapsed+=dt;
   if(elapsed>=duration){select();return;}
   if(elapsed<next)return;
   // At most one musical subdivision per frame; a stalled tab never catches up.
   const current=step++,bar=Math.floor(current/8),beat=current%8;
   next=(current+1)*interval;
   const envelope=Math.min(1,elapsed/2,(duration-elapsed)/2);
   const gain=envelope*clamp(duck,0,1),tension=clamp(eruption,0,1);
   const chord=track.chords[Math.floor(bar/4)%4];
   const phrase=track.motif[current%track.motif.length];
   // A four-bar phrase answers itself one octave lower before returning home.
   if(phrase!==null&&!(bar%4===3&&beat>=5)){
    const octave=bar%8>=4?0:1;
    note(hz(pitch(phrase,octave)),interval*.78,'triangle',.009*gain,0);
   }
   if(beat===0||beat===4){
    note(hz(pitch(chord,-2)-(tension>.65&&bar%4===3?2:0)),interval*1.55,'sine',.011*gain,0);
   }else if(beat===2||beat===6){
    note(hz(pitch(chord+(beat===2?2:4),-1)),interval*.8,'sine',.006*gain,0);
   }
   // Sparse glints retain the 8-bit timbre without a constant sharp pulse layer.
   if(beat===3&&bar%4===1)note(hz(pitch(chord+4,1)),interval*.45,'square',.0015*gain,0);
  }
  return {update,reset,getState:()=>({trackId:track?.id??null,elapsed,step,bagRemaining:bag.length})};
 }
 globalThis.JetlevMusic=Object.freeze({tracks:tracks.map(({id,name,bpm,bars})=>Object.freeze({id,name,bpm,bars})),create});
})();
