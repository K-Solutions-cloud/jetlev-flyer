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
 function palm(g,x,y,s,p){
  poly(g,[[x,y],[x+3*s,y],[x+7*s,y-29*s],[x+5*s,y-31*s]],p.leaf);
  const top=y-30*s;
  poly(g,[[x+6*s,top],[x-4*s,top-6*s],[x-17*s,top-2*s],[x-21*s,top+4*s],[x-7*s,top],[x+6*s,top+2*s]],p.leaf);
  poly(g,[[x+6*s,top],[x+15*s,top-7*s],[x+29*s,top-2*s],[x+31*s,top+4*s],[x+17*s,top],[x+7*s,top+2*s]],p.leaf);
  poly(g,[[x+6*s,top],[x+3*s,top-13*s],[x+9*s,top-15*s],[x+13*s,top-5*s]],p.leaf);
 }
 function drawBackground(g,{W,H=320,t=0,world=0,island=0}){
  const index=typeof island==='number'?island:({lagoon:0,harbor:1,sunset:2}[island]||0),p=palettes[wrap(index,3)];
  rect(g,0,0,W,H,p.sky);rect(g,0,75,W,67,p.haze);rect(g,0,142,W,82,p.cloud);
  const sx=W*.76;
  rect(g,sx-18,66,36,45,p.sun);rect(g,sx-23,72,46,33,p.sun);rect(g,sx-26,81,52,16,p.sun);
  for(let i=0;i<5;i++){const x=wrap(i*137-world*.035,W+160)-80,y=30+(i*29)%84;rect(g,x,y,36,3,p.cloud);rect(g,x+7,y-4,17,5,p.cloud);rect(g,x+26,y+3,22,2,p.cloud);}
  // Broad, quiet silhouettes leave the flight corridor readable.
  for(let layer=0;layer<2;layer++){
   const base=191+layer*14,step=8;g.fillStyle=layer?p.hill:p.far;g.beginPath();g.moveTo(0,225);
   for(let x=0;x<=W+step;x+=step){const z=x+world*(.065+layer*.035);g.lineTo(x,base-Math.round((Math.sin(z*.018+layer)*11+Math.sin(z*.037)*6)/3)*3);}
   g.lineTo(W,225);g.closePath();g.fill();
  }
  if(index===2){
   // A quiet extinct caldera gives Vulkanbucht a unique horizon, never a hazard.
   const vx=W*.62+Math.sin(world*.001)*W*.08;
   poly(g,[[vx-74,218],[vx-44,188],[vx-16,137],[vx-6,141],[vx+5,140],[vx+15,134],[vx+38,182],[vx+73,218]],p.far);
   poly(g,[[vx-16,137],[vx-6,141],[vx+5,140],[vx+15,134],[vx+25,155],[vx+6,150],[vx-8,151]],p.hill);
   poly(g,[[vx+5,151],[vx+38,182],[vx+73,218],[vx+21,218]],p.hill);
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
  // Foreground surface is continuous and explicitly safe, unlike striped hazards.
  for(let x=-8;x<W+8;x+=8){const y=303+Math.round(Math.sin((x+world)*.055+t*2)*1.5);rect(g,x,y,8,2,p.foam);rect(g,x,y+2,8,H-y,p.deep);rect(g,x+2,y+5,4,1,p.sea);}
 }
 function drawObstacle(g,o,{t=0}={}){
  const x=Math.round(o.x),y=Math.round(o.y);
  if(o.type==='gate'){
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
   // Left-facing racing floatplane. Solid pixels remain within +/-12 by +/-6.
   poly(g,[[x-12,y],[x-7,y-3],[x+8,y-3],[x+10,y-5],[x+12,y-5],[x+12,y+2],[x-7,y+3]],ink);
   rect(g,x-7,y-2,16,4,red);rect(g,x-6,y-2,6,1,white);rect(g,x-1,y-4,5,2,ink);rect(g,x,y-3,3,1,'#c2eae5');
   rect(g,x+3,y-5,3,9,white);rect(g,x+4,y-4,1,7,red);rect(g,x+9,y-4,2,2,red);
   rect(g,x-5,y+3,2,2,ink);rect(g,x+4,y+3,2,2,ink);rect(g,x-8,y+5,16,1,white);
   rect(g,x-11,y-4,1,Math.sin(t*65)>0?8:5,white);
   // Soft atmospheric slipstream, not a flame and not part of the collider.
   g.globalAlpha=.3;rect(g,x+16,y-2,5,1,white);rect(g,x+21+Math.sin(t*9)*2,y+2,7,1,white);g.globalAlpha=1;
  }
 }
 globalThis.JetlevTheme=Object.freeze({drawBackground,drawObstacle});
})();
