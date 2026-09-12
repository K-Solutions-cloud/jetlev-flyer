import './level.js';
import './effects.js';
import './progression.js';
import './theme.js';
import './career.js';
import { preparePwa } from './pwa.js';
preparePwa().then(async reloading=>{
 if(reloading)return;
 await import('./game.js');
 document.getElementById('start').disabled=false;
});
