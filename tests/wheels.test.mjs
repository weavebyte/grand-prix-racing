import test from 'node:test';
import assert from 'node:assert/strict';
import {wheelAngle} from '../src/details.js';
test('rolling wheels cover the travelled distance and stop when stationary',()=>{
 const r=.3,angle=wheelAngle(0,3,.1,r);
 assert.ok(Math.abs(angle-1)<1e-10);
 assert.equal(wheelAngle(angle,0,2,r),angle);
 assert.ok(Math.abs(wheelAngle(0,3,.2,r)-2*angle)<1e-10);
 assert.ok(Math.abs(wheelAngle(0,2*Math.PI*r,1,r))<1e-10);
});
