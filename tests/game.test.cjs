const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements={},events={};let frame;
const gradient={addColorStop(){}};
const ctx=new Proxy({}, {get:(o,k)=>o[k]||(k==='createRadialGradient'?()=>gradient:()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const element=id=>elements[id] ||= {hidden:['hud','result','pause-screen','toast','event-badge'].includes(id),innerHTML:'',textContent:'',style:{setProperty(){}},classList:{toggle(){},remove(){},add(){}},setAttribute(){},focus(){},addEventListener(k,f){this[k]=f},setPointerCapture(){}};
Object.assign(element('game'),{getContext:()=>ctx,getBoundingClientRect:()=>({width:390,height:782})});
const sandbox={console,Math,Number,devicePixelRatio:1,localStorage:{getItem:()=>null,setItem(){}},ResizeObserver:class{observe(){}},document:{getElementById:element,createElement:()=>({getContext:()=>ctx}),addEventListener(){}},window:{matchMedia:()=>({matches:false}),addEventListener:(k,f)=>events[k]=f},requestAnimationFrame:f=>frame=f};
for(const path of ['level.js','effects.js','music.js','water.js','director.js','progression.js','theme.js'])vm.runInNewContext(fs.readFileSync(path,'utf8'),sandbox);
let source=fs.readFileSync('game.js','utf8');
// Test instrumentation stays outside the shipped game.
source=source.replace('resize();requestAnimationFrame(frame);',`globalThis.test={get:()=>({state,p,dist,coins,flow,charge,shield,magnet,invulnerable,gold,goldPending,obstacles,pickups,deathEffect,formations,jetFeel,held,toastRank,toastQueue,rewardRings,magnetVisual,profile,runPerfects,runShieldSaves,missionSignals,eruption,eruptionWarning,eruptionPending,eruptionVisual}),set:(fn)=>eval(fn),update,collectPower,makePattern,makeMeteor,updateEruption,hit};resize();requestAnimationFrame(frame);`);
sandbox.soundEvents=[];source=source.replace('function sfx(kind){','function sfx(kind){globalThis.soundEvents.push(kind);');
sandbox.vibrations=[];sandbox.navigator={vibrate:pattern=>sandbox.vibrations.push(Array.from(pattern))};
vm.runInNewContext(source,sandbox);const test=sandbox.test;
let now=0;const tick=n=>{for(let i=0;i<n;i++)frame(now+=1000/60)};
const reset=()=>{elements.start.onclick();test.set('obstacleTimer=100;coinTimer=100;powerTimer=100;');};
const pickup=power=>{test.set(`pickups=[{x:p.x,y:p.y-2,phase:0,power:'${power}'}];`);test.update(1/120);};
reset();tick(10);let y=test.get().p.y;elements.cabinet.pointerdown({target:{closest:()=>null},preventDefault(){},pointerId:1});tick(20);assert.ok(test.get().p.y<y);events.pointerup({pointerId:1});
pickup('shield');assert.equal(test.get().shield,9);test.set("obstacles=[{x:p.x,y:p.y,len:60,type:'gate'}]");test.update(1/120);assert.equal(test.get().state,'playing');assert.equal(test.get().shield,0);assert.ok(test.get().invulnerable>0);assert.equal(test.get().obstacles.length,0);
test.set("obstacles=[{x:p.x,y:p.y,type:'rocket'}]");test.update(1/120);assert.equal(test.get().state,'playing','shield grace avoids same-frame deaths');
reset();pickup('magnet');assert.equal(test.get().magnet,8);test.set('pickups=[{x:p.x+65,y:p.y-2,phase:0}];');const before=test.get().pickups[0].x;test.update(1/120);assert.ok(before-test.get().pickups[0].x>1,'magnet reaches farther than base FLOW');
pickup('flow');pickup('flow');test.update(.06);assert.ok(parseFloat(elements['flow-fill'].style.width)<=100);assert.ok(test.get().flow>8);
elements.pause.onclick();const timers=[test.get().flow,test.get().magnet];tick(60);assert.deepEqual([test.get().flow,test.get().magnet],timers);elements.resume.onclick();
reset();test.set('formations.set(1,{left:6,failed:false});');for(let i=0;i<6;i++){test.set('pickups=[{x:p.x,y:p.y-2,phase:0,group:1}];');test.update(1/120);}assert.equal(test.get().coins,11,'six coins plus PERFECT +5');assert.equal(test.get().formations.size,0);
reset();test.set('formations.set(1,{left:2,failed:false});pickups=[{x:-11,y:150,group:1,phase:0}];');test.update(1/120);test.set('pickups=[{x:p.x,y:p.y-2,group:1,phase:0}];');test.update(1/120);assert.equal(test.get().coins,1,'missed coins must not earn perfect bonus');
reset();test.set("dist=221;obstacles=[{x:p.x+45,y:70,len:45,type:'gate'}];");test.update(1/120);assert.equal(test.get().gold,0);assert.equal(test.get().goldPending,true);test.set('obstacles=[];');test.update(1/120);assert.equal(test.get().gold,6);assert.equal(test.get().obstacles.length,0);test.hit();assert.equal(elements['event-badge'].hidden,true);assert.ok(test.get().deathEffect);tick(30);assert.equal(test.get().state,'dying','explosion remains visible');tick(45);assert.equal(test.get().state,'over');assert.equal(elements.result.hidden,false);assert.equal(elements['event-badge'].hidden,true);
reset();assert.equal(test.get().shield,0);assert.equal(test.get().magnet,0);assert.equal(test.get().gold,0);assert.equal(test.get().deathEffect,null);assert.equal(test.get().coins,0);

// Rockets must give an off-screen warning window and travel in the indicated direction.
reset();test.set('dist=400;speed=level.speedAt(dist);');const savedRandom=Math.random;
try{Math.random=()=>.1;test.makePattern();}finally{Math.random=savedRandom;}
const rocket=test.get().obstacles.find(o=>o.type==='rocket');assert.ok(rocket,'rocket can spawn on a safe path');
const startX=rocket.x;assert.ok(startX>=160+126*1.45*.8,'visible warning lead-in');
test.update(1/120);assert.ok(rocket.x<startX,'rocket flies left');assert.ok(startX-rocket.x>126/120,'rocket moves faster than scenery');


reset();const touch=id=>elements.cabinet.pointerdown({target:{closest:()=>null},preventDefault(){},pointerId:id,pointerType:'touch'});
touch(1);touch(2);events.pointerup({pointerId:2});assert.equal(test.get().held,true,'first finger still supplies thrust');
elements.cabinet.lostpointercapture({pointerId:1});assert.equal(test.get().held,false,'lost capture releases thrust');
touch(3);events.pagehide();assert.equal(test.get().held,false);assert.equal(test.get().state,'paused','app switch pauses and clears input');
elements.resume.onclick();assert.equal(test.get().held,false,'resume never retains old touches');

reset();test.set('flow=6;');sandbox.soundEvents.length=0;
for(let i=0;i<5;i++){test.set('pickups=[{x:p.x,y:p.y-2,phase:0}];');test.update(1/120);}
assert.equal(sandbox.soundEvents.filter(e=>e==='streak').length,1,'dedicated fifth-coin sound also during FLOW');
assert.equal(test.get().toastRank,2);assert.ok(test.get().rewardRings.some(r=>r.strength>1));
pickup('magnet');assert.ok(test.get().toastQueue.some(e=>e.text==='MAGNET!'&&e.rank===3),'important rewards are queued');
tick(15);assert.ok(test.get().magnetVisual>.5,'magnet aura eases in');test.set('magnet=0;');tick(45);assert.ok(test.get().magnetVisual<.01,'magnet aura eases out');

reset();test.set('flow=6;pickups=[{x:p.x+45,y:p.y-2,phase:0}];');const passiveX=test.get().pickups[0].x;test.update(1/120);
assert.ok(Math.abs(passiveX-test.get().pickups[0].x-100/120)<.01,'coin multiplier does not secretly activate magnetism');
pickup('shield');test.update(.06);assert.equal(elements['shield-card'].hidden,false);assert.match(elements['shield-time'].innerHTML,/9<small>s/);
const starts=[],ends=[];
for(const kind of ['shield','magnet','flow','gold']){
 reset();sandbox.vibrations.length=0;
 test.set(`${kind}=1;`);test.update(1/120);
 assert.equal(sandbox.vibrations.length,1,'one activation cue');starts.push(JSON.stringify(sandbox.vibrations[0]));
 test.update(1/120);assert.equal(sandbox.vibrations.length,1,'no repeated activation each frame');
 test.set(`${kind}=0;`);test.update(.06);
 assert.equal(sandbox.vibrations.length,2,'one expiration cue');ends.push(JSON.stringify(sandbox.vibrations[1]));
 const timer=kind==='flow'?'flow-label':kind+'-time';
 assert.match(elements[timer].innerHTML,/ENDE/,'expiration remains readable');
 test.update(.7);assert.equal(sandbox.vibrations.length,2,'expiration is not repeated');
 if(kind!=='flow')assert.equal(elements[kind==='gold'?'event-badge':kind+'-card'].hidden,true);
}
assert.equal(new Set(starts).size,4,'distinct activation vibrations');
assert.equal(new Set(ends).size,4,'distinct expiration vibrations');
reset();const bankBefore=test.get().profile.bank;
test.set('coins=17;dist=123;runPerfects=2;runShieldSaves=1;');
const previousStats={...test.get().profile.islands.lagoon};
elements.pause.onclick();elements.quit.onclick();
assert.equal(test.get().profile.bank,bankBefore+17,'earned run coins reach garage');
assert.equal(test.get().profile.islands.lagoon.distance,previousStats.distance+123);
assert.equal(test.get().profile.islands.lagoon.perfects,previousStats.perfects+2);
assert.equal(test.get().profile.islands.lagoon.shieldSaves,previousStats.shieldSaves+1);
elements.quit.onclick();assert.equal(test.get().profile.bank,bankBefore+17,'repeat finish cannot duplicate bank');
// Completing a mission across runs must signal once, then persist only at finish.
test.set('Object.assign(profile,progression.load());profile.islands.lagoon.distance=599;profile.islands.lagoon.coins=59;profile.islands.lagoon.perfects=2;');
reset();test.set('dist=1;coins=1;runPerfects=1;missionFeedback();');
assert.equal(test.get().missionSignals.size,3,'cumulative run progress completes all three missions');
assert.equal(test.get().rewardRings.length,3);
test.set('missionFeedback();');
assert.equal(test.get().rewardRings.length,3,'mission feedback never repeats each frame');
assert.equal(test.get().profile.islands.lagoon.coins,59,'live previews do not prematurely bank coins');
const saved=new Map();sandbox.localStorage.setItem=(key,value)=>saved.set(key,String(value));
elements.pause.onclick();elements.quit.onclick();
let persisted=JSON.parse(saved.get(sandbox.JetlevProgression.KEY));
assert.equal(persisted.islands.lagoon.distance,600);
assert.equal(persisted.islands.lagoon.coins,60);
assert.equal(persisted.islands.lagoon.perfects,3);
assert.equal(sandbox.JetlevProgression.isUnlocked(persisted,'harbor'),true);

// Death and immediate replay each credit their own run, including when storage fails.
reset();const deathBank=test.get().profile.bank;test.set('coins=23;dist=80;');test.hit();tick(75);
assert.equal(test.get().state,'over');
assert.equal(test.get().profile.bank,deathBank+23,'death credits the finished run');
tick(60);elements.quit.onclick();
assert.equal(test.get().profile.bank,deathBank+23,'late frames and repeated finish cannot duplicate death credit');
elements.restart.onclick();test.set('obstacleTimer=100;coinTimer=100;powerTimer=100;');
assert.equal(test.get().coins,0,'replay starts with no stale coin earnings');
assert.equal(test.get().runPerfects,0);
sandbox.localStorage.setItem=()=>{throw Error('storage unavailable');};
test.set('coins=7;dist=40;');elements.pause.onclick();
assert.doesNotThrow(()=>elements.quit.onclick(),'private-mode write failure cannot block results');
assert.equal(test.get().state,'over');
assert.equal(test.get().profile.bank,deathBank+30,'in-memory career remains usable without storage');
reset();test.set('dist=421;gold=3;');test.updateEruption(.01);
assert.equal(test.get().eruptionPending,true);assert.equal(test.get().eruptionWarning,0,'eruption waits for bonus event');
test.set('gold=0;obstacles=[{type:"gate",x:p.x+50,y:90,len:40}];');test.updateEruption(.01);
assert.equal(test.get().eruptionWarning,0,'eruption waits for old hazards');
test.set('obstacles=[];');test.updateEruption(.01);assert.ok(test.get().eruptionWarning>2);
elements.pause.onclick();const warningTime=test.get().eruptionWarning;tick(30);assert.equal(test.get().eruptionWarning,warningTime,'paused warning freezes');elements.resume.onclick();
test.updateEruption(2.5);assert.equal(test.get().eruption,12);assert.match(elements['eruption-status'].innerHTML,/VULKAN/);
test.makeMeteor();const meteor=test.get().obstacles.find(o=>o.type==='meteor');assert.ok(meteor,'fair meteor spawn is possible');
const mx=meteor.x,my=meteor.y;test.update(1/120);assert.ok(meteor.x<mx&&meteor.y>my,'meteor travels diagonally down-left');
const beforeLava=test.get().coins;test.set('eruption=.01;');test.updateEruption(.02);assert.equal(test.get().coins,beforeLava,'survival waits for last meteor');test.set('obstacles=[];');test.updateEruption(.02);assert.equal(test.get().coins,beforeLava+15);test.updateEruption(.02);assert.equal(test.get().coins,beforeLava+15,'survival bonus only once');
test.set('obstacles=[];');test.updateEruption(4);assert.ok(test.get().eruptionVisual<.01,'lava blends away after last rock');
reset();assert.equal(test.get().eruption,0);assert.equal(test.get().eruptionVisual,0);
reset();test.set('shield=9;');tick(220);assert.equal(test.get().state,'over','no input must end in water even with shield');
reset();test.set('p.y=240;p.vy=88;held=true;');for(let i=0;i<40;i++)test.update(1/120);assert.equal(test.get().state,'playing','timely thrust recovers above water');
assert.ok(test.get().p.y<240);
console.log('PASS: flight, effects, career, eruption/meteors, fatal water contact and active recovery.');
