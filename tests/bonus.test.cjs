const assert=require('node:assert/strict');
require('../bonus.js');
const B=globalThis.JetlevBonus;
assert.deepEqual(B.roll(()=>0),{heaven:true});
assert.deepEqual(B.roll(()=>.009999),{heaven:true});
assert.equal(B.roll(()=>.01).heaven,undefined);
assert.equal(B.rewards?.length,15,'five existing and ten new bonuses');
assert.deepEqual(Object.values(B.rarities).map(r=>r.color),['#ffffff','#1eff00','#0070dd','#a335ee','#ff8000']);
let portals=0;
for(let i=0;i<10000;i++){
  const reward=B.roll(()=>i/10000);
  if(reward.heaven){portals++;continue;}
  assert.ok(B.rewards.some(item=>item.kind===reward.kind));
  const cells=B.layout(reward,()=>i/10000),counts={};
  assert.equal(cells.length,9);
  for(const kind of cells)counts[kind]=(counts[kind]||0)+1;
  assert.equal(counts[reward.kind],3);
  for(const [kind,count]of Object.entries(counts))if(kind!==reward.kind)assert.ok(count<=2);
}
assert.equal(portals,100,'exact 1% portal boundary');
const rarityCounts={};
for(let i=0;i<10000;i++){const random=[.5,i/10000,.5];const reward=B.roll(()=>random.shift());rarityCounts[reward.rarity]=(rarityCounts[reward.rarity]||0)+1;}
assert.deepEqual(rarityCounts,{common:2500,uncommon:3500,rare:2500,epic:1300,legendary:200});
console.log('PASS: exact 1% portal roll, guaranteed unique scratch triple, bounded reward pool.');
