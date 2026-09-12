/* Pixel-painted coastal worlds. Hazard artwork stays inside shared collider bounds. */
(() => {
 'use strict';
 const palettes = [
  {sky:'#87cbdc',haze:'#d0efeb',cloud:'#e8f6ee',sun:'#fff0bd',far:'#9ac5bf',hill:'#72aaa0',leaf:'#4d8777',sand:'#e6d8ad',sea:'#37c7bd',deep:'#158fa5',foam:'#b0ebd7'},
  {sky:'#9fc5d4',haze:'#dfeddf',cloud:'#f0f4e9',sun:'#fff0c6',far:'#a6c2bb',hill:'#80a69a',leaf:'#638c79',sand:'#e0cfb0',sea:'#40bdb9',deep:'#248d9f',foam:'#b9e4d8'},
  {sky:'#cda9bd',haze:'#f5d6bf',cloud:'#f4dcd1',sun:'#ffebbb',far:'#b8aaa9',hill:'#938f98',leaf:'#817f86',sand:'#dfbca8',sea:'#59b6bd',deep:'#397da1',foam:'#c6ddd5'}
 ];
 const ink='#253e4b',red='#ed4555',white='#fff6e7';
 function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
 function poly(g,p,c){g.fillStyle=c;g.beginPath();for(let i=0;i<p.length;i++)i?g.lineTo(Math.round(p[i][0]),Math.round(p[i][1])):g.moveTo(Math.round(p[i][0]),Math.round(p[i][1]));g.closePath();g.fill();}
 const wrap=(x,span)=>((x%span)+span)%span;
 function blend(a,b,q){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-q)+parseInt(b.slice(i,i+2),16)*q).toString(16).padStart(2,'0')).join('');}
 function palm(g,x,y,s,p){
  poly(g,[[x,y],[x+3*s,y],[x+7*s,y-29*s],[x+5*s,y-31*s]],p.leaf);
  const top=y-30*s;
  poly(g,[[x+6*s,top],[x-4*s,top-6*s],[x-17*s,top-2*s],[x-21*s,top+4*s],[x-7*s,top],[x+6*s,top+2*s]],p.leaf);
  poly(g,[[x+6*s,top],[x+15*s,top-7*s],[x+29*s,top-2*s],[x+31*s,top+4*s],[x+17*s,top],[x+7*s,top+2*s]],p.leaf);
  poly(g,[[x+6*s,top],[x+3*s,top-13*s],[x+9*s,top-15*s],[x+13*s,top-5*s]],p.leaf);
 }
 function drawBackground(g,{W,H=320,t=0,world=0,island=0,eruption=0,reducedMotion=false}){
  const index=typeof island==='number'?island:({lagoon:0,harbor:1,sunset:2}[island]||0),p=palettes[wrap(index,3)];
  rect(g,0,0,W,H,p.sky);rect(g,0,75,W,67,p.haze);rect(g,0,142,W,82,p.cloud);
  const sx=W*.76;
  rect(g,sx-18,66,36,45,p.sun);rect(g,sx-23,72,46,33,p.sun);rect(g,sx-26,81,52,16,p.sun);
  for(let i=0;i<5;i++){const x=wrap(i*137-world*.035,W+160)-80,y=30+(i*29)%84;rect(g,x,y,36,3,p.cloud);rect(g,x+7,y-4,17,5,p.cloud);rect(g,x+26,y+3,22,2,p.cloud);}
  const heat=eruption>.01?Math.max(0,Math.min(1,Number(eruption)||0)):0;
  if(heat>0){
   g.globalAlpha=heat*.62;rect(g,0,0,W,142,'#503e52');rect(g,0,142,W,82,'#af766d');g.globalAlpha=1;
  }
  // Broad, quiet silhouettes leave the flight corridor readable.
  for(let layer=0;layer<2;layer++){
   const base=191+layer*14,step=8;g.fillStyle=layer?p.hill:p.far;g.beginPath();g.moveTo(0,225);
   for(let x=0;x<=W+step;x+=step){const z=x+world*(.065+layer*.035);g.lineTo(x,base-Math.round((Math.sin(z*.018+layer)*11+Math.sin(z*.037)*6)/3)*3);}
   g.lineTo(W,225);g.closePath();g.fill();
  }
  if(index===2||heat>0){
   // The distant caldera is scenic; only outlined foreground rocks can collide.
   const vx=W*.62+Math.sin(world*.001)*W*.08;
   g.globalAlpha=index===2?1:heat;
   poly(g,[[vx-74,218],[vx-44,188],[vx-16,137],[vx-6,141],[vx+5,140],[vx+15,134],[vx+38,182],[vx+73,218]],blend(p.far,'#6e545c',heat));
   poly(g,[[vx-16,137],[vx-6,141],[vx+5,140],[vx+15,134],[vx+25,155],[vx+6,150],[vx-8,151]],blend(p.hill,'#4d4355',heat));
   poly(g,[[vx+5,151],[vx+38,182],[vx+73,218],[vx+21,218]],blend(p.hill,'#4d4355',heat));
   g.globalAlpha=1;
   if(heat>0){
    g.globalAlpha=heat*.8;
    // Stacked ash cloud and continuous lava ribbons, with no screen flashes.
    rect(g,vx-14,119,31,16,'#786273');rect(g,vx-22,107,43,16,'#786273');rect(g,vx-30,93,53,18,'#877080');rect(g,vx-22,84,39,13,'#877080');
    poly(g,[[vx-13,138],[vx-4,142],[vx+6,140],[vx+13,135],[vx+9,145],[vx,150],[vx-9,145]],'#ffbd79');
    poly(g,[[vx+3,147],[vx+8,161],[vx+5,170],[vx+15,188],[vx+18,207],[vx+14,207],[vx+10,190],[vx+1,171],[vx+4,160],[vx,149]],'#e99a6c');
    rect(g,vx+4,154,2,8,'#ffd49b');rect(g,vx+8,180,2,7,'#ffd49b');
    if(!reducedMotion){g.globalAlpha=heat*.27;for(let i=0;i<12;i++){const phase=wrap(t*.15+i/12,1),side=i%2?1:-1;rect(g,vx+side*(5+phase*22)+Math.sin(i*3)*5,132-Math.sin(phase*Math.PI)*43,1,1,'#ffdba0');}}
    g.globalAlpha=1;
   }
  }
  rect(g,0,218,W,102,p.sea);rect(g,0,249,W,71,p.deep);
  for(let i=0;i<3;i++){
   const x=wrap(i*211+120-world*.14,W+250)-110,y=218+(i%2)*8;
   rect(g,x-45,y+5,94,3,p.foam);poly(g,[[x-43,y+3],[x-22,y-5],[x+20,y-5],[x+43,y+3]],p.sand);
   palm(g,x-8,y-4,.7,p);if(i===1)palm(g,x+22,y-3,.45,p);
   if(index===1&&i!==1){rect(g,x-39,y-8,30,3,p.leaf);rect(g,x-35,y-5,2,9,p.leaf);rect(g,x-14,y-5,2,9,p.leaf);rect(g,x-35,y-17,21,9,p.sand);poly(g,[[x-39,y-17],[x-25,y-24],[x-10,y-17]],p.leaf);}
  }
  if(index===1){
   // Regular distant jetties keep the harbor recognizable in narrow portrait views.
   for(let j=0;j<Math.ceil(W/110)+1;j++){
    const x=wrap(j*110-world*.12,W+110)-30;
    rect(g,x,223,35,2,p.leaf);rect(g,x+3,225,2,7,p.leaf);rect(g,x+28,225,2,7,p.leaf);
    rect(g,x+8,210,18,13,p.sand);poly(g,[[x+4,210],[x+17,202],[x+30,210]],p.leaf);
    rect(g,x+15,216,4,7,p.hill);
   }
  }
  // Slow broken reflections; none resemble a pickup or collision object.
  for(let i=0;i<30;i++){const y=231+(i*19)%66,x=wrap(i*67-world*(.1+(y-218)*.004),W+50)-25;rect(g,x,y,5+(i*7)%20,1,i%4?p.sea:p.foam);}
  g.globalAlpha=.23;for(let i=0;i<8;i++)rect(g,sx-17+Math.sin(i*2+t*.6)*6,230+i*8,34-i*3,1,p.sun);g.globalAlpha=1;
  // The eruption turns the whole visible bay into a molten basin. These distant
  // broad ribbons stay low contrast compared with the outlined airborne rocks.
  if(heat>0){
   g.globalAlpha=heat;
   rect(g,0,233,W,H-233,'#b9574d');rect(g,0,254,W,H-254,'#943e44');
   g.globalAlpha=heat*.8;rect(g,0,218,W,15,'#d37c5b');
   g.globalAlpha=heat;
   for(let i=0;i<22;i++){
    const y=236+(i*17)%65,x=wrap(i*43-world*(.1+(y-218)*.002),W+45)-25;
    rect(g,x,y,9+(i*7)%22,2,i%3?'#e98754':'#f8b36c');
    rect(g,x+7,y+4,12+(i*5)%18,2,'#733b43');
   }
   g.globalAlpha=1;
  }
  // The continuous foreground marks the fatal surface below the flight corridor.
  for(let x=-8;x<W+8;x+=8){const y=303+Math.round(Math.sin((x+world)*.055+t*2)*1.5);rect(g,x,y,8,2,p.foam);rect(g,x,y+2,8,H-y,p.deep);rect(g,x+2,y+5,4,1,p.sea);}
  if(heat>0){
   // Molten foreground replaces the complete water surface with a smooth fade.
   // Its top remains below the pilot's lowest permitted feet position.
   g.globalAlpha=heat;
   rect(g,0,303,W,H-303,'#bd4d43');rect(g,0,303,W,2,'#ffbb65');
   rect(g,0,305,W,3,'#f0824d');rect(g,0,315,W,H-315,'#853b40');
   for(let i=0;i<Math.ceil(W/18)+1;i++){
    const x=wrap(i*23-world*.18,W+30)-15;
    rect(g,x,309+(i%3)*3,13,2,'#f39955');rect(g,x+3,309+(i%3)*3,6,1,'#ffd185');
    rect(g,x+9,306+(i%4)*3,8,2,'#713b40');rect(g,x+12,308+(i%4)*3,5,1,'#98453d');
   }
   g.globalAlpha=1;
  }
 }
 function drawObstacle(g,o,{t=0,W=Infinity}={}){
  const x=Math.round(o.stage==='warning'?Math.min(W-16,o.x):o.x),y=Math.round(o.y);
  if(o.type==='shark'||o.type==='piranha'){
   const small=o.type==='piranha',lava=small||o.lava,stage=o.stage||'rise',q=Math.max(0,Math.min(1,o.progress||0));
   const foam=lava?'#ffce80':'#d3fff6',edge=lava?'#ff784b':'#5bded9',eye=lava?'#ffec8b':'#9afcff';
   if(stage==='warning'||stage==='splash'){
    // Surface tells remain below the flight corridor, directly under the jump.
    const spread=(small?10:18)+(stage==='splash'?q*17:Math.sin(t*9)*2);
    g.save();g.globalAlpha=stage==='splash'?1-q:1;
    rect(g,x-spread,303,spread*2,2,edge);rect(g,x-spread+3,302,spread*2-6,1,foam);
    for(let i=0;i<5;i++){
     const side=i-2,phase=(t*1.5+i*.19)%1,drop=stage==='splash'?Math.sin(q*Math.PI)*15:phase*7;
     rect(g,x+side*(spread/2),301-drop,2,2,foam);
    }
    if(stage==='warning'){
     poly(g,[[x-6,301],[x+3,293+Math.sin(t*7)],[x+6,301]],lava?'#a33140':'#34566b');
     rect(g,x-4,278,8,16,ink);rect(g,x-1,280,2,7,'#ffdc86');rect(g,x-1,290,2,2,'#ffdc86');
    }
    g.restore();return;
   }
   g.save();g.translate(x,y);
   // Gentle pitch keeps every solid pixel inside the conservative body collider.
   g.rotate((small?.7:1)*(stage==='rise'?.35*(1-q):stage==='dive'?-.4*q:Math.sin(t*5)*.025));
   if(o.facing===1)g.scale(-1,1);
   const fin=Math.round(Math.sin(t*15)*2),charging=stage==='aim'||stage==='fire';
   if(small){
    poly(g,[[5,-3],[11,-7+fin],[10,0],[11,7+fin],[5,4]],'#67273e');
    poly(g,[[6,-1],[10,-4+fin],[9,3+fin],[6,2]],'#ff8052');
    poly(g,[[-5,-6],[-1,-10],[3,-6],[6,-4],[8,1],[5,7],[0,10],[-3,7],[-8,5],[-11,1],[-9,-4]],'#492a3d');
    poly(g,[[-7,-4],[-2,-6],[3,-5],[6,-2],[6,3],[2,7],[-5,5],[-9,1]],'#ec4e48');
    rect(g,-5,-5,6,2,'#ff925b');rect(g,1,-3,3,3,'#bd3545');
    poly(g,[[-8,1],[-3,1],[1,4],[-6,4]],'#512c3a');
    rect(g,-8,1,2,2,white);rect(g,-5,2,2,2,white);rect(g,-2,3,2,2,white);
    poly(g,[[1,2],[5,2+fin],[2,6],[0,4]],'#ffaf69');
    rect(g,-7,-3,4,3,ink);rect(g,-6,-3,2,2,charging?eye:'#ffbf63');
   }else{
    poly(g,[[10,-2],[18,-10+fin],[17,-2],[20,5+fin],[12,4]],ink);
    poly(g,[[13,-1],[17,-6+fin],[16,0],[18,3+fin],[13,2]],'#7395a8');
    poly(g,[[-5,-5],[0,-12],[5,-10],[6,-4]],ink);
    poly(g,[[-2,-5],[1,-10],[3,-8],[4,-4]],'#8aaaba');
    poly(g,[[-20,0],[-17,-4],[-11,-6],[5,-5],[12,-2],[14,2],[8,5],[0,8],[-12,7],[-18,4]],ink);
    poly(g,[[-17,-1],[-12,-4],[4,-3],[11,-1],[10,3],[1,5],[-12,5],[-17,3]],'#7295a8');
    rect(g,-12,-4,13,2,'#a7c4cf');
    poly(g,[[-17,2],[-8,2],[0,3],[9,2],[5,5],[-1,6],[-12,5]],'#e3e9de');
    poly(g,[[-18,1],[-10,1],[-7,3],[-11,4],[-17,3]],'#322e3e');
    for(let z=0;z<3;z++)poly(g,[[-17+z*3,1],[-15+z*3,1],[-16+z*3,3]],white);
    poly(g,[[0,3],[7,5+fin],[3,10],[0,7],[-3,4]],ink);
    poly(g,[[1,4],[5,6+fin],[3,8]],'#7395a8');
    rect(g,-5,-1,1,3,'#3f6176');rect(g,-2,-1,1,3,'#3f6176');
    rect(g,-14,-3,4,3,ink);rect(g,-13,-3,2,2,charging?eye:'#e45b66');
   }
   if(charging){
    const ex=small?-5:-12,ey=-2;
    g.globalAlpha=.2+q*.3;rect(g,ex-4,ey-4,8,8,eye);g.globalAlpha=1;
    rect(g,ex-2,ey-1,4,2,eye);rect(g,ex-1,ey-2,2,4,white);
    if(stage==='fire'){g.globalAlpha=.6;poly(g,[[ex-3,ey],[ex-9,ey-3],[ex-6,ey],[ex-9,ey+3]],eye);g.globalAlpha=1;}
   }
   g.restore();
  }else if(o.type==='laser'){
   const a=o.small?9:14,b=o.small?2:3,c=o.small?'#ff7657':'#58eeff';
   g.save();g.globalAlpha=.22;rect(g,x-a-2,y-b-2,a*2+4,b*2+4,c);g.globalAlpha=1;
   rect(g,x-a,y-b,a*2,b*2,c);rect(g,x-a+2,y-1,a*2-4,2,'#fff9de');g.restore();
  }else if(o.type==='meteor'){
   // Eight-pixel body matches the collider; the translucent diagonal wake is air.
   g.globalAlpha=.23;
   poly(g,[[x-3,y-4],[x+15,y-24],[x+12,y-8],[x+5,y+2]],'#ffc178');
   g.globalAlpha=1;
   poly(g,[[x-4,y-8],[x+3,y-8],[x+7,y-4],[x+8,y+3],[x+3,y+8],[x-4,y+7],[x-8,y+2],[x-8,y-3]],'#302d3d');
   poly(g,[[x-3,y-6],[x+3,y-5],[x+5,y-2],[x+5,y+3],[x+1,y+6],[x-4,y+4],[x-6,y],[x-5,y-4]],'#835450');
   rect(g,x-2,y-5,2,4,'#ffb570');rect(g,x-1,y-1,5,2,'#ef7652');rect(g,x+2,y+1,2,4,'#ffc281');
   rect(g,x-5,y+1,3,2,'#ab6956');rect(g,x,y-3,3,2,'#4d3f46');
  }else if(o.type==='gate'){
   const a=o.len/2,top=y-a;
   // Narrow tether with integral striped flotation pods: the entire length is solid.
   rect(g,x-3,top,6,o.len,ink);rect(g,x-1,top,2,o.len,'#dde5dc');
   for(let z=top+3;z<y+a-4;z+=8){rect(g,x-2,z,4,4,red);rect(g,x,z,1,3,'#ff8e89');}
   for(const z of [top,y+a-5]){rect(g,x-4,z-2,8,8,ink);rect(g,x-3,z-1,6,6,red);rect(g,x-3,z+1,6,2,white);rect(g,x-1,z-1,1,1,'#ffb2a1');}
   // Tiny warm warning lamp is always visible, never a strobing laser.
   rect(g,x-1,top-3,2,2,'#ffdb86');
  }else if(o.type==='drone'){
   // A compact survey drone: paired propellers, camera and unmistakable float skids.
   rect(g,x-11,y-4,22,3,ink);rect(g,x-6,y-4,12,7,ink);rect(g,x-5,y-3,10,4,red);
   rect(g,x-4,y-2,8,1,white);rect(g,x-1,y+1,3,3,ink);rect(g,x,y+2,1,1,'#a6e7e6');
   rect(g,x-9,y+2,2,3,ink);rect(g,x+7,y+2,2,3,ink);rect(g,x-12,y+4,9,2,white);rect(g,x+3,y+4,9,2,white);
   const rotor=Math.sin(t*45)>0?7:5;rect(g,x-8-rotor/2,y-6,rotor,1,white);rect(g,x+8-rotor/2,y-6,rotor,1,white);
  }else{
   // Armored hydro-torpedo. Only the translucent cyan exhaust exceeds the body.
   g.save();g.globalAlpha=.23;
   poly(g,[[x+10,y-3],[x+23+Math.sin(t*39)*3,y],[x+10,y+3]],'#55e7ff');
   g.globalAlpha=.55;rect(g,x+12,y-1,5+Math.sin(t*31)*2,2,'#b7ffff');g.restore();
   poly(g,[[x-12,y],[x-8,y-4],[x+4,y-4],[x+8,y-6],[x+11,y-6],[x+9,y-2],[x+12,y-2],[x+12,y+2],[x+9,y+2],[x+11,y+6],[x+8,y+6],[x+4,y+4],[x-8,y+4]],'#1d263b');
   poly(g,[[x-9,y],[x-6,y-3],[x+4,y-3],[x+7,y],[x+4,y+3],[x-6,y+3]],'#c53249');
   rect(g,x-5,y-3,8,1,'#ff8e84');rect(g,x-4,y+2,8,1,'#7d2540');
   rect(g,x-10,y-1,3,2,'#ffdb96');rect(g,x-5,y-1,6,2,'#2b344b');
   rect(g,x-4,y-1,3,1,'#f36b67');rect(g,x+3,y-2,2,4,'#edf1df');
   rect(g,x+8,y-1,3,2,'#8cffff');rect(g,x+8,y-5,2,1,'#f3666a');rect(g,x+8,y+4,2,1,'#a83c53');
  }
 }
 // Small procedural details share the game's pixel palette; no sprite sheets or font dependencies.
 function sparkle(g,x,y,size,color){rect(g,x-size,y,size*2+1,1,color);rect(g,x,y-size,1,size*2+1,color);}
 function drawBill(g,c,{t=0,rare=false,reducedMotion=false}={}){
  const clock=reducedMotion?0:t,phase=clock*5+(c.seed||c.x*.03),scale=c.scale||1;
  g.save();g.translate(c.x,c.y);g.scale(scale,scale);g.rotate(Math.sin(phase)*.12);
  const aura=g.createRadialGradient(0,0,2,0,0,rare?23:17);
  aura.addColorStop(0,'#baff9d80');aura.addColorStop(1,'#60ffb000');g.fillStyle=aura;g.fillRect(-24,-24,48,48);
  // Four columns bend independently like a banknote caught in warm sea air.
  for(let col=0;col<4;col++){
   const x=-10+col*5,y=Math.round(Math.sin(phase+col*.85)*1.3);
   rect(g,x,y-6,5,12,'#155c47');rect(g,x,y-5,5,10,'#c0ffc5');rect(g,x+(col===0?1:0),y-4,col===0||col===3?4:5,8,col%2?'#48cb7a':'#35b86e');
  }
  rect(g,-4,-4,8,8,'#19764e');
  // A readable five-pixel dollar glyph, including the central vertical stroke.
  for(const [x,y,w,h] of [[-2,-3,5,1],[-2,-2,1,2],[-2,0,5,1],[2,1,1,2],[-2,3,5,1],[0,-4,1,9]])rect(g,x,y,w,h,'#efffc8');
  rect(g,-8,-1,1,2,'#e8ffcf');rect(g,7,0,1,2,'#e8ffcf');
  for(let i=0;i<3;i++){
   const a=clock*.9+i*2.1,r=14+i*2;
   g.globalAlpha=.45+(Math.sin(clock*2+i)+1)*.2;
   sparkle(g,Math.cos(a)*r,Math.sin(a)*r*.6,1,i%2?'#fff6ba':'#c6fff0');
  }
  g.restore();
 }
 function drawHeaven(g,{W,H=320,t=0,world=0,reducedMotion=false}){
  g.save();const sky=g.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#70cbe9');sky.addColorStop(.65,'#c5f2f2');sky.addColorStop(1,'#fff4ce');g.fillStyle=sky;g.fillRect(0,0,W,H);
  const sx=W*.77,sy=58,sun=g.createRadialGradient(sx,sy,6,sx,sy,64);
  sun.addColorStop(0,'#fff9d3');sun.addColorStop(.3,'#fff3c3b0');sun.addColorStop(1,'#ffedab00');g.fillStyle=sun;g.fillRect(sx-64,sy-64,128,128);
  rect(g,sx-9,sy-12,18,24,'#fff8d7');rect(g,sx-12,sy-8,24,16,'#fff8d7');
  for(let layer=0;layer<3;layer++)for(let i=0;i<5;i++){
   const x=wrap(i*127+layer*51-world*(.025+layer*.035),W+160)-80,y=110+layer*72+(i*31)%45,s=1+layer*.35;
   g.globalAlpha=.45+layer*.18;
   rect(g,x,y,62*s,8*s,'#fffdf1');rect(g,x+9*s,y-7*s,45*s,9*s,'#fffdf1');rect(g,x+19*s,y-14*s,22*s,9*s,'#fffdf1');
   rect(g,x+8*s,y+8*s,46*s,2*s,'#e1f2ed');
  }
  g.globalAlpha=.65;
  for(let i=0;i<8;i++){const x=wrap(i*73-world*.06,W),y=23+(i*47)%260;sparkle(g,x,y,1,'#fffbe2');}
  g.restore();
 }
 function drawGoldGlow(g,{W,H=320,t=0,amount=1,reducedMotion=false}){
  g.save();const clock=reducedMotion?0:t,pulse=reducedMotion?1:.92+Math.sin(clock*2)*.08;
  g.globalAlpha=Math.max(0,Math.min(1,amount))*pulse;
  const depth=Math.min(W*.15,28);
  for(const [x0,y0,x1,y1,x,y,w,h] of [[0,0,depth,0,0,0,depth,H],[W,0,W-depth,0,W-depth,0,depth,H],[0,0,0,24,0,0,W,24],[0,H,0,H-28,0,H-28,W,28]]){
   const glow=g.createLinearGradient(x0,y0,x1,y1);glow.addColorStop(0,'#ffc43daf');glow.addColorStop(.22,'#ffce5066');glow.addColorStop(1,'#ffe18900');g.fillStyle=glow;g.fillRect(x,y,w,h);
  }
  g.globalAlpha*=.65;rect(g,0,0,W,1,'#ffe6a2');rect(g,0,H-1,W,1,'#ffe6a2');rect(g,0,0,1,H,'#ffe6a2');rect(g,W-1,0,1,H,'#ffe6a2');
  for(let i=0;i<14;i++){
   const side=i%4,q=wrap(i*.173+clock*.025,1),inset=3+(i%3)*2;
   const x=side===0?inset:side===1?W-inset:q*W,y=side===2?inset:side===3?H-inset:q*H;
   sparkle(g,x,y,i%3===0?2:1,'#fff4c6');
  }
  g.restore();
 }
 function drawPortal(g,{W,H=320,t=0,progress=0,exiting=false,reducedMotion=false}){
  const q=Math.max(0,Math.min(1,progress)),clock=reducedMotion?0:t,cx=W*.5,cy=H*.45;
  g.save();
  if(exiting){g.globalAlpha=Math.sin(q*Math.PI);rect(g,0,0,W,H,'#fffdf4');g.restore();return;}
  const radius=12+q*Math.max(W,H)*.7;
  const halo=g.createRadialGradient(cx,cy,Math.max(0,radius*.45),cx,cy,radius*1.2);
  halo.addColorStop(0,'#a6fff000');halo.addColorStop(.5,'#8cf6e83f');halo.addColorStop(.78,'#fff2b7ba');halo.addColorStop(1,'#a6fff000');g.fillStyle=halo;g.fillRect(0,0,W,H);
  for(let ring=0;ring<3;ring++){
   const r=radius*(.62+ring*.17);g.globalAlpha=.7-ring*.15;g.strokeStyle=ring===1?'#fff1b2':'#9affee';g.lineWidth=ring===1?2:1;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke();
  }
  g.globalAlpha=.9;
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6+clock*.8,r=radius*(.75+(i%3)*.12);
   sparkle(g,cx+Math.cos(a)*r,cy+Math.sin(a)*r,1+i%2,i%2?'#ffffe3':'#a5ffe9');
  }
  g.globalAlpha=q*q*.9;rect(g,0,0,W,H,'#fffdf4');g.restore();
 }
 globalThis.JetlevTheme=Object.freeze({drawBackground,drawObstacle,drawBill,drawHeaven,drawGoldGlow,drawPortal});
})();
