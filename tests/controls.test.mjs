import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {KeyboardControls} from '../src/controls.js';
import {TEAMS} from '../src/data.js';
test('physical WASD keys, arrows, release and simultaneous inputs',()=>{const k=new KeyboardControls();k.keydown('KeyW');k.keydown('KeyA');assert.deepEqual(k.read(),{gas:true,brake:false,steer:-1});k.keyup('KeyW');assert.equal(k.read().gas,false);k.keyup('KeyA');k.keydown('ArrowUp');k.keydown('ArrowRight');assert.deepEqual(k.read(),{gas:true,brake:false,steer:1});k.keydown('ArrowLeft');assert.equal(k.read().steer,0);k.clear();assert.deepEqual(k.read(),{gas:false,brake:false,steer:0})});
test('space brake overrides gas and key aliases remain held independently',()=>{const k=new KeyboardControls();k.keydown('KeyW');k.keydown('ArrowUp');k.keyup('KeyW');assert(k.read().gas);k.keydown('Space');assert(!k.read().gas&&k.read().brake);k.keyup('Space');assert(k.read().gas);k.clear();assert(!k.read().gas);assert(!k.keydown('KeyQ'))});
test('all 22 official portraits exist, differ, and have source records',()=>{const sources=JSON.parse(readFileSync(new URL('../assets/sources.json',import.meta.url)));const hashes=new Set();for(const team of TEAMS)for(const d of team.drivers){const path=new URL('../'+d.photo,import.meta.url);assert(existsSync(path));const bytes=readFileSync(path);assert(bytes.length>10000);hashes.add(createHash('sha256').update(bytes).digest('hex'));assert(sources.some(s=>s.file===d.photo))}assert.equal(hashes.size,22)});
