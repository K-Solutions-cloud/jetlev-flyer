import './flight.js';
import './level.js';
import './heaven.js';
import './bonus.js';
import './effects.js';
import './music.js';
import './water.js';
import './director.js';
import './progression.js';
import './theme.js';
import './career.js';
import { preparePwa } from './pwa.js';
preparePwa().then(async reloading=>{
 if(reloading)return;
 await import('./game.js');
 document.getElementById('start').disabled=false;
});
