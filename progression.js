/* Local, earn-only island career. Never changes flight physics. */
(() => {
  'use strict';
  const KEY = 'jetlev-career-v1';
  const metrics = ['distance', 'coins', 'perfects', 'shieldSaves', 'runs'];
  const islands = [
    {id:'lagoon',name:'TÜRKISLAGUNE',subtitle:'Dein erster Sommer',color:'#53d8cc',missions:[
      {id:'lagoon-distance',label:'600 m entdecken',metric:'distance',target:600},
      {id:'lagoon-coins',label:'60 Münzen sammeln',metric:'coins',target:60},
      {id:'lagoon-perfects',label:'3 perfekte Reihen',metric:'perfects',target:3}
    ]},
    {id:'harbor',name:'PALMENHAFEN',subtitle:'Zwischen Palmen und Piers',color:'#f6ce79',missions:[
      {id:'harbor-distance',label:'1.500 m entdecken',metric:'distance',target:1500},
      {id:'harbor-coins',label:'150 Münzen sammeln',metric:'coins',target:150},
      {id:'harbor-perfects',label:'6 perfekte Reihen',metric:'perfects',target:6}
    ]},
    {id:'sunset',name:'VULKANBUCHT',subtitle:'Ein letzter Flug im Abendlicht',color:'#ff947a',missions:[
      {id:'sunset-distance',label:'3.000 m entdecken',metric:'distance',target:3000},
      {id:'sunset-coins',label:'300 Münzen sammeln',metric:'coins',target:300},
      {id:'sunset-perfects',label:'12 perfekte Reihen',metric:'perfects',target:12}
    ]}
  ];
  const cosmetics = [
    {id:'classic',name:'JETLEV ORIGINAL',price:0,color:'#ef3340',trail:'#c9fbff'},
    {id:'coral',name:'KORALLENGLANZ',price:100,color:'#ff7772',trail:'#ffe0ba'},
    {id:'aqua',name:'LAGUNENLICHT',price:200,color:'#65e5d8',trail:'#adfff5'},
    {id:'sunset',name:'ABENDGOLD',price:350,color:'#ffd078',trail:'#ffe9a9'},
    {id:'rainbow',name:'REGENBOGEN',price:500,color:'#d6a9ff',trail:'#c9fbff',rainbow:true}
  ];
  const integer = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,Math.min(1e9,Math.floor(value))) : 0;
  const emptyStats = () => Object.fromEntries(metrics.map(metric=>[metric,0]));
  const fresh = () => ({version:1,bank:0,selectedIsland:'lagoon',equipped:'classic',owned:['classic'],islands:Object.fromEntries(islands.map(island=>[island.id,emptyStats()])),runIds:[]});
  function complete(profile,island) { return island.missions.every(m=>profile.islands[island.id][m.metric]>=m.target); }
  function isUnlocked(profile,id) {
    const index=islands.findIndex(island=>island.id===id);
    return index>=0 && islands.slice(0,index).every(island=>complete(profile,island));
  }
  function sanitize(raw) {
    const profile=fresh();
    if(!raw || typeof raw!=='object' || raw.version!==1)return profile;
    profile.bank=integer(raw.bank);
    for(const island of islands)for(const metric of metrics)profile.islands[island.id][metric]=integer(raw.islands?.[island.id]?.[metric]);
    if(Array.isArray(raw.owned))profile.owned=[...new Set(['classic',...raw.owned.filter(id=>cosmetics.some(c=>c.id===id))])];
    if(profile.owned.includes(raw.equipped))profile.equipped=raw.equipped;
    if(isUnlocked(profile,raw.selectedIsland))profile.selectedIsland=raw.selectedIsland;
    if(Array.isArray(raw.runIds))profile.runIds=[...new Set(raw.runIds.filter(id=>typeof id==='string'&&id.length>0&&id.length<=120))].slice(-128);
    return profile;
  }
  function load(storage) {
    try { return sanitize(JSON.parse((storage || globalThis.localStorage).getItem(KEY))); }
    catch { return fresh(); }
  }
  function save(profile,storage) {
    try { (storage || globalThis.localStorage).setItem(KEY,JSON.stringify(sanitize(profile)));return true; }
    catch { return false; }
  }
  function missionProgress(profile,islandId=profile.selectedIsland) {
    const island=islands.find(item=>item.id===islandId);
    if(!island)return [];
    return island.missions.map(m=>({...m,value:Math.min(m.target,profile.islands[islandId][m.metric]),complete:profile.islands[islandId][m.metric]>=m.target}));
  }
  function recordRun(profile,run) {
    const result={credited:false,earned:0,completed:[],unlocked:[]};
    if(!run || typeof run.id!=='string' || !run.id.length || run.id.length>120 || profile.runIds.includes(run.id))return result;
    const islandId=run.islandId || profile.selectedIsland;
    if(!isUnlocked(profile,islandId))return result;
    const before=missionProgress(profile,islandId),locked=islands.filter(island=>!isUnlocked(profile,island.id));
    const stats=profile.islands[islandId];
    for(const metric of metrics)stats[metric]=integer(stats[metric]+(metric==='runs'?1:integer(run[metric])));
    result.earned=integer(run.coins);
    profile.bank=integer(profile.bank+result.earned);
    profile.runIds.push(run.id);
    profile.runIds=profile.runIds.slice(-128);
    result.credited=true;
    result.completed=missionProgress(profile,islandId).filter((m,i)=>m.complete&&!before[i].complete).map(m=>m.id);
    result.unlocked=locked.filter(island=>isUnlocked(profile,island.id)).map(island=>island.id);
    return result;
  }
  function buy(profile,id) {
    const cosmetic=cosmetics.find(item=>item.id===id);
    if(!cosmetic || profile.owned.includes(id) || profile.bank<cosmetic.price)return false;
    profile.bank-=cosmetic.price;profile.owned.push(id);return true;
  }
  function equip(profile,id) {
    if(!cosmetics.some(item=>item.id===id)||!profile.owned.includes(id))return false;
    profile.equipped=id;return true;
  }
  function selectIsland(profile,id) {
    if(!isUnlocked(profile,id))return false;
    profile.selectedIsland=id;return true;
  }
  globalThis.JetlevProgression={KEY,islands,cosmetics,load,save,recordRun,buy,equip,selectIsland,missionProgress,isUnlocked};
})();
