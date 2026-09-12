const {test,expect}=require('@playwright/test');
test('stale document switches to the active release before PLAY is enabled',async({page})=>{
 let staleSent=false;
 await page.route('**/jetlev-flyer/',async route=>{
  const response=await route.fetch();
  staleSent=true;
  await route.fulfill({response,body:(await response.text()).replace(/name="app-version" content="[^"]+"/,'name="app-version" content="old-release"')});
 });
 await page.goto('./');
 await expect(page.locator('#start')).toBeEnabled();
 expect(staleSent).toBe(true);
 expect(await page.locator('meta[name="app-version"]').getAttribute('content')).not.toBe('old-release');
 await page.locator('#start').tap();await expect(page.locator('#hud')).toBeVisible();
});
test('installable, self-contained and playable offline under repository path',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const external=[];page.on('request',r=>{if(!r.url().startsWith(`http://127.0.0.1:${process.env.JETLEV_TEST_PORT||4173}/`))external.push(r.url());});
 await page.goto('./');await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 const session=await context.newCDPSession(page);
 expect((await session.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);
 const manifest=await page.evaluate(async()=>fetch('manifest.webmanifest').then(r=>r.json()));
 expect(manifest.start_url).toBe('./');expect(manifest.orientation).toBe('portrait-primary');
 await context.setOffline(true);await page.reload();await page.locator('#start').tap();
 await expect(page.locator('#hud')).toBeVisible();
 await page.locator('#pause').tap();await expect(page.locator('#pause-screen')).toBeVisible();
 await page.locator('#quit').tap();await page.locator('#restart').tap();
 await expect(page.locator('#hud')).toBeVisible();
 expect(external).toEqual([]);expect(errors).toEqual([]);
});
for(const viewport of [{width:320,height:480},{width:430,height:932}]){
 test(`portrait controls fit ${viewport.width}x${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);await page.goto('./');
  for(const id of ['start','sound']){
   const box=await page.locator('#'+id).boundingBox();
   expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
   expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('#start').tap();await page.locator('#pause').tap();await page.locator('#quit').tap();
  for(const id of ['restart','home']){const box=await page.locator('#'+id).boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);}
 });
}
