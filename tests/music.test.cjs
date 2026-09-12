const assert=require('node:assert/strict');
require('../music.js');
const {create,tracks}=globalThis.JetlevMusic;
const music=create({random:()=>0});
const sequence=[];
for(let i=0;i<12;i++){music.reset();sequence.push(music.getState().trackId);}
for(let i=0;i<sequence.length;i+=4)assert.equal(new Set(sequence.slice(i,i+4)).size,4,'each shuffle visits all four tracks');
for(let i=1;i<sequence.length;i++)assert.notEqual(sequence[i],sequence[i-1],'shuffle boundary never repeats');
const notes=[];const play=(dt,state={})=>music.update(dt,{enabled:true,playing:true,...state},(...args)=>notes.push(args));
play(.1);let snapshot=music.getState(),count=notes.length;
play(999,{playing:false});play(999,{enabled:false});
assert.deepEqual(music.getState(),snapshot,'pause and mute freeze playback');assert.equal(notes.length,count);
play(999);assert.ok(music.getState().elapsed-snapshot.elapsed<=.100001,'stalled frame clamps elapsed');
assert.ok(notes.length-count<=3,'stalled frame never floods the scheduler');
const signatures=new Set();
for(let index=0;index<4;index++){
 music.reset();const id=music.getState().trackId,melody=[];let lastCount=0,maxFrame=0;
 for(let i=0;i<900;i++){
  music.update(.04,{enabled:true,playing:true,duck:1,eruption:.8},(...note)=>melody.push(note));
  maxFrame=Math.max(maxFrame,melody.length-lastCount);lastCount=melody.length;
 }
 assert.ok(maxFrame<=3,'at most three lightweight voices per subdivision');
 assert.ok(melody.length>50&&melody.length<220,'rests prevent constant dense music');
 for(const [frequency,duration,type,volume,delay] of melody){assert.ok(frequency>=30&&frequency<=2500);assert.ok(duration>0&&duration<1);assert.ok(volume>=0&&volume<=.011);assert.equal(delay,0);assert.ok(['triangle','sine','square'].includes(type));}
 signatures.add(JSON.stringify(melody.map(note=>note.slice(0,3))));
 assert.equal(music.getState().trackId,id,'each composition runs longer than 36 seconds');
}
assert.equal(signatures.size,4,'four tracks have distinct composed note sequences');
const auto=create({random:()=>.4});auto.update(.1,{},()=>{});const first=auto.getState().trackId;
for(let i=0;i<600;i++)auto.update(.1,{},()=>{});
assert.notEqual(auto.getState().trackId,first,'playlist advances automatically');
assert.equal(tracks.length,4);
console.log('PASS: original music sequences, shuffle fairness, automatic transitions, pause/mute freeze and bounded synth voices.');
