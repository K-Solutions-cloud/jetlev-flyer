(() => {
'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const screen=document.createElement('canvas');let g=screen.getContext('2d',{alpha:false});
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const level=globalThis.JetlevLevel;
const fx=globalThis.JetlevEffects;
const soundtrack=globalThis.JetlevMusic.create();
const water=globalThis.JetlevWater.create();
const director=globalThis.JetlevDirector.create();
const progression=globalThis.JetlevProgression,theme=globalThis.JetlevTheme;
const profile=progression.load();
let career=null,runId='',runIsland=profile.selectedIsland,runPerfects=0,runShieldSaves=0,runCommitted=false;
let missionSignals=new Set();
let previewKit=null;
const currentKit=()=>previewKit||progression.cosmetics.find(item=>item.id===profile.equipped)||progression.cosmetics[0];
const C={ink:'#252640',cream:'#ffffff',yellow:'#ffe36a',mint:'#6cf4df'};
let W=480,H=320,state='home',last=0,acc=0,t=0,world=0,held=false,dist=0,coins=0,best=0,charge=0,flow=0,milestone=100,speed=100,obstacleTimer=2,coinTimer=.5,shake=0,flash=0,combo=0,comboLife=0,startAge=0,toastLife=0,deathTimer=0,uiTimer=0;
let effectMemory={shield:false,magnet:false,flow:false,gold:false};
let effectExit={shield:0,magnet:0,flow:0,gold:0};
let effectCues=[];
let flowMax=6;
let toastRank=0,toastQueue=[],rewardDuck=0,magnetVisual=0;
let shield=0,magnet=0,invulnerable=0,powerTimer=10,powerIndex=0;
let eruption=0,eruptionWarning=0,eruptionVisual=0,eruptionPending=false,eruptionFinishing=false,meteorTimer=0,nextEruption=420;
let gold=0,goldPending=false,nextGold=220,formationId=0,formations=new Map();
let jetFeel=0,renderY=155,previousY=155,deathEffect=null,impactHold=0,rewardRings=[];
let reservations=[],obstacles=[],pickups=[],particles=[],texts=[],p={x:100,y:140,vy:0},audio,sound=true,jetNode,jetGain,jetFilter,musicBus;
try{best=+localStorage.getItem('jetlev-pixel-best')||0;}catch{}
$('best').textContent=best+' m';
let previousAspect=0;
const activePointers=new Set(),activeKeys=new Set();
function clearInput(){activePointers.clear();activeKeys.clear();held=false;}
function resize(){
 const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;
 const aspect=r.width/r.height,oldX=p.x;water.reset();
 if(previousAspect&&Math.abs(Math.log(aspect/previousAspect))>.25)pause();
 previousAspect=aspect;H=320;W=Math.max(120,Math.round(aspect*H));
 screen.width=W;screen.height=H;
 const ratio=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);
 ctx.imageSmoothingEnabled=false;g.imageSmoothingEnabled=false;
 p.x=W*.27;const shift=p.x-oldX;
 // Preserve relative encounter distances and reserved routes on rotation.
 for(const item of [...obstacles,...pickups,...reservations,...particles,...texts,...rewardRings])item.x+=shift;
 if(deathEffect){deathEffect.x+=shift;for(const particle of deathEffect.particles)particle.x+=shift;}
 previousY=renderY=p.y;
}
new ResizeObserver(resize).observe(canvas);
// Rare surfer callouts: local clips, once per milestone/run, ten seconds apart.
const streakClips=['nice','whoa','awesome'];
const voiceBuffers={},voiceLoads={};
let streakSource=null,voiceToken=0,lastVoiceAt=-Infinity,lastVoiceClip='',voiceMilestones=new Set();
function loadVoice(name){
 if(voiceBuffers[name])return Promise.resolve(voiceBuffers[name]);
 if(!voiceLoads[name]&&audio&&typeof fetch==='function')voiceLoads[name]=fetch('assets/audio/'+name+'.mp3')
  .then(r=>{if(!r.ok)throw Error('Voice unavailable');return r.arrayBuffer();})
  .then(bytes=>audio.decodeAudioData(bytes)).then(buffer=>voiceBuffers[name]=buffer)
  .catch(()=>{delete voiceLoads[name];return null;});
 return voiceLoads[name]||Promise.resolve(null);
}
function stopVoice(){voiceToken++;if(streakSource){streakSource.stop();streakSource=null;}}
function streakVoice(text){
 const match=/^(\d+) STREAK!$/.exec(text);if(!match)return null;
 const count=Number(match[1]);
 if(![15,30,50].includes(count)&&!(count>=100&&count%50===0))return null;
 if(voiceMilestones.has(count)||startAge-lastVoiceAt<10)return null;
 const pool=streakClips.filter(name=>name!==lastVoiceClip);
 return {count,name:count===15?'nice':count===30?'whoa':count===50?'awesome':pool[Math.floor(Math.random()*pool.length)]};
}
async function speakStreak(text){
 if(!sound||!audio||state!=='playing'||streakSource)return;
 const cue=streakVoice(text);if(!cue)return;
 const token=++voiceToken,buffer=voiceBuffers[cue.name]||await loadVoice(cue.name);
 if(!buffer||token!==voiceToken||!sound||state!=='playing'||$('toast').textContent!==text||toastLife<=0||!streakVoice(text))return;
 const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffer;
 gain.gain.value=.7;source.connect(gain);gain.connect(audio.destination);
 source.onended=()=>{source.disconnect();gain.disconnect();if(streakSource===source)streakSource=null;};
 streakSource=source;voiceMilestones.add(cue.count);lastVoiceAt=startAge;lastVoiceClip=cue.name;
 rewardDuck=Math.max(rewardDuck,buffer.duration);source.start();
}
function initAudio(){if(!sound)return;try{if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();const b=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);const data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;jetNode=audio.createBufferSource();jetNode.buffer=b;jetNode.loop=true;jetFilter=audio.createBiquadFilter();jetFilter.type='lowpass';jetFilter.frequency.value=600;jetGain=audio.createGain();jetGain.gain.value=0;jetNode.connect(jetFilter);jetFilter.connect(jetGain);jetGain.connect(audio.destination);musicBus=audio.createGain();musicBus.gain.value=0;musicBus.connect(audio.destination);jetNode.start();streakClips.forEach(loadVoice);}audio.resume().catch(()=>{});}catch{sound=false;}}
function note(f,d=.1,type='square',vol=.035,delay=0,end=f,bus){if(!sound||!audio)return;const at=audio.currentTime+delay,o=audio.createOscillator(),gain=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,at);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+d);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(vol,at+.005);gain.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(gain);gain.connect(bus||audio.destination);o.start(at);o.stop(at+d+.01);}
function sfx(kind){if(kind==='streak'){[784,1046,1174,1568,2093].forEach((f,i)=>note(f,i===4?.25:.12,'triangle',.075,i*.055));note(196,.3,'sine',.065,0,98);note(1568,.24,'sine',.022,.25);rewardDuck=.5;}if(kind==='coin'){const f=[784,880,1046,1174,1318][(Math.max(1,combo)-1)%5];note(f,.065,'square',.025);note(f*1.5,.09,'square',.022,.045);}if(kind==='start')[523,659,784,1046].forEach((f,i)=>note(f,.12,'square',.028,i*.07));if(kind==='hit'){note(160,.35,'sawtooth',.055,0,35);note(75,.4,'triangle',.13);}if(kind==='combo')[784,1046,1318].forEach((f,i)=>note(f,.1,'square',.025,i*.065));if(kind==='button')note(440,.07,'square',.02,0,660);}
function musicNote(f,d,type,vol,delay=0){note(f,d,type,vol,delay,f,musicBus);}
function muteJet(){stopVoice();if(jetGain&&audio)jetGain.gain.setTargetAtTime(0,audio.currentTime,.02);if(musicBus&&audio)musicBus.gain.setTargetAtTime(0,audio.currentTime,.015);}
function pop(id){if(reducedMotion)return;const el=$(id);el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}
function showToast(text,life=1.2,rank=1){
 if(toastLife>.15&&toastRank>1&&state==='playing'){
  if(rank>1&&!toastQueue.some(item=>item.text===text))toastQueue.push({text,life,rank});
  toastQueue.sort((a,b)=>b.rank-a.rank);toastQueue=toastQueue.slice(0,3);return;
 }
 const el=$('toast');el.textContent=text;el.hidden=false;
 el.setAttribute('data-reward',rank);el.style.setProperty('--toast-life',life+'s');
 pop('toast');toastLife=life;toastRank=rank;
 speakStreak(text);
}
function showHome(){water.reset();eruption=eruptionWarning=eruptionVisual=0;eruptionPending=eruptionFinishing=false;$('eruption-status').hidden=true;career?.refresh();effectCues=[];toastQueue=[];toastRank=toastLife=0;deathEffect=null;rewardRings=[];shield=magnet=invulnerable=gold=0;state='home';clearInput();muteJet();reservations=[];obstacles=[];pickups=[];particles=[];texts=[];for(const id of ['hud','result','pause-screen','boost-hint','toast','event-badge'])$(id).hidden=true;$('intro').hidden=false;}
function start(){stopVoice();voiceMilestones.clear();lastVoiceAt=-Infinity;lastVoiceClip='';director.reset();water.reset();$('eruption-status').hidden=true;career?.close();runId=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);runIsland=profile.selectedIsland;runPerfects=runShieldSaves=0;runCommitted=false;missionSignals=new Set();effectMemory={shield:false,magnet:false,flow:false,gold:false};effectExit={shield:0,magnet:0,flow:0,gold:0};effectCues=[];toastQueue=[];toastRank=toastLife=rewardDuck=magnetVisual=0;initAudio();sfx('start');state='playing';clearInput();dist=coins=combo=comboLife=world=startAge=charge=flow=0;flowMax=6;milestone=100;soundtrack.reset();eruption=eruptionWarning=eruptionVisual=meteorTimer=0;eruptionPending=eruptionFinishing=false;nextEruption=runIsland==='sunset'?180:420;speed=100;shield=magnet=invulnerable=gold=0;goldPending=false;nextGold=220;powerTimer=10;powerIndex=0;formationId=0;formations.clear();deathEffect=null;rewardRings=[];jetFeel=0;impactHold=0;renderY=previousY=155;obstacleTimer=2.8;coinTimer=.4;reservations=[];obstacles=[];pickups=[];particles=[];texts=[];p={x:W*.27,y:155,vy:0};shake=flash=0;for(const id of ['intro','result','pause-screen'])$(id).hidden=true;$('hud').hidden=false;$('pause').hidden=false;$('boost-hint').hidden=false;showToast('GO!',.8);updateHud();canvas.focus({preventScroll:true});}
function pause(){if(state!=='playing')return;state='paused';clearInput();muteJet();$('pause-screen').hidden=false;$('pause').hidden=true;$('boost-hint').hidden=true;}
function resume(){if(state!=='paused')return;initAudio();state='playing';$('pause-screen').hidden=true;$('pause').hidden=false;canvas.focus({preventScroll:true});}
function finish(){
 $('eruption-status').hidden=true;muteJet();$('event-badge').hidden=true;state='over';
 const score=Math.floor(dist),record=score>best;best=Math.max(score,best);
 try{localStorage.setItem('jetlev-pixel-best',best);}catch{}
 $('best').textContent=best+' m';$('final-distance').innerHTML=score+'<small>m</small>';
 $('final-coins').textContent=coins;$('final-best').textContent=best+' m';
 $('result-tag').textContent=record?'★ REKORD ★':'GAME OVER';$('result').hidden=false;
 if(!runCommitted){
  runCommitted=true;
  const summary=progression.recordRun(profile,{id:runId,islandId:runIsland,distance:score,coins,perfects:runPerfects,shieldSaves:runShieldSaves});
  progression.save(profile);career?.refresh();
  career?.showResults({...summary,completedMissions:summary.completed,unlockedIslands:summary.unlocked});
  if(summary.unlocked.length){sfx('streak');if(!reducedMotion)try{globalThis.navigator?.vibrate?.([12,40,12,40,18]);}catch{}}
  else if(summary.completed.length||record)sfx('combo');
 }
}
function missionFeedback(){
 const stats={distance:dist,coins,perfects:runPerfects,shieldSaves:runShieldSaves};
 for(const mission of progression.missionProgress(profile,runIsland)){
  if(!mission.complete&&!missionSignals.has(mission.id)&&mission.value+(stats[mission.metric]||0)>=mission.target){
   missionSignals.add(mission.id);showToast('MISSION ✓',1.15,3);
   note(880,.15,'sine',.035);note(1320,.2,'triangle',.03,.1);
   reward(p.x,p.y,C.cream,2);rewardDuck=.4;
  }
 }
}
function hit(){
 if(state!=='playing')return;
 state='dying';$('eruption-status').hidden=true;clearInput();muteJet();$('event-badge').hidden=true;
 deathEffect=fx.createExplosion(p.x,p.y,reducedMotion);impactHold=.065;
 if(sound&&audio)fx.playExplosion(audio);
 shake=reducedMotion?0:3.5;flash=0;deathTimer=deathEffect.duration;
 $('pause').hidden=true;$('boost-hint').hidden=true;$('toast').hidden=true;
}
function reward(x,y,color=C.yellow,strength=1){rewardRings.push({x,y,age:0,color,strength,life:.55+strength*.15});rewardRings=rewardRings.slice(-6);}
function collectPower(c){
 if(c.power==='shield'){shield=9;showToast('SCHILD!',1,2);}
 else if(c.power==='magnet'){magnet=8;showToast('MAGNET!',1.1,3);}
 else{flow=Math.min(9,Math.max(6,flow+3));flowMax=flow;charge=0;showToast('MÜNZEN ×2!',1.1,3);}
 reward(c.x,c.y,C.cream,2);burst(c.x,c.y,C.cream,16,55);
}
function completeCoin(c){
 const group=formations.get(c.group);if(!group)return;
 group.left--;
 if(group.left===0){
  if(!group.failed){runPerfects++;coins+=5;sfx('combo');showToast('PERFEKT +5',1.05,3);reward(p.x,p.y,C.yellow,2.5);}
  formations.delete(c.group);
 }
}
$('start').onclick=start;$('restart').onclick=start;$('pause').onclick=pause;$('resume').onclick=resume;$('home').onclick=showHome;$('quit').onclick=()=>{ $('pause-screen').hidden=true;finish(); };
$('pause-sound').onclick=()=>$('sound').onclick();
$('sound').onclick=()=>{sound=!sound;if(sound){initAudio();sfx('button');}else muteJet();$('sound').textContent=sound?'♫':'♪̸';$('sound').setAttribute('aria-label',sound?'Ton ausschalten':'Ton einschalten');};
function press(){if(state==='playing'){initAudio();if(!held)note(180,.07,'triangle',.02,0,330);held=true;}}
// Track each finger independently: lifting a second finger must not cut thrust.
const cabinet=$('cabinet');
cabinet.addEventListener('pointerdown',e=>{
 if(e.target.closest('button,a')||state!=='playing'||(e.pointerType==='mouse'&&e.button!==0))return;
 e.preventDefault();activePointers.add(e.pointerId);press();
 try{cabinet.setPointerCapture(e.pointerId);}catch{}
});
function releasePointer(e){activePointers.delete(e.pointerId);held=state==='playing'&&(activePointers.size>0||activeKeys.size>0);}
window.addEventListener('pointerup',releasePointer);
window.addEventListener('pointercancel',releasePointer);
cabinet.addEventListener('lostpointercapture',releasePointer);
cabinet.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
 if(e.code==='Space'||e.code==='ArrowUp'){
  if(e.target.closest('button,a'))return;e.preventDefault();if(e.repeat)return;
  if(state==='home'||state==='over')start();
  if(state==='playing'){activeKeys.add(e.code);press();}
 }
 if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();state==='playing'?pause():resume();}
});
window.addEventListener('keyup',e=>{activeKeys.delete(e.code);held=state==='playing'&&(activePointers.size>0||activeKeys.size>0);});
function leaveApp(){clearInput();pause();muteJet();if(audio&&audio.state==='running')audio.suspend().catch(()=>{});}
window.addEventListener('blur',leaveApp);
window.addEventListener('pagehide',leaveApp);
document.addEventListener('visibilitychange',()=>{if(document.hidden)leaveApp();});
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function poly(pts,c){g.fillStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.closePath();g.fill();}
function stroke(pts,c,width=1){g.strokeStyle=c;g.lineWidth=width;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.stroke();}
function rand(a,b){return a+Math.random()*(b-a);}
function burst(x,y,color,n=8,v=50){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-v,v),vy:rand(-v,v),life:rand(.25,.65),color,size:Math.random()<.3?3:2});}
function background(){theme.drawBackground(g,{W,H,t,world,island:state==='home'?profile.selectedIsland:runIsland,eruption:eruptionVisual,reducedMotion});}
// Shape checked against the Wikipedia flight photograph and manufacturer's
// carbon pack / red-shell product images. Upright harness posture, no footboard.
function rider(x,y,scale=1,thrust=false){
const bx=Math.max(20*scale,x-43*scale),by=300+Math.sin(t*5)*1.3;
const hose=[];for(let i=0;i<=32;i++){const u=i/32;hose.push([x-3*scale-u*(x-3*scale-bx)+Math.sin(u*Math.PI)*12*scale+Math.sin(t*2+u*5)*u*1.5,y+7*scale+(by-y-7*scale)*u]);}
stroke(hose,'#7b6430',5*scale);stroke(hose,'#e9bf35',3.5*scale);stroke(hose,'#f5d967',scale);
// Separate unmanned engine hull, black with the manufacturer's red trim.
poly([[bx-19*scale,by-3],[bx+21*scale,by-3],[bx+13*scale,by+4],[bx-14*scale,by+4]],'#22272b');
poly([[bx-15*scale,by-3],[bx-7*scale,by-10],[bx+5*scale,by-9],[bx+17*scale,by-3]],'#3b4041');
stroke([[bx-12*scale,by-5],[bx-4*scale,by-7],[bx+13*scale,by-4]],'#ed1c24',2);
rect(bx-5*scale,by-9,9*scale,2,'#969a99');rect(bx-24*scale,by+4,19*scale,1,'#d0f8ef');
g.save();g.translate(x,y);g.scale(scale,scale);if(state==='playing'&&!reducedMotion)g.rotate(Math.max(-.035,Math.min(.035,-p.vy*.00038)));
// Tall moulded backrest/head support, carbon black, harness behind the pilot.
poly([[-7,-23],[-4,-29],[4,-29],[8,-23],[10,-16],[12,-12],[8,6],[4,11],[-5,10],[-10,4],[-12,-13]],'#25282b');
stroke([[-7,-23],[-4,-27],[3,-27],[7,-22]],'#54585b',2);
rect(-10,-14,2,15,'#5b5c5b');rect(8,-14,2,16,'#42464a');rect(-8,-11,2,12,'#d1262f');rect(-6,3,4,3,currentKit().color);rect(2,3,4,3,currentKit().color);
// Thick black curved plumbing exits either side of the back plate.
stroke([[-9,-19],[-14,-19],[-17,-16],[-17,-10]],'#1c2226',5);
stroke([[9,-19],[14,-18],[16,-15],[16,-9]],'#1c2226',5);
stroke([[-13,-20],[-17,-17]],'#62686b',1);stroke([[12,-19],[16,-16]],'#62686b',1);
rect(-19,-11,5,3,'#353c3e');rect(14,-10,5,3,'#353c3e');
// Small saddle under the hips, five-point harness; nearly straight bare legs.
rect(-5,6,10,3,'#12171c');rect(-6,2,5,10,'#24282e');rect(1,2,5,10,'#292e34');
stroke([[-4,12],[-3,20],[0,29]],'#c58e67',4);stroke([[4,12],[5,21],[2,30]],'#e0aa7f',4);
rect(-2,29,5,2,'#c28a69');rect(1,30,5,2,'#e3af89');
// Black buoyancy vest and crossed safety webbing.
poly([[-6,-19],[5,-19],[8,-12],[6,3],[-6,3],[-8,-12]],currentKit().id==='classic'?'#20262c':currentKit().color);
stroke([[-5,-17],[-2,-4],[4,2]],'#474c4e',2);stroke([[4,-17],[2,-4],[-3,2]],'#5d6261',2);rect(-1,-2,3,3,'#adb2ad');rect(-5,-12,3,1,currentKit().color);rect(3,-12,2,5,currentKit().color);
// Bare head as in the reference flight photo, short brown hair.
rect(-3,-27,7,8,'#daa17c');rect(-4,-29,7,4,'#725844');rect(-4,-26,2,5,'#80604a');rect(3,-24,2,3,'#e7b38a');rect(2,-26,1,1,'#3b3936');
// Long control levers from the nozzle pivots to upright hand grips.
stroke([[-14,-18],[-12,-9],[-13,-5]],'#181f24',2);stroke([[14,-17],[12,-8],[13,-4]],'#181f24',2);
// Bent elbows, hands held beside the chest/shoulders, not a handlebar across it.
stroke([[-6,-16],[-10,-8],[-13,-13]],'#d69b73',3);stroke([[6,-16],[10,-7],[13,-12]],'#e2aa7f',3);
rect(-14,-17,2,6,'#30393c');rect(12,-16,2,6,'#30393c');rect(-14,-14,3,2,'#dfaa7e');rect(12,-13,3,2,'#eab58a');
g.restore();}
function coin(c){const phase=Math.floor((t*8+c.phase)%6),width=[5,4,2,1,2,4][phase];rect(c.x-width,c.y-5,width*2,10,'#9d6e3c');rect(c.x-width,c.y-4,width*2,8,C.yellow);rect(c.x-width+1,c.y-5,Math.max(1,width*2-2),1,'#fff5bd');if(width>2){rect(c.x-1,c.y-2,2,4,'#d69945');rect(c.x-2,c.y-3,1,3,'#fff5bd');}}
function obstacle(o){theme.drawObstacle(g,o,{t});}
function effectSignal(kind,active){
 const palette={shield:C.mint,magnet:'#8aefff',flow:C.yellow,gold:'#ffeeb3'};
 const patterns={shield:[12,24,12],magnet:[7,35,7],flow:[10,25,15],gold:[7,22,7,22,12]};
 const endings={shield:[12],magnet:[5,25,5],flow:[7],gold:[5,20,5]};
 if(!reducedMotion&&globalThis.navigator?.vibrate)try{navigator.vibrate(active?patterns[kind]:endings[kind]);}catch{}
 const pitches={shield:[660,990],magnet:[390,880],flow:[784,1568],gold:[1046,2093]};
 const [low,high]=pitches[kind];
 if(active){
  pop({shield:'shield-card',magnet:'magnet-card',flow:'flow-meter',gold:'event-badge'}[kind]);
  note(low,.17,kind==='shield'?'triangle':'sine',.045,0,high);
  note(high,.2,'triangle',.035,.09);
  if(kind==='gold'||kind==='flow')note(high*1.25,.2,'sine',.025,.17);
  effectExit[kind]=0;
 }else{
  note(high*.5,.16,'sine',.025,0,low*.65);
  if(kind==='magnet'||kind==='gold')note(low*.7,.12,'triangle',.018,.08);
  effectExit[kind]=.65;
 }
 effectCues.push({kind,active,x:p.x,y:p.y,age:0,color:palette[kind]});
 effectCues=effectCues.slice(-8);
}
function updateEffectSignals(dt){
 for(const kind of ['shield','magnet','flow','gold'])effectExit[kind]=Math.max(0,effectExit[kind]-dt);
 const current={shield:shield>0,magnet:magnet>0,flow:flow>0,gold:gold>0};
 for(const kind of Object.keys(current))if(current[kind]!==effectMemory[kind]){
  effectSignal(kind,current[kind]);effectMemory[kind]=current[kind];
 }
 for(const cue of effectCues)cue.age+=dt;
 effectCues=effectCues.filter(cue=>cue.age<.65);
}
function effectCard(id,label,remaining,max){
 const card=$(id==='gold'?'event-badge':id+'-card');
 const active=remaining>0,exiting=effectExit[id]>0;
 if(active&&card.hidden)pop(card.id|| (id==='gold'?'event-badge':id+'-card'));
 card.hidden=!active&&!exiting;card.classList.toggle('expired',exiting);
 if(!active&&!exiting)return;
 const seconds=Math.ceil(remaining),value=active?seconds+'<small>s</small>':'<small>ENDE</small>';
 if($(id+'-time').innerHTML!==value)$(id+'-time').innerHTML=value;
 $(id+'-fill').style.width=Math.min(100,remaining/max*100)+'%';
 card.classList.toggle('ending',remaining<=2);
 card.setAttribute('aria-label',label+': '+seconds+' Sekunden');
}
function updateHud(){
 $('distance').innerHTML=String(Math.floor(dist)).padStart(4,'0')+'<small>m</small>';
 if($('coins').textContent!==String(coins)){pop('coin-counter');$('coins').textContent=coins;}
 const active=flow>0,flowEnding=effectExit.flow>0;
 const label='<span class="effect-name">MÜNZEN ×2</span><strong>'+(flowEnding?'<small>ENDE</small>':active?Math.ceil(flow)+'<small>s</small>':charge+'<small>/10</small>')+'</strong>';
 if($('flow-label').innerHTML!==label)$('flow-label').innerHTML=label;
 $('flow-fill').style.width=(active?Math.min(100,flow/flowMax*100):charge*10)+'%';
 $('flow-meter').classList.toggle('active',active||flowEnding);$('flow-meter').classList.toggle('expired',flowEnding);
 $('flow-meter').classList.toggle('ending',active&&flow<=2);
 effectCard('shield','Schild · ein Hindernistreffer',shield,9);
 effectCard('magnet','Magnet',magnet,8);
 effectCard('gold','Gold Run',gold,6);
 $('combo').innerHTML=comboLife>0&&combo>=3?'<img class="coin-icon" src="assets/icons/coin.svg" alt="" width="22" height="22"> '+combo+' STREAK':'';
}
function makePattern(){
  // Keep whole groups readable, and never stack an unvalidated partial pattern.
  if(obstacles.filter(o=>o.x>p.x-40).length>4){obstacleTimer=.5;return;}
  for(let attempt=0;attempt<6;attempt++){
    const center=director.pick(dist,p.y).center;
    let type=Math.random()<(runIsland==='harbor'?.6:.8)?'gate':'drone';
    if(dist>(runIsland==='sunset'?260:350)&&Math.random()<(runIsland==='sunset'?.22:.16))type='rocket';
    const pattern=level.encounter({pilot:p,distance:dist,width:W,obstacles,coins:pickups,reservations,held,center,type});
    if(!pattern)continue;
    obstacles.push(...pattern.obstacles);
    if(pattern.obstacles.some(o=>o.type==='rocket')){note(620,.09,'square',.022);note(620,.09,'square',.022,.22);}
    // Recovery space follows a group; later runs shorten it gently, with a floor.
    obstacleTimer=pattern.span+rand(1.75,2.25)+Math.max(0,1-dist/200)*.5-pattern.progress*.35;
    return;
  }
  obstacleTimer=.6;
}
function makeCoins(){
  const formation=level.formation({pilot:p,distance:dist,obstacles,existing:pickups,width:W});
  if(formation){const id=++formationId;formations.set(id,{left:formation.coins.length,failed:false});for(const c of formation.coins)c.group=id;pickups.push(...formation.coins);reservations=formation.path;coinTimer=gold>0?1.1:rand(2.2,2.8);}
  else coinTimer=.55;
}
function makeMeteor(){
 if(obstacles.filter(o=>o.type==='meteor').length>=3)return;
 for(let attempt=0;attempt<5;attempt++){
  const x=Math.max(W+28,p.x+190),target=director.pick(dist,p.y).center;
  const candidate={type:'meteor',x,y:-28,fall:(target+28)/(x-p.x),passed:false};
  if(!pickups.every(c=>level.coinClear(c,candidate)))continue;
  if(!reservations.every(point=>level.safe(point.y,point.x-p.x,p.x,[candidate])))continue;
  const path=level.plan({pilot:p,distance:dist,obstacles:[...obstacles,candidate],coins:pickups,endScroll:x-p.x+35});
  if(!path)continue;
  obstacles.push(candidate);note(330,.12,'sine',.014,0,220);return;
 }
}
function updateEruption(dt){
 if(dist>=nextEruption){eruptionPending=true;nextEruption+=700+rand(0,150);}
 if(eruptionPending&&gold<=0&&eruption<=0&&eruptionWarning<=0&&!obstacles.some(o=>o.x>p.x-40)){
  eruptionPending=false;eruptionWarning=2.4;
  showToast('VULKAN ERWACHT',1.5,3);note(110,.5,'triangle',.035,0,75);
 }
 if(eruptionWarning>0){
  eruptionWarning=Math.max(0,eruptionWarning-dt);
  if(eruptionWarning===0){
   eruption=12;meteorTimer=.15;showToast('LAVA RUN!',1.15,3);
   note(82,.7,'triangle',.045,0,45);rewardDuck=.8;
   if(!reducedMotion)try{globalThis.navigator?.vibrate?.([12,80,12]);}catch{}
  }
 }else if(eruption>0){
  eruption=Math.max(0,eruption-dt);meteorTimer-=dt;
  if(meteorTimer<=0&&eruption>1.8){makeMeteor();meteorTimer=1.6;}
  if(eruption===0)eruptionFinishing=true;
 }
 if(eruptionFinishing&&!obstacles.some(o=>o.type==='meteor')){eruptionFinishing=false;coins+=15;showToast('LAVA +15',1.3,3);sfx('streak');reward(p.x,p.y,C.yellow,2.5);}
 const target=eruption>0||obstacles.some(o=>o.type==='meteor')?1:eruptionWarning>0?.55:0;
 eruptionVisual+=(target-eruptionVisual)*(1-Math.exp(-dt*1.8));
 const banner=$('eruption-status');banner.hidden=eruptionWarning<=0&&eruption<=0&&!eruptionFinishing;
 const label=eruptionWarning>0?'AUSBRUCH IN '+Math.ceil(eruptionWarning):eruptionFinishing?'LETZTE BROCKEN':'VULKAN · '+Math.ceil(eruption)+'s';
 const time=eruptionWarning>0?Math.ceil(eruptionWarning):eruptionFinishing?'…':Math.ceil(eruption);
 const content='<svg class="effect-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m2 21 7-12 3 3 3-3 7 12Z"/><path d="m8 3 2 3m6-3-2 3M12 1v4"/></svg><div class="effect-details"><span class="effect-name">'+(eruptionWarning>0?'AUSBRUCH':'VULKAN')+'</span><strong>'+time+(eruptionFinishing?'':'<small>s</small>')+'</strong></div>';
 if(banner.innerHTML!==content)banner.innerHTML=content;
 banner.setAttribute('aria-label',label);
}
function drawMeteorWarnings(){
 for(const o of obstacles){
  if(o.type!=='meteor'||(o.x<W-8&&o.y>80))continue;
  const entry=o.x-Math.max(0,(80-o.y)/o.fall),x=Math.max(12,Math.min(W-12,entry));
  const y=entry>W-12?Math.max(85,Math.min(260,o.y+(o.x-W+12)*o.fall)):85;
  rect(x-7,y-9,15,19,C.ink);rect(x-6,y-8,13,2,'#ffba6b');
  g.fillStyle='#ffe4a0';g.font='bold 10px monospace';g.textAlign='center';g.fillText('!',Math.round(x),Math.round(y+2));
  poly([[x-4,y+10],[x-7,y+15],[x,y+13]],'#ffba6b');
 }
}
function makePower(){
 const result=level.formation({pilot:p,distance:dist,obstacles,existing:pickups,width:W});
 if(!result){powerTimer=1;return;}
 const c=result.coins[2];c.power=['shield','magnet','flow'][powerIndex++%3];
 pickups.push(c);reservations=result.path;powerTimer=15;
}
function update(dt){if(impactHold>0){impactHold=Math.max(0,impactHold-dt);return;}previousY=p.y;t+=dt;shake=Math.max(0,shake-dt*15);flash=Math.max(0,flash-dt);if(state==='home'){world+=dt*22;updateWater(dt,true);return;}if(state==='paused'||state==='over')return;
for(const ring of rewardRings)ring.age+=dt;rewardRings=rewardRings.filter(r=>r.age<r.life);
for(const pt of particles){pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.vy+=dt*90;pt.life-=dt;}particles=particles.filter(pt=>pt.life>0);for(const tx of texts){tx.y-=dt*16;tx.life-=dt;}texts=texts.filter(tx=>tx.life>0);
if(state==='dying'){water.update(dt,{nozzles:[],reducedMotion});fx.updateExplosion(deathEffect,dt);deathTimer-=dt;if(deathTimer<=0){finish();deathEffect=null;}return;}
startAge+=dt;rewardDuck=Math.max(0,rewardDuck-dt);magnetVisual+=((magnet>0?1:0)-magnetVisual)*(1-Math.exp(-dt*10));shield=Math.max(0,shield-dt);magnet=Math.max(0,magnet-dt);invulnerable=Math.max(0,invulnerable-dt);gold=Math.max(0,gold-dt);if(dist>=nextGold){goldPending=true;nextGold+=240;}if(goldPending&&!eruptionPending&&!eruptionFinishing&&eruptionVisual<.1&&eruption<=0&&eruptionWarning<=0&&!obstacles.some(o=>o.x>p.x-40)){goldPending=false;gold=6;coinTimer=0;showToast('GOLD RUN!',1.2,3);sfx('combo');}flow=Math.max(0,flow-dt);if(dist>=milestone){showToast(milestone+' m!',1,2);sfx('combo');milestone+=100;}speed=level.speedAt(dist);world+=speed*dt;dist+=speed*dt*.16;comboLife-=dt;if(comboLife<=0)combo=0;
// Fixed-step acceleration and exponential drag keep touch flight responsive at every refresh rate.
level.fly(p,held,dt);director.update(dt,p.y);updateWater(dt);if(p.y>=level.WATER_Y){p.y=level.WATER_Y;burst(p.x,303,eruptionVisual>.5?'#ffbc78':C.mint,24,65);hit();return;}jetFeel+=((held?1:0)-jetFeel)*(1-Math.exp(-dt*12));if(p.y>269&&Math.random()<dt*18)burst(p.x,302,'#a2f8df',2,22);
if(jetGain&&audio){jetGain.gain.setTargetAtTime(sound?(.008+jetFeel*.034)*(rewardDuck>0?.6:1):0,audio.currentTime,.07);jetFilter.frequency.setTargetAtTime(390+jetFeel*900,audio.currentTime,.1);}
// Music uses a dedicated gain bus: scheduled notes fall silent immediately on pause/mute.
if(musicBus&&audio)musicBus.gain.setTargetAtTime(sound?1:0,audio.currentTime,.12);
soundtrack.update(dt,{enabled:sound&&!!audio,playing:true,duck:rewardDuck>0?.5:1,eruption:eruptionVisual},musicNote);
updateEruption(dt);
for(const point of reservations)point.x-=speed*dt;
reservations=reservations.filter(point=>point.x>=p.x);
obstacleTimer-=dt;coinTimer-=dt;if(obstacleTimer<=0&&gold<=0&&!goldPending&&!eruptionPending&&!eruptionFinishing&&eruptionVisual<.1&&eruption<=0&&eruptionWarning<=0&&eruptionVisual<.05)makePattern();if(coinTimer<=0)makeCoins();powerTimer-=dt;if(powerTimer<=0)makePower();
for(const o of obstacles){o.x-=speed*dt*(o.type==='rocket'?1.45:1);if(o.type==='drone')o.y=o.baseY+Math.sin(t*2+o.phase)*13;else if(o.type==='meteor')o.y+=speed*dt*o.fall;const {x:rx,y:ry}=level.bounds(o);if(Math.abs(p.x-o.x)<rx+10&&Math.abs(p.y-o.y)<ry+20){if(invulnerable>0)continue;if(shield>0){runShieldSaves++;shield=0;invulnerable=.85;o.destroyed=true;reward(p.x,p.y,C.mint);burst(o.x,o.y,C.mint,22,75);note(170,.18,'triangle',.07,0,60);showToast('GERETTET!',.6);continue;}hit();return;}if(!o.passed&&o.x<p.x-26){o.passed=true;if(Math.abs(p.y-o.y)<ry+33){coins+=2;note(659,.1,'triangle',.05);texts.push({x:p.x+12,y:p.y-22,text:'+2 KNAPP!',life:.8,color:C.mint});burst(p.x,p.y,C.mint,5,30);}}}
obstacles=obstacles.filter(o=>o.x>-30&&o.y<H+35&&!o.destroyed);for(const c of pickups){c.x-=speed*dt;if(!c.power&&magnet>0&&Math.hypot(c.x-p.x,c.y-p.y)<88){const attracted={...c,x:c.x+(p.x-c.x)*dt*7,y:c.y+(p.y-c.y)*dt*7};if(obstacles.every(o=>level.coinClear(attracted,o))){c.x=attracted.x;c.y=attracted.y;}}if(Math.abs(c.x-p.x)<11&&Math.abs(c.y-p.y+2)<13){c.taken=true;if(c.power){collectPower(c);continue;}const value=flow>0?2:1;coins+=value;combo++;if(flow<=0){charge++;if(charge>=10){charge=0;flow=6;flowMax=6;showToast('MÜNZEN ×2!',1.2,3);sfx('combo');}}comboLife=2;sfx('coin');burst(c.x,c.y,C.yellow,7,35);texts.push({x:c.x,y:c.y-8,text:'+'+value,life:.5,color:C.yellow});if(combo%5===0){sfx('streak');showToast(combo+' STREAK!',1,2);reward(p.x,p.y,C.mint,Math.min(3,1.5+combo/20));burst(p.x,p.y-5,C.cream,reducedMotion?5:14,60);}completeCoin(c);}}for(const c of pickups)if(!c.taken&&c.x<=-10){const group=formations.get(c.group);if(group){group.failed=true;group.left--;if(group.left===0)formations.delete(c.group);}}pickups=pickups.filter(c=>!c.taken&&c.x>-10);
if(Math.random()<dt*(25+jetFeel*65))particles.push({x:p.x+(Math.random()<.5?-14:13),y:p.y-5,vx:-speed*.4+rand(-10,10),vy:rand(55,110),life:rand(.15,.4),size:1,color:'#c5ffed'});
updateEffectSignals(dt);
if(toastLife>0){toastLife-=dt;if(toastLife<=0){$('toast').hidden=true;toastRank=0;const next=toastQueue.shift();if(next)showToast(next.text,next.life,next.rank);}}$('boost-hint').hidden=startAge>5;uiTimer-=dt;if(uiTimer<=0){missionFeedback();updateHud();uiTimer=.06;}
}
function drawPower(c){
 const y=c.y+Math.sin(t*4)*2;
 const color=c.power==='shield'?C.mint:c.power==='magnet'?'#8aefff':C.yellow;
 poly([[c.x,y-11],[c.x+11,y],[c.x,y+11],[c.x-11,y]],C.ink);
 stroke([[c.x,y-11],[c.x+11,y],[c.x,y+11],[c.x-11,y],[c.x,y-11]],color,2);
 g.font='bold 9px monospace';g.fillStyle=color;g.textAlign='center';g.fillText(c.power==='shield'?'◇':c.power==='magnet'?'U':'×2',Math.round(c.x),Math.round(y+3));
}
function drawShield(x,y){
 const color=shield<2&&Math.sin(t*12)<0?'#b8ede170':C.mint;
 stroke([[x-15,y-28],[x+15,y-28],[x+23,y-14],[x+21,y+18],[x,y+31],[x-21,y+18],[x-23,y-14],[x-15,y-28]],color,1);
}
function drawRewardRing(ring){
 const progress=Math.min(1,ring.age/ring.life),ease=1-(1-progress)**3;
 const strength=reducedMotion?.45:ring.strength;
 const radius=5+ease*(15+strength*12);
 g.save();g.globalAlpha=(1-progress)**1.4;
 // An expanding foam crown with ballistic droplets, anchored at the reward.
 for(let i=0;i<18;i++){
  const angle=i*Math.PI/9;
  rect(ring.x+Math.cos(angle)*radius,ring.y+Math.sin(angle)*radius*.68,2,2,i%3?C.cream:ring.color);
 }
 for(let i=0;i<(reducedMotion?6:14);i++){
  const angle=-Math.PI+(i/13)*Math.PI,velocity=(24+i%4*12)*strength;
  const x=ring.x+Math.cos(angle)*velocity*ring.age;
  const y=ring.y+Math.sin(angle)*velocity*ring.age+55*ring.age*ring.age;
  rect(x,y,i%3?2:3,3,i%2?C.cream:'#8de8ed');
  if(!reducedMotion)rect(x,y+4,1,3,'#a6edee80');
 }
 g.restore();
}
function drawCoinBoost(x,y){
 // Gold wake and a multiplier badge communicate coin value, not protection.
 g.save();
 for(let i=0;i<7;i++){
  const phase=reducedMotion?i/7:(t*.8+i/7)%1;
  g.globalAlpha=(1-phase)*.65;
  rect(x-13-phase*14,y+7+phase*23,2,2,C.yellow);
 }
 g.globalAlpha=1;rect(x+12,y+18,18,12,C.ink);rect(x+12,y+29,18,1,C.yellow);
 g.font='bold 9px monospace';g.textAlign='center';g.fillStyle=C.yellow;g.fillText('×2',Math.round(x+21),Math.round(y+27));
 g.restore();
}
function drawMagnet(x,y){
 if(magnetVisual<.015)return;
 g.save();g.globalAlpha=magnetVisual;
 // Cyan-gold inward field stays translucent, so hazards remain readable.
 const pulse=reducedMotion?0:Math.sin(t*3.5);
 const glow=g.createRadialGradient(x,y,8,x,y,43+pulse*2);
 glow.addColorStop(0,'#b5faff00');glow.addColorStop(.6,'#7fe6ef16');glow.addColorStop(.85,'#83f7ff28');glow.addColorStop(1,'#b5faff00');
 g.fillStyle=glow;g.fillRect(x-47,y-47,94,94);
 for(let i=0;i<10;i++){
  const phase=reducedMotion?.5:(t*.65+i/10)%1,angle=i*Math.PI*.2;
  const radius=43-phase*20;
  rect(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,2,2,i%3?C.mint:C.yellow);
 }
 g.restore();
}
function drawMagnetBuddy(x,y){
 if(magnetVisual<.015)return;
 const bx=x+25,by=y-31+(reducedMotion?0:Math.sin(t*4)*2.5);
 g.save();g.globalAlpha=magnetVisual;g.translate(bx,by);
 if(!reducedMotion)g.rotate(Math.sin(t*2.4)*.1);
 // Floating horseshoe magnet: red body, silver pole tips, tiny water thrusters.
 stroke([[-5,-5],[-5,3],[-2,6],[3,6],[6,3],[6,-5]],C.ink,6);
 stroke([[-5,-4],[-5,2],[-2,4],[3,4],[5,2],[5,-4]],'#ed1c24',4);
 rect(-7,-7,4,4,'#f6ffff');rect(3,-7,4,4,'#f6ffff');
 rect(-3,9,2,3,C.mint);rect(3,9,2,3,C.mint);
 if(!reducedMotion){rect(-3,13+(t*18%4),1,2,C.cream);rect(3,13+((t*18+2)%4),1,2,C.cream);}
 g.restore();
}
function drawRocketWarnings(){
 for(const o of obstacles){if(o.type!=='rocket'||o.x<W-10)continue;
 const y=o.y,x=W-14;rect(x-8,y-10,17,20,C.ink);
 poly([[x+4,y-5],[x-3,y],[x+4,y+5]],Math.sin(t*14)>0?'#ff766d':C.yellow);
 rect(x+6,y-5,2,6,C.cream);rect(x+6,y+3,2,2,C.cream);
 }
}
function drawEffectCue(cue){
 const q=cue.age/.65;
 const radius=reducedMotion?28:cue.active?6+(1-(1-q)**3)*33:35*(1-q)+5;
 g.save();g.globalAlpha=(1-q)*.8;
 const count=reducedMotion?6:12;
 for(let i=0;i<count;i++){
  const a=i/count*Math.PI*2+(reducedMotion?0:q*(cue.kind==='magnet'?2:.3));
  const x=cue.x+Math.cos(a)*radius,y=cue.y+Math.sin(a)*radius;
  if(cue.kind==='flow'||cue.kind==='gold')rect(x,y,3,3,cue.color);
  else{rect(x,y,2,4,cue.color);if(cue.active)rect(x-1,y+1,4,2,C.cream);}
 }
 g.restore();
}
function updateWater(dt,home=false){
 const x=home?W*.5:p.x,y=home?145+Math.sin(t*2.5)*4:p.y,scale=home?1.45:.85,kit=currentKit();
 water.update(dt,{nozzles:[{x:x-16*scale,y:y-9*scale},{x:x+15*scale,y:y-9*scale}],thrust:home?.6:jetFeel,velocityY:home?Math.cos(t*2.5)*10:p.vy,color:kit.trail,rainbow:!!kit.rainbow,reducedMotion});
}
function render(){g.save();if(shake)g.translate(Math.round(rand(-shake,shake)),Math.round(rand(-shake,shake)));background();water.draw(g);
if(state==='home'){const x=W*.5,y=145+Math.sin(t*2.5)*4;rect(x-13,291,30,2,'#72c9bd');rider(x,y,1.45,true);for(let i=0;i<5;i++)coin({x:x+36+Math.sin(i*.7)*11,y:175+i*13,phase:i});}else{for(const c of pickups){if(c.power)drawPower(c);else coin(c);}for(const o of obstacles)obstacle(o);if(flow>0&&state!=='dying')drawCoinBoost(p.x,renderY);if(state!=='dying'){drawMagnet(p.x,renderY);rider(p.x,renderY,.85,jetFeel);drawMagnetBuddy(p.x,renderY);}if(shield>0)drawShield(p.x,renderY);drawRocketWarnings();drawMeteorWarnings();for(const pt of particles)rect(pt.x,pt.y,pt.size,pt.size,pt.color);g.font='bold 8px monospace';g.textAlign='center';for(const tx of texts){g.fillStyle=C.ink;g.fillText(tx.text,Math.round(tx.x+1),Math.round(tx.y+1));g.fillStyle=tx.color;g.fillText(tx.text,Math.round(tx.x),Math.round(tx.y));}}
for(const cue of effectCues)drawEffectCue(cue);for(const ring of rewardRings)drawRewardRing(ring);if(deathEffect)fx.drawExplosion(g,deathEffect);if(gold>0){rect(0,0,W,2,C.yellow);rect(0,H-2,W,2,C.yellow);}
if(flash>0)rect(0,0,W,H,'#fff1cf99');g.restore();ctx.drawImage(screen,0,0,canvas.width,canvas.height);}
function frame(now){if(document.hidden){last=now;acc=0;requestAnimationFrame(frame);return;}const elapsed=Math.min((now-last)/1000||0,.06);last=now;if(state!=='paused'){acc+=elapsed;while(acc>=1/120){update(1/120);acc-=1/120;}}renderY=state==='playing'?previousY+(p.y-previousY)*(acc/level.STEP):p.y;render();requestAnimationFrame(frame);}
if(globalThis.JetlevCareer){
 const change=(action,kind)=>{
  initAudio();const ok=action();
  if(ok){
   progression.save(profile);
   if(kind==='buy'){sfx('combo');if(!reducedMotion)try{globalThis.navigator?.vibrate?.([10,35,14]);}catch{}}
   else if(kind==='island'){note(440,.2,'sine',.03,0,880);note(1100,.18,'triangle',.025,.12);}
   else{note(660,.14,'sine',.03,0,990);}
  }
  return ok;
 };
 career=globalThis.JetlevCareer.mount({getProfile:()=>profile,definitions:progression,
  renderPreview:(target,kit)=>{
   const previous=g;
   try{
    g=target.getContext('2d');g.clearRect(0,0,target.width,target.height);g.save();g.scale(.48,.44);
    previewKit=kit;const stream=globalThis.JetlevWater.create({random:()=>.5});for(let i=0;i<100;i++)stream.update(1/60,{nozzles:[{x:130.8,y:95.2},{x:199,y:95.2}],thrust:.7,color:kit.trail,rainbow:!!kit.rainbow,reducedMotion,widthScale:1.7});stream.draw(g);rider(166,115,2.2,true);g.restore();
   }finally{g=previous;previewKit=null;}
  },
  onSelectIsland:id=>change(()=>progression.selectIsland(profile,id),'island'),
  onBuy:id=>change(()=>progression.buy(profile,id),'buy'),
  onEquip:id=>change(()=>progression.equip(profile,id),'equip')});
}
resize();requestAnimationFrame(frame);
})();
