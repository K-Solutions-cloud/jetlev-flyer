const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
test('boost HUD and aquatic stages render together without runtime errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const compiled=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 const css=/href="(assets\/style-[^"]+)"/.exec(compiled)[1];
 const raw=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('href="style.css"','href="'+css+'"');
 const scripts=['flight','level','heaven','bonus','effects','music','water','director','progression','theme','career','game'];
 for(const name of scripts){
  let source=fs.readFileSync(path.join(root,name+'.js'),'utf8');
  if(name==='game')source=source.replace('resize();requestAnimationFrame(frame);',`globalThis.scene=(lava=false)=>{
   start();state='paused';startAge=10;toastLife=0;$('toast').hidden=true;$('boost-hint').hidden=true;
   p={x:W*.27,y:170,vy:-50,boost:4,charge:0,boostSpent:true};renderY=170;jetFeel=1;
   eruptionVisual=lava?1:0;shield=magnet=flow=gold=0;
   for(let i=0;i<100;i++)updateWater(1/120);
   obstacles=[{type:lava?'piranha':'shark',x:W*.73,y:150,stage:'fire',progress:.52,lava},{type:lava?'piranha':'shark',x:W*.72,y:312,stage:'splash',progress:.3,lava},{type:'laser',x:W*.5,y:148,active:true,small:lava},{type:'rocket',x:W*.75,y:80}];
   updateHud();render();
  };globalThis.bonusDemo=(sky=false)=>{start();p.y=145;obstacles=[];pickups=[];obstacleTimer=coinTimer=powerTimer=billTimer=fishTimer=100;const roll=JetlevBonus.roll;JetlevBonus.roll=()=>sky?{heaven:true}:{kind:'boost',amount:5};startBillEvent();JetlevBonus.roll=roll;};globalThis.bonusProbe=()=>({state,dist,boost:p.boost,coins,skyTime:heavenSession?.time,audioState:audio?.state,jetVolume:jetGain?.gain.value});globalThis.endSky=()=>{heavenSession.earned=35;heavenSession.time=.01;heavenSession.bills=[];heavenSession.spawnTimer=100;};resize();requestAnimationFrame(frame);`);
  await page.route('**/'+name+'.js',route=>route.fulfill({body:source,contentType:'text/javascript'}));
 }
 await page.route('**/jetlev-flyer/scene.html',route=>route.fulfill({body:raw,contentType:'text/html'}));
 await page.goto('scene.html');await page.screenshot({path:'/tmp/jetlev-paradise-home.png'});await page.locator('#start').click();await page.evaluate(()=>scene());
 await expect(page.locator('#boost-card')).toBeVisible();await expect(page.locator('#boost-time')).toContainText('4');
 await page.screenshot({path:'/tmp/jetlev-aquatic-water.png'});
 await page.evaluate(()=>scene(true));await page.screenshot({path:'/tmp/jetlev-aquatic-lava.png'});
 await page.evaluate(()=>bonusDemo(false));await expect(page.locator('.bonus-overlay')).toBeVisible();
 const frozen=await page.evaluate(()=>bonusProbe().dist);await page.waitForTimeout(150);expect(await page.evaluate(()=>bonusProbe().dist)).toBe(frozen);
 await page.screenshot({path:'/tmp/jetlev-scratch.png'});
 const first=page.locator('.bonus-tile').first(),box=await first.boundingBox();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await expect.poll(()=>page.evaluate(()=>bonusProbe().audioState)).toBe('suspended');
 await page.mouse.move(box.x+5,box.y+box.height*.45);await page.mouse.down();
 await first.locator('canvas').dispatchEvent('pointerup',{pointerId:999,pointerType:'touch'});
 await page.mouse.move(box.x+box.width-5,box.y+box.height*.45,{steps:12});await page.mouse.up();
 await expect(first).toHaveClass(/revealed/);
 await expect.poll(()=>page.evaluate(()=>bonusProbe().audioState)).toBe('running');
 for(let i=1;i<9;i++){if(await page.locator('.bonus-continue').isEnabled())break;await page.locator('.bonus-tile').nth(i).focus();await page.keyboard.press('Enter');}
 await expect(page.locator('.bonus-continue')).toBeEnabled();expect(await page.evaluate(()=>bonusProbe().boost)).toBe(5);
 await page.locator('.bonus-continue').click();await expect(page.locator('#boost-card')).toBeVisible();
 await page.evaluate(()=>bonusDemo(true));await page.waitForFunction(()=>bonusProbe().state==='heaven');await page.waitForTimeout(600);
 await page.screenshot({path:'/tmp/jetlev-heaven.png'});
 await page.locator('#pause').click();const remaining=await page.evaluate(()=>bonusProbe().skyTime);await page.waitForTimeout(150);expect(await page.evaluate(()=>bonusProbe().skyTime)).toBe(remaining);
 await page.locator('#resume').click();await page.evaluate(()=>endSky());await page.waitForFunction(()=>bonusProbe().state==='return-ready');expect(await page.evaluate(()=>bonusProbe().coins)).toBe(35);
 await expect.poll(()=>page.evaluate(()=>bonusProbe().jetVolume)).toBeLessThan(.0001);await page.keyboard.press('Space');expect(await page.evaluate(()=>bonusProbe().state)).toBe('playing');
 expect(errors).toEqual([]);
});
