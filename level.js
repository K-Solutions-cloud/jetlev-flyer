/* Shared flight physics and conservative, witness-based level generation. */
(() => {
  'use strict';
  const {STEP,WATER_Y,fly}=globalThis.JetlevFlight;
  const speedAt = distance => 100 + Math.min(65, distance * .065);

  const aquatic=o=>o.type==='shark'||o.type==='piranha';
  const rate=o=>aquatic(o)?.4:o.type==='laser'?2.4:o.type==='rocket'?1.45:1;
  function pose(o,scroll=0){
    const travel=(o.travel||0)+scroll,x=o.x-scroll*rate(o);
    if(aquatic(o)){
      const progress=(travel-o.warn)/o.duration;
      const stage=progress<0?'warning':progress<.28?'rise':travel<o.warn+o.duration*.5?'aim':progress<.59?'fire':progress<1?'dive':'splash';
      return {x,y:progress<0||progress>1?312:303-o.height*Math.sin(Math.PI*progress),progress:progress>=1?Math.min(1,(travel-o.warn-o.duration)/45):Math.max(0,progress),stage,active:progress>=0&&progress<=1};
    }
    if(o.type==='laser')return {x,y:o.y,active:travel>=o.activation&&travel<o.expires};
    return {x,y:o.type==='meteor'?o.y+scroll*o.fall:o.type==='drone'?o.baseY:o.y,active:true};
  }
  function horizon(o,pilotX){
    if(aquatic(o))return Math.max(0,o.warn+o.duration+40-(o.travel||0));
    if(o.type==='laser')return Math.max(0,o.expires-(o.travel||0));
    return (o.x-pilotX+bounds(o).x+16)/rate(o);
  }

  function bounds(obstacle) {
    if(obstacle.type==='shark')return {x:23,y:19};
    if(obstacle.type==='piranha')return {x:13,y:13};
    if(obstacle.type==='laser')return {x:obstacle.small?9:14,y:obstacle.small?2:3};
    if(obstacle.type==='meteor')return {x:8,y:8};
    return obstacle.type === 'gate'
      ? { x: 5, y: obstacle.len / 2 + 3 }
      : { x: 12, y: 6 };
  }

  // Reserve the drone's entire vertical sweep, not only its current position.
  function safe(y, scroll, pilotX, obstacles, margin = 5) {
    if(y>=WATER_Y-margin)return false;
    return obstacles.every(o => {
      const box = bounds(o);
      const at=pose(o,scroll);if(!at.active)return true;
      const x=at.x,center=at.y;
      const sweep = o.type === 'drone' ? 13 : 0;
      return Math.abs(x - pilotX) >= box.x + 10 + margin ||
        Math.abs(center - y) >= box.y + 20 + sweep + margin;
    });
  }

  // Protect a coin's complete remaining lifetime, including faster rockets.
  function coinClear(coin, o) {
    const box = bounds(o);
    if(aquatic(o)||o.type==='laser'){
      // Conservatively cover relative motion and the complete vertical jump sweep.
      const remaining=aquatic(o)?Math.max(0,o.warn+o.duration-(o.travel||0)):Math.max(0,o.expires-(o.travel||0));
      const dx=o.x-coin.x,end=dx+(1-rate(o))*remaining;
      if(Math.min(dx,end)>box.x+23||Math.max(dx,end)<-box.x-23)return true;
      return aquatic(o)?coin.y<303-o.height-box.y-33:Math.abs(coin.y-o.y)>box.y+33;
    }
    if(o.type==='meteor'){
      // Coins and falling rocks share horizontal scrolling. Reserve the rock's
      // complete downward sweep while the coin can still be collected.
      if(Math.abs(o.x-coin.x)>box.x+23)return true;
      const bottom=o.y+Math.max(0,coin.x+25)*o.fall;
      return coin.y<o.y-box.y-33||coin.y>bottom+box.y+33;
    }
    const center = o.type === 'drone' ? o.baseY : o.y;
    const vertical = box.y + (o.type === 'drone' ? 13 : 0) + 33;
    if (Math.abs(center - coin.y) >= vertical) return true;
    const dx = o.x - coin.x;
    const end = dx - (o.type === 'rocket' ? .45 * Math.max(0, coin.x + 25) : 0);
    return Math.min(dx, end) > box.x + 23 || Math.max(dx, end) < -box.x - 23;
  }

  function forecast(distance, endScroll) {
    const frames = [];
    let scroll = 0;
    while (scroll < endScroll && frames.length < 2400) {
      const delta = speedAt(distance) * STEP;
      distance += delta * .16;
      scroll += delta;
      frames.push(scroll);
    }
    return frames;
  }

  // Beam search over actual hold/release inputs. Every accepted path has a
  // replayable input witness; failure only omits a spawn, never weakens safety.
  function plan({ pilot, distance, obstacles, coins, endScroll, reactionTime = 0, held = false }) {
    const targets = coins.filter(c => c.x > pilot.x + 3).sort((a, b) => a.x - b.x);
    const end = Math.max(endScroll || 0, ...targets.map(c => c.x - pilot.x + 28), ...obstacles.map(o => horizon(o,pilot.x)), 30);
    const frames = forecast(distance, end);
    if (!frames.length || frames[frames.length - 1] < end) return null;
    let beam = [{ ...pilot, next: 0, parent: null, path: [] }];
    const branchSteps = 18; // At most one input change per 150 ms.
    for (let offset = 0; offset < frames.length; offset += branchSteps) {
      const candidates = new Map();
      for (const previous of beam) for (const thrust of [false, true]) {
        const node = { ...previous, next: previous.next,
          parent: previous, path: [], thrust };
        let valid = true;
        for (let j = offset; j < Math.min(offset + branchSteps, frames.length); j++) {
          const input = j * STEP < reactionTime ? held : thrust;
          fly(node, input);
          const scroll = frames[j];
          if (!safe(node.y, scroll, pilot.x, obstacles)) { valid = false; break; }
          while (node.next < targets.length && targets[node.next].x - pilot.x <= scroll) {
            if (Math.abs(node.y - 2 - targets[node.next].y) > 8) { valid = false; break; }
            node.next++;
          }
          if (!valid) break;
          node.path.push({ x: pilot.x + scroll, y: node.y, thrust: input });
        }
        if (!valid) continue;
        const next = targets[node.next];
        node.rank = next ? Math.abs(node.y - 2 - next.y) + Math.abs(node.vy) * .06 : Math.abs(node.vy) * .06;
        const key = Math.round(node.y / 4) + ':' + Math.round(node.vy / 12) + ':' + node.next + ':' + Math.round((node.charge||0)*5) + ':' + Math.ceil((node.boost||0)*3) + ':' + !!node.boostSpent;
        if (!candidates.has(key) || candidates.get(key).rank > node.rank) candidates.set(key, node);
      }
      beam = [...candidates.values()].sort((a, b) => a.rank - b.rank).slice(0, 72);
      if (!beam.length) return null;
    }
    const winner = beam.find(n => n.next === targets.length);
    if (!winner) return null;
    const chunks = [];
    for (let n = winner; n.parent; n = n.parent) chunks.push(n.path);
    return chunks.reverse().flat();
  }

  function formation({ pilot, distance, obstacles, existing = [], width, random = Math.random }) {
    const startX = width + 24;
    const bases = [Math.max(65, Math.min(240, pilot.y - 2 + (random() - .5) * 65)),
      75 + random() * 155, 80, 155, 230];
    for (let attempt = 0; attempt < bases.length; attempt++) {
      const shape = Math.floor(random() * 3), direction = random() < .5 ? -1 : 1;
      const coins = Array.from({ length: 6 }, (_, i) => ({
        x: startX + i * 17,
        y: bases[attempt] + (shape === 0 ? 0 : shape === 1 ? Math.sin(i / 5 * Math.PI) * 17 * direction : i * 4 * direction),
        phase: i * .4
      }));
      if (!coins.every(c => c.y >= 55 && c.y <= 250 && obstacles.every(o => coinClear(c, o)))) continue;
      const path = plan({ pilot, distance, obstacles, coins: [...existing, ...coins] });
      if (path) return { coins, path };
    }
    return null;
  }

  // Groups are proposed together and accepted atomically, with one replayable route.
  function encounter({pilot,distance,width,obstacles=[],coins=[],reservations=[],held=false,
    center=155,type='gate',random=Math.random}) {
    const progress=Math.max(0,Math.min(1,(distance-220)/1580));
    const multi=random()<progress*.72;
    const count=multi?(distance>650&&random()<progress*.45?3:2):1;
    const speed=speedAt(distance),spacing=speed*(1.35-.25*progress);
    const mode=multi?Math.floor(random()*3):-1;
    const group=[];
    const make=(kind,y,delay=0)=>{
      const factor=kind==='rocket'?1.45:1;
      const lead=Math.max((width+20-pilot.x)/speed,kind==='rocket'?1.85:1.4);
      return {type:kind,x:pilot.x+speed*factor*(lead+delay),y,baseY:y,
        len:43+random()*20,phase:random()*6,passed:false};
    };
    if(mode===0){ // A legible rising/falling slalom, never an instant reversal.
      const direction=center<155?1:-1;
      for(let i=0;i<count;i++)group.push(make('gate',Math.max(75,Math.min(230,center+direction*i*62)),i*spacing/speed));
    }else if(mode===1){ // Twin torpedoes leave a broad corridor between their lanes.
      const middle=Math.max(135,Math.min(175,center));
      group.push(make('rocket',middle-78),make('rocket',middle+78));
      if(count===3)group.push(make('rocket',middle,1.65));
    }else if(mode===2){ // Barrier then torpedo: enough time to change altitude.
      group.push(make('gate',Math.max(80,Math.min(225,center))));
      for(let i=1;i<count;i++)group.push(make('rocket',center<155?215:85,i*1.4));
    }else group.push(make(type,Math.max(70,Math.min(235,center))));
    if(group.some(o=>!coins.every(c=>coinClear(c,o))||!reservations.every(p=>safe(p.y,p.x-pilot.x,pilot.x,[o]))))return null;
    const path=plan({pilot,distance,obstacles:[...obstacles,...group],coins,reactionTime:.35,held});
    if(!path)return null;
    const arrivals=group.map(o=>(o.x-pilot.x)/(speed*(o.type==='rocket'?1.45:1)));
    return {obstacles:group,path,mode,progress,span:Math.max(...arrivals)-Math.min(...arrivals)};
  }

  function creatureEncounter({pilot,distance,width,lava=false,obstacles=[],coins=[],reservations=[],held=false,random=Math.random}){
    const speed=speedAt(distance),group=[],count=lava?2:1;
    for(let i=0;i<count;i++){
      const height=lava?85+random()*120:95+random()*135;
      const warn=speed*(.9+i*.65),duration=speed*(lava?1.85:2.1),fire=warn+duration*.5;
      const x=pilot.x+.4*(warn+duration*(.72+random()*.14));
      group.push({type:lava?'piranha':'shark',x,y:312,height,warn,duration,travel:0,lava,passed:false});
      group.push({type:'laser',x:x-.4*fire-(lava?5:12)+2.4*fire,y:303-height-2,travel:0,activation:fire,expires:fire+speed*1.2,small:lava,lava,passed:false});
    }
    if(group.some(o=>!coins.every(c=>coinClear(c,o))||!reservations.every(p=>safe(p.y,p.x-pilot.x,pilot.x,[o]))))return null;
    const path=plan({pilot,distance,obstacles:[...obstacles,...group],coins,reactionTime:.35,held});
    return path?{obstacles:group,path}:null;
  }

  globalThis.JetlevLevel = Object.freeze({ STEP, WATER_Y, speedAt, fly, bounds, safe, coinClear, plan, formation, encounter, creatureEncounter, pose, rate, aquatic, horizon });
})();
