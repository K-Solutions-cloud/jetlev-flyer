const {test,expect}=require('@playwright/test');
test('island choice and purchased Jetlev kit persist across reload and offline start',async({page,context})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  if(!localStorage.getItem('career-test-seeded')){
   localStorage.setItem('jetlev-career-v1',JSON.stringify({version:1,bank:120,selectedIsland:'lagoon',equipped:'classic',owned:['classic'],islands:{lagoon:{distance:600,coins:60,perfects:3,runs:3}},runIds:[]}));
   localStorage.setItem('career-test-seeded','1');
  }
 });
 await page.goto('./');await expect(page.locator('#start')).toBeEnabled();
 await page.locator('[data-career="garage"]').tap();
 await expect(page.locator('.career-dialog')).toBeVisible();
 await expect(page.locator('[data-buy="aqua"]')).toBeDisabled();
 await page.locator('[data-buy="coral"]').tap();
 await expect(page.locator('.career-wallet span')).toHaveText('20');
 await page.locator('[data-equip="coral"]').tap();
 await expect(page.locator('[data-equip="coral"]')).toHaveText('AKTIV ✓');
 await page.locator('[data-tab="islands"]').tap();
 await page.locator('[data-island="harbor"]').tap();
 await expect(page.locator('[data-island="sunset"]')).toBeDisabled();
 await page.locator('.career-close').tap();
 await page.reload();await expect(page.locator('#start')).toBeEnabled();
 await expect(page.locator('#home-island')).toContainText('PALMENHAFEN');
 await page.locator('[data-career="garage"]').tap();
 await expect(page.locator('[data-equip="coral"]')).toBeDisabled();
 expect(await page.locator('.career-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.locator('.career-close').tap();
 await context.setOffline(true);await page.reload();await page.locator('#start').tap();
 await expect(page.locator('#hud')).toBeVisible();
 await page.locator('#pause').tap();await page.locator('#quit').tap();
 await expect(page.locator('.career-result')).toBeVisible();
 expect(errors).toEqual([]);
});
