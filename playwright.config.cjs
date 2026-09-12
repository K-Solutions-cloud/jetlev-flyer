const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir:'./tests/e2e', fullyParallel:false, workers:1, retries:process.env.CI?1:0,
  reporter:process.env.CI?'github':'list', timeout:30000,
  use:{baseURL:'http://127.0.0.1:4173/jetlev-flyer/',viewport:{width:390,height:844},isMobile:true,hasTouch:true,trace:'retain-on-failure'},
  webServer:{command:'npm run preview',url:'http://127.0.0.1:4173/jetlev-flyer/',reuseExistingServer:!process.env.CI}
});
