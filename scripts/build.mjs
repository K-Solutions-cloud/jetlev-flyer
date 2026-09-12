import { build } from 'esbuild';
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const out = 'dist';
// dist is an exclusively generated output directory.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const result = await build({
  define: { __JETLEV_PRODUCTION__: 'true' },
  entryPoints: ['main.js','style.css'], bundle: true, minify: true,
  outdir: out, entryNames: 'assets/[name]-[hash]', assetNames: 'assets/[name]-[hash]',
  loader: { '.ttf':'file', '.woff2':'file' },
  target: ['safari15','chrome100','firefox100'], format:'iife', metafile:true,
  legalComments:'none', charset:'utf8'
});
const outputs = Object.entries(result.metafile.outputs);
const bundle = outputs.find(([,meta])=>meta.entryPoint==='main.js')[0].slice(out.length+1);
const css = outputs.find(([,meta])=>meta.entryPoint==='style.css')[0].slice(out.length+1);
await cp('assets/audio',out+'/assets/audio',{recursive:true});
await cp('assets/icons',out+'/assets/icons',{recursive:true});
await cp('assets/jetlev-flyer-logo.jpg',out+'/assets/jetlev-flyer-logo.jpg');
await cp('manifest.webmanifest',out+'/manifest.webmanifest');
for (const name of (await readdir('assets/fonts')).filter(n=>n.endsWith('.txt'))) {
  await cp('assets/fonts/'+name,out+'/assets/'+name);
}
let html = await readFile('index.html','utf8');
html = html.replace('href="style.css"',`href="${css}"`)
  .replace('id="start"','id="start" disabled')
  .replace(/<script src="(?:level|effects|music|water|director|progression|theme|career|game|pwa)\.js"><\/script>/g,'')
  .replace('</body>',`<script src="${bundle}" defer></script></body>`);
await writeFile(out+'/index.html',html);
async function walk(dir) {
  const entries = await readdir(dir,{withFileTypes:true});
  return (await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat().sort();
}
const files = await walk(out);
const buffers = await Promise.all(files.map(f=>readFile(f)));
const template = await readFile('sw.js','utf8');
const version = createHash('sha256').update(template).update(Buffer.concat(buffers)).digest('hex').slice(0,16);
const sw = template.replace("const VERSION = 'development';",`const VERSION = '${version}';`)
  .replace(/const FILES = .*?;/,`const FILES = ${JSON.stringify(['./',...files.map(f=>f.slice(out.length+1))])};`);
await writeFile(out+'/index.html',html.replace('</head>',`<meta name="app-version" content="${version}"></head>`));
await writeFile(out+'/sw.js',sw);
await writeFile(out+'/.nojekyll','');
const jsBytes = gzipSync(await readFile(out+'/'+bundle)).length;
const totalBytes = buffers.reduce((n,b)=>n+b.length,0)+Buffer.byteLength(sw);
if(jsBytes>35000)throw new Error(`JS budget exceeded: ${jsBytes} gzip bytes (limit 35000)`);
if(totalBytes>1500000)throw new Error(`Offline download budget exceeded: ${totalBytes} bytes`);
console.log(`Build ${version}: JS ${(jsBytes/1024).toFixed(1)} KiB gzip, complete offline app ${(totalBytes/1024).toFixed(1)} KiB.`);
