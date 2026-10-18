import test from 'node:test';
import assert from 'node:assert/strict';
import {Race} from '../src/model.js';
test('third smoke stops the car for repair; pause freezes repair and repair resets the count',()=>{
 const r=new Race();r.countdown=0;
 for(let i=1;i<=3;i++){r.hitCooldown=0;r.speed=40;r.impact(.5);assert.equal(r.smokeCount,i);if(i<3)assert.equal(r.engineRepairTime,0)}
 assert.equal(r.speed,0);assert.equal(r.engineRepairTime,6);
 const pos=r.pos;r.impact(.9);assert.equal(r.impactSerial,3);
 r.step(1,{gas:true,steer:1});assert.equal(r.pos,pos);assert.equal(r.speed,0);assert.equal(r.engineRepairTime,5);assert.ok(r.bots[0].pos>10);
 r.status='paused';r.step(2);assert.equal(r.engineRepairTime,5);r.status='running';
 r.step(5,{gas:true});assert.equal(r.smokeCount,0);assert.equal(r.engineRepairTime,0);assert.equal(r.engineRepairs,1);assert.equal(r.damage,0);
 r.step(.1,{gas:true});assert.ok(r.speed>0);
 r.hitCooldown=0;r.impact(.4);assert.equal(r.smokeCount,1);assert.equal(r.engineRepairTime,0);
});
test('third severe impact starts upright repair instead of leaving the car rolling',()=>{
 const r=new Race();r.smokeCount=2;r.impact(.95);assert.equal(r.engineRepairTime,6);assert.equal(r.recovery,0);assert.equal(r.roll,0);
});
