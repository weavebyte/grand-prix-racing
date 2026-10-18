// One burst per real impact; recovery invulnerability does not create a burst.
export class CollisionSmoke {
 constructor(){this.serial=0;this.age=10;this.strength=0}
 update(race,dt){
  if(race.impactSerial!==this.serial){this.serial=race.impactSerial;this.age=0;this.strength=race.lastImpact}
  this.age+=Math.max(0,dt);
  return this.age<3.2;
 }
}
