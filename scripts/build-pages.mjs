import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {mkdir,copyFile,cp,writeFile,rm,readFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'docs');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await build({absWorkingDir:root,entryPoints:['src/main.js'],bundle:true,format:'iife',target:'es2020',minify:true,legalComments:'eof',outfile:'docs/game.js',assetNames:'assets/[name]-[hash]',loader:{'.hdr':'binary','.jpg':'file','.png':'file','.webp':'file','.svg':'file'}});
const code=await readFile(path.join(out,'game.js'));const bundle='game-'+createHash('sha256').update(code).digest('hex').slice(0,12)+'.js';
await rename(path.join(out,'game.js'),path.join(out,bundle));
const css=await readFile(path.join(root,'style.css'));const stylesheet='style-'+createHash('sha256').update(css).digest('hex').slice(0,12)+'.css';
await writeFile(path.join(out,stylesheet),css);
await writeFile(path.join(out,'index.html'),(await readFile(path.join(root,'index.html'),'utf8')).replace('src="game.js"','src="'+bundle+'"').replace('href="style.css"','href="'+stylesheet+'"'));

for(const dir of ['drivers','circuits'])await cp(path.join(root,'assets',dir),path.join(out,'assets',dir),{recursive:true});
await writeFile(path.join(out,'.nojekyll'),'');
console.log('GitHub Pages build ready in docs/');
