import './level.js';
import './effects.js';
import { preparePwa } from './pwa.js';
preparePwa().then(async reloading=>{
 if(reloading)return;
 await import('./game.js');
 document.getElementById('start').disabled=false;
});
