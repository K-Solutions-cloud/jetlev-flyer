# Requires Python Playwright and its Chromium browser. Start the local HTTP server first.
import os,json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox'])
 for width,height in [(320,480),(360,640),(390,844),(430,932),(768,1024)]:
  page=b.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(os.environ.get('JETLEV_TEST_URL','http://127.0.0.1:8080'));page.wait_for_timeout(500)
  for selector in ['#start','#sound']:
   box=page.locator(selector).bounding_box();assert box['y']>=0 and box['y']+box['height']<=height,(width,selector,box)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  page.screenshot(path=f'/tmp/mobile-{width}.png')
  page.locator('#start').tap();page.wait_for_timeout(100)
  # Real CDP touch events, two fingers with independent release.
  cdp=page.context.new_cdp_session(page)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':width*.5,'y':height*.65,'id':1}]})
  page.wait_for_timeout(150)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':width*.5,'y':height*.65,'id':1},{'x':width*.7,'y':height*.7,'id':2}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[{'x':width*.5,'y':height*.65,'id':1}]})
  page.wait_for_timeout(100);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  page.locator('#pause').tap();assert page.locator('#pause-screen').is_visible()
  page.locator('#quit').tap();page.wait_for_timeout(250)
  for selector in ['#restart','#home']:
   box=page.locator(selector).bounding_box();assert box['y']>=0 and box['y']+box['height']<=height,(width,selector,box)
  page.screenshot(path=f'/tmp/mobile-result-{width}.png')
  page.locator('#restart').tap();page.set_viewport_size({'width':height,'height':width});page.wait_for_timeout(250);assert page.locator('#pause-screen').is_visible(),'rotation pauses'
  page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(200);page.locator('#resume').tap()
  assert not errors,errors
  print(width,height,'PASS touch, menus, rotation, no errors',flush=True);page.close()
 b.close()
