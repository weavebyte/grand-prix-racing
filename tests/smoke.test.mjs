import test from 'node:test';
import assert from 'node:assert/strict';
import {CollisionSmoke} from '../src/smoke.js';
import {Race} from '../src/model.js';
test('smoke is triggered by collisions, freezes on pause, expires and restarts on a new impact',()=>{
 const race=new Race(),smoke=new CollisionSmoke();assert.equal(smoke.update(race,0),false);
 race.impact(.5);assert.equal(smoke.update(race,.1),true);assert.equal(smoke.strength,.5);
 const age=smoke.age;smoke.update(race,0);assert.equal(smoke.age,age);
 race.impact(.9);assert.equal(race.impactSerial,1);
 assert.equal(smoke.update(race,3.2),false);
 race.hitCooldown=0;race.impact(.8);assert.equal(smoke.update(race,.01),true);assert.equal(smoke.strength,.8);
 assert.equal(new CollisionSmoke().update(new Race(),0),false);
});
