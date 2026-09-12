const assert=require('node:assert/strict');
require('../bonus.js');
const B=globalThis.JetlevBonus;
assert.deepEqual(B.roll(()=>0),{heaven:true});
assert.deepEqual(B.roll(()=>.009999),{heaven:true});
assert.equal(B.roll(()=>.01).heaven,undefined);
let portals=0;
for(let i=0;i<10000;i++){
  const reward=B.roll(()=>i/10000);
  if(reward.heaven){portals++;continue;}
  assert.ok(['shield','magnet','boost','gold','coins'].includes(reward.kind));
  const cells=B.layout(reward,()=>i/10000),counts={};
  assert.equal(cells.length,9);
  for(const kind of cells)counts[kind]=(counts[kind]||0)+1;
  assert.equal(counts[reward.kind],3);
  for(const [kind,count]of Object.entries(counts))if(kind!==reward.kind)assert.ok(count<=2);
}
assert.equal(portals,100,'exact 1% portal boundary');
console.log('PASS: exact 1% portal roll, guaranteed unique scratch triple, bounded reward pool.');
