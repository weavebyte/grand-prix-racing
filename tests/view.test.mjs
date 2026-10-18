import {TEAMS} from '../src/data.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import * as THREE from 'three';
// Import the rendering module without opening a browser or starting WebGL.
const result=await build({entryPoints:[fileURLToPath(new URL('../src/view.js',import.meta.url))],bundle:true,write:false,format:'esm',loader:{'.hdr':'binary','.jpg':'dataurl','.png':'dataurl','.webp':'dataurl','.svg':'dataurl'}});
const {WorldView}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
test('opponent cars can be built with four rolling wheels before a race starts',()=>{
 const view=Object.create(WorldView.prototype);
 view.sphere=new THREE.SphereGeometry(.5,8,6);view.cylinder=new THREE.CylinderGeometry(.5,.5,1,8);view.rounded=new THREE.BoxGeometry(1,1,1);view.materials=new Map();view.rubberMaterial=new THREE.MeshStandardMaterial();
 const car=view.makeCar('#ff6600');assert.equal(car.isGroup,true);assert.equal(car.userData.tyres.length,4);
 view.animateTyres(car,10,.1,.5);
 for(const tyre of car.userData.tyres){assert.ok(tyre.userData.spin.rotation.x>0);assert.equal(tyre.rotation.y,tyre.userData.front?-.11:0)}
 car.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose()});
});
test('every team gets visible logo and sponsor surfaces on cockpit and opponent cars',()=>{
 const view=Object.create(WorldView.prototype);view.rounded=new THREE.BoxGeometry(1,1,1);view.materials=new Map();view.brandMaterial=()=>new THREE.MeshBasicMaterial();
 for(let team=0;team<11;team++)for(const cockpit of [true,false]){
  const g=new THREE.Group();view.brandCar(g,team,cockpit);
  const labels=g.children.filter(o=>o.userData.branding);
  assert.equal(labels.length,cockpit?4:7);
  assert.ok(labels.some(o=>o.userData.branding==='logo'));
  assert.ok(labels.some(o=>o.userData.branding==='sponsor'));
  for(const label of labels){assert.ok(label.position.toArray().every(Number.isFinite));label.geometry.dispose();label.material.dispose()}
 }
});
test('pit mechanics appear during service, move their tools, and leave after service',()=>{
 const view=Object.create(WorldView.prototype);view.cockpit=new THREE.Group();view.sphere=new THREE.SphereGeometry(.5,8,6);view.cylinder=new THREE.CylinderGeometry(.5,.5,1,8);view.rounded=new THREE.BoxGeometry(1,1,1);view.materials=new Map();view.rubberMaterial=new THREE.MeshStandardMaterial();
 view.mechanicMaterialFor=id=>{assert.equal(id,'ferrari');return new THREE.MeshBasicMaterial()};
 view.buildMechanics('#e94343','ferrari');assert.equal(view.mechanics.length,2);
 view.pitCrew.traverse(o=>{if(o.userData.photographicMechanic)assert.equal(o.userData.team,'ferrari')});
 view.updateMechanics({pitTime:0});assert.equal(view.pitCrew.visible,false);
 view.updateMechanics({pitTime:4.8});assert.equal(view.pitCrew.visible,true);const outside=view.mechanics[0].worker.position.x;
 assert.equal(view.pitCrew.userData.phase,'arriving');const crew=view.mechanics[0];assert.equal(crew.runner.visible,true);assert.equal(crew.arm.visible,false);
 const arrivingDirection=Math.sign(crew.runner.scale.x),runFrame=crew.runner.userData.frame;assert.equal(crew.runner.userData.photographicRunner,true);
 view.updateMechanics({pitTime:4.7});assert.notEqual(crew.runner.userData.frame,runFrame);
 const pausedPose=crew.runner.position.y;view.updateMechanics({pitTime:4.7,status:'paused'});assert.equal(crew.runner.position.y,pausedPose);
 view.updateMechanics({pitTime:3});assert.ok(Math.abs(view.mechanics[0].worker.position.x)<Math.abs(outside));assert.notEqual(view.mechanics[0].arm.rotation.z,0);
 assert.equal(view.pitCrew.userData.phase,'repairing');assert.equal(crew.runner.visible,false);assert.equal(crew.arm.visible,true);
 view.updateMechanics({pitTime:.6});assert.equal(view.pitCrew.userData.phase,'leaving');assert.equal(crew.runner.visible,true);assert.equal(crew.arm.visible,false);assert.equal(Math.sign(crew.runner.scale.x),-arrivingDirection);
 const leavingX=Math.abs(crew.worker.position.x);view.updateMechanics({pitTime:.1});assert.ok(Math.abs(crew.worker.position.x)>leavingX);
 view.updateMechanics({pitTime:0});assert.equal(view.pitCrew.visible,false);
 view.updateMechanics({pitTime:0,engineRepairTime:5.8,engineRepairDuration:6});assert.equal(view.pitCrew.userData.phase,'arriving');
 view.updateMechanics({pitTime:0,engineRepairTime:4,engineRepairDuration:6});assert.equal(view.pitCrew.visible,true);assert.equal(view.mechanics[0].spare.visible,false);assert.equal(view.mechanics[0].worker.position.z,-2.35);
 view.updateMechanics({pitTime:0,engineRepairTime:.4,engineRepairDuration:6});assert.equal(view.pitCrew.userData.phase,'leaving');assert.equal(crew.spare.visible,false);
 view.updateMechanics({pitTime:0,engineRepairTime:0});assert.equal(view.pitCrew.visible,false);
});

test('all eleven teams have distinct uniforms and both mechanics wear the selected team uniform',()=>{
 const hashes=new Set();
 const view=Object.create(WorldView.prototype);view.cockpit=new THREE.Group();view.sphere=new THREE.SphereGeometry(.5,8,6);view.cylinder=new THREE.CylinderGeometry(.5,.5,1,8);view.rounded=new THREE.BoxGeometry(1,1,1);view.materials=new Map();view.rubberMaterial=new THREE.MeshStandardMaterial();
 for(const team of TEAMS){
  const bytes=readFileSync(new URL(`../assets/people/mechanics/${team.id}.png`,import.meta.url));
  assert.equal(bytes.subarray(1,4).toString(),'PNG');hashes.add(createHash('sha256').update(bytes).digest('hex'));
  const material=new THREE.MeshBasicMaterial(),runMaterial=new THREE.MeshBasicMaterial();view.mechanicMaterialFor=(id,running)=>{assert.equal(id,team.id);return running?runMaterial:material};
  const runBytes=readFileSync(new URL(`../assets/people/mechanics/${team.id}-run.png`,import.meta.url));assert.equal(runBytes.subarray(1,4).toString(),'PNG');assert.notDeepEqual(runBytes,bytes);
  view.buildMechanics(team.color,team.id);let people=0;
  view.pitCrew.traverse(o=>{if(o.userData.photographicMechanic){people++;assert.equal(o.userData.team,team.id);assert.equal(o.material,material)}});
  assert.equal(people,2);
  for(const {runner} of view.mechanics){
   assert.equal(runner.isMesh,true);assert.equal(runner.material,runMaterial);assert.equal(runner.userData.photographicRunner,true);assert.equal(runner.userData.team,team.id);
   const cells=new Set();for(let frame=0;frame<4;frame++){view.setMechanicRunFrame(runner,frame);const uv=runner.geometry.attributes.uv;cells.add(`${uv.getX(0)},${uv.getY(0)}`);for(const value of uv.array)assert.ok(value>=0&&value<=1)}assert.equal(cells.size,4);
  }
  view.cockpit.remove(view.pitCrew);
 }
 assert.equal(hashes.size,TEAMS.length);
});
