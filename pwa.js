// Before the game starts, activate the newest successfully downloaded release.
function timeout(promise, ms=10000){
 let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Update timeout')),ms);})]).finally(()=>clearTimeout(timer));
}
function settled(registration){
 return new Promise((resolve,reject)=>{
  function inspect(){
   const worker=registration.installing||registration.waiting||registration.active;
   if(!worker)return reject(new Error('No worker'));
   if(worker.state==='activated')return resolve(worker);
   if(worker.state==='redundant')return reject(new Error('Update failed'));
   if(worker.state==='installed')worker.postMessage({type:'ACTIVATE'});
   worker.addEventListener('statechange',inspect,{once:true});
  }
  inspect();
 });
}
function releaseOf(worker){
 return timeout(new Promise(resolve=>{
  const channel=new MessageChannel();
  channel.port1.onmessage=event=>{channel.port1.close();resolve(event.data.version);};
  worker.postMessage({type:'VERSION'},[channel.port2]);
 }),1500);
}
export async function preparePwa(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return false;
 const status=document.getElementById('boot-status');
 try{
  if(status){status.hidden=false;status.textContent='UPDATE-CHECK …';}
  const registration=await timeout(navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}));
  await timeout(registration.update());
  const worker=await timeout(settled(registration));
  const version=await releaseOf(worker);
  const current=document.querySelector('meta[name="app-version"]')?.content;
  if(current&&version!==current){
   // The worker's atomically cached index is known to match its asset set.
   const target=new URL(location.href);target.searchParams.set('_release',version);
   location.replace(target.href);return true;
  }
  if(status)status.hidden=true;
  if(new URL(location.href).searchParams.has('_release')){
   const clean=new URL(location.href);clean.searchParams.delete('_release');history.replaceState(null,'',clean);
  }
 }catch{
  if(status){status.textContent='UPDATE NICHT ERREICHBAR · GESPEICHERTE VERSION';setTimeout(()=>status.hidden=true,4500);}
 }
 return false;
}
