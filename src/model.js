import {CatmullRomCurve3,Vector3} from 'three';
import {TEAMS,CIRCUITS} from './data.js';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const mod=(v,n)=>((v%n)+n)%n;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const format=t=>!Number.isFinite(t)?'—':`${Math.floor(t/60)}:${(t%60).toFixed(2).padStart(5,'0')}`;
export function makeTrack(config){
 const raw=new CatmullRomCurve3(config.points.map(([x,z])=>new Vector3(x,0,z)),true,'centripetal');
 raw.arcLengthDivisions=3000;
 const scale=config.length/raw.getLength();
 const curve=new CatmullRomCurve3(config.points.map(([x,z])=>new Vector3(x*scale,0,z*scale)),true,'centripetal');curve.arcLengthDivisions=4000;
 const length=curve.getLength(),count=Math.ceil(length/3),points=curve.getSpacedPoints(count).slice(0,-1);
 const frames=points.map((p,i)=>{const before=points[mod(i-1,count)],after=points[(i+1)%count];const tangent=after.clone().sub(before).normalize();return {p,tangent,right:new Vector3(-tangent.z,0,tangent.x),heading:Math.atan2(tangent.x,-tangent.z)}});
 const step=length/count;
 frames.forEach((f,i)=>{let delta=frames[(i+1)%count].heading-frames[mod(i-1,count)].heading;delta=Math.atan2(Math.sin(delta),Math.cos(delta));f.curvature=delta/(2*step)});
 const sample=s=>{const n=mod(s,length)/step,i=Math.floor(n),t=n-i,a=frames[i],b=frames[(i+1)%count];const tangent=a.tangent.clone().lerp(b.tangent,t).normalize();const p=a.p.clone().lerp(b.p,t);if(config.theme==='sakura')p.y=3+2.8*Math.sin(s/length*Math.PI*4);return {p,tangent,right:new Vector3(-tangent.z,0,tangent.x),curvature:lerp(a.curvature,b.curvature,t)}};
 return {config,length,frames,step,sample};
}
export function performanceFor(t,d){return {max:(250+t.stats.speed*.84+d.stats.pace*.07)/3.6,accel:10+t.stats.accel*.08+d.stats.pace*.016,brake:16+t.stats.brake*.13,grip:.78+t.stats.corner*.006+d.stats.control*.003,wetSkill:d.stats.wet/100,tyreSkill:d.stats.tyre/100}}
export function tyreGrip(wet,tyre,skill){return tyre==='wet'?lerp(.84,.89+skill*.15,wet):lerp(1,.53+skill*.12,wet)}
export function cornerLimit(curvature,grip){return Math.min(100,Math.sqrt(11.8*grip/Math.max(.001,Math.abs(curvature))))}
export function weatherAt(mode,time,seed=0){if(mode==='rain')return 1;if(mode==='clear')return 0;const start=18+seed*10,phase=mod(time-start,94);if(time<start)return 0;if(phase<12)return phase/12;if(phase<43)return 1;if(phase<68)return 1-(phase-43)/25;return 0}
export class Race {
 constructor({team=0,driver=0,circuit=0,mode='race',weather='dynamic',tyre='slick',seed=.4}={}){
  this.options={team,driver,circuit,mode,weather,tyre,seed};this.track=makeTrack(CIRCUITS[circuit]);this.perf=performanceFor(TEAMS[team],TEAMS[team].drivers[driver]);
  this.pos=0;this.x=0;this.speed=0;this.elapsed=0;this.lapStart=0;this.best=Infinity;this.laps=[];this.countdown=3;this.status='running';this.wet=weatherAt(weather,0,seed);this.tyre=tyre;this.wear=0;this.damage=0;this.fuel=100;this.steer=0;this.skid=0;this.hitCooldown=0;this.roll=0;this.recovery=0;this.recoveryDuration=2.4;this.pitRequested=false;this.pitTime=0;this.pitCount=0;this.message='';this.messageTimer=0;this.lastImpact=0;this.impactSerial=0;this.smokeCount=0;this.engineRepairTime=0;this.engineRepairDuration=6;this.engineRepairs=0;this.draft=false;
  this.bots=mode==='race'?Array.from({length:7},(_,i)=>{const ti=(team+i+1)%TEAMS.length,di=i%2;return {id:i+1,team:ti,driver:di,pos:10+i*10,x:(i%2?1:-1)*2.4,speed:0,perf:performanceFor(TEAMS[ti],TEAMS[ti].drivers[di]),finish:null}}):[];
 }
 get lap(){return Math.min(2,Math.floor(this.pos/this.track.length)+1)}
 get rank(){return 1+this.bots.filter(b=>b.finish!==null||b.pos>this.pos).length}
 get grip(){return this.perf.grip*tyreGrip(this.wet,this.tyre,this.perf.wetSkill)*(1-this.wear*.003)}
 get gear(){return this.speed<.5?'N':Math.min(8,1+Math.floor(this.speed*3.6/43))}
 tell(s,t=3){this.message=s;this.messageTimer=t}
 requestPit(){if(this.status!=='running')return;this.pitRequested=!this.pitRequested;this.tell(this.pitRequested?'피트 예약 · 출발선에서 자동으로 정차해요':'피트 예약 취소')}
 impact(severity,side=1){if(this.hitCooldown>0||this.recovery>0||this.engineRepairTime>0)return;this.lastImpact=severity;this.impactSerial++;this.smokeCount++;this.hitCooldown=1.2;this.damage=clamp(this.damage+severity*18,0,75);this.speed*=severity>.82?.2:.55;this.x=clamp(this.x-side*.75,-this.track.config.width/2+1,this.track.config.width/2-1);if(this.smokeCount>=3){this.engineRepairTime=this.engineRepairDuration;this.speed=0;this.steer=0;this.skid=0;this.roll=0;this.recovery=0;this.draft=false;this.tell('엔진 과열! 메카닉이 와서 수리해요',6);return}if(severity>.82){this.recovery=this.recoveryDuration;this.rollDirection=side;this.tell('차가 뒤집혔어요! 곧 트랙으로 돌아와요',3)}else this.tell('충돌! 속도를 줄이고 다시 달려요',2)}
 updateBots(dt){for(const b of this.bots){if(b.finish!==null)continue;const f=this.track.sample(b.pos+25),g=b.perf.grip*lerp(1,.62+b.perf.wetSkill*.13,this.wet);const target=Math.min(b.perf.max*.88,cornerLimit(f.curvature,g)*.95);b.speed=clamp(b.speed+clamp(target-b.speed,-b.perf.brake,b.perf.accel*.85)*dt,0,b.perf.max);const previous=b.pos;b.pos+=b.speed*dt;
   const gap=this.pos-b.pos;if(gap>0&&gap<25)b.x=lerp(b.x,this.x>0?-2.7:2.7,dt*.7);b.x=clamp(b.x,-this.track.config.width*.28,this.track.config.width*.28);
   if(b.pos>=this.track.length*2){b.finish=this.elapsed-dt+dt*(this.track.length*2-previous)/(b.pos-previous);b.pos=this.track.length*2}
  }}
 step(dt,input={}){
  if(this.status!=='running')return;
  if(this.countdown>0){this.countdown=Math.max(0,this.countdown-dt);return}
  this.elapsed+=dt;this.messageTimer=Math.max(0,this.messageTimer-dt);this.hitCooldown=Math.max(0,this.hitCooldown-dt);this.wet=weatherAt(this.options.weather,this.elapsed,this.options.seed);this.updateBots(dt);
  if(this.engineRepairTime>0){this.speed=0;this.engineRepairTime=Math.max(0,this.engineRepairTime-dt);if(this.engineRepairTime===0){this.smokeCount=0;this.damage=0;this.engineRepairs++;this.hitCooldown=2;this.tell('엔진 수리 완료! 다시 출발해요')}return}
  if(this.recovery>0){this.recovery=Math.max(0,this.recovery-dt);this.roll=this.rollDirection*Math.PI*2*(1-this.recovery/this.recoveryDuration);this.speed=0;if(this.recovery===0){this.roll=0;this.x=0;this.hitCooldown=2;this.tell('복귀했어요! 다시 출발해요')}return}
  if(this.pitTime>0){this.pitTime=Math.max(0,this.pitTime-dt);this.speed=0;if(this.pitTime===0){this.wear=0;this.damage=0;this.fuel=100;this.tyre=this.wet>.35?'wet':'slick';this.pitCount++;this.tell(`${this.tyre==='wet'?'빗길':'마른 노면'} 타이어로 교체 완료!`)}return}
  if(this.pitRequested&&mod(this.pos,this.track.length)<65&&this.elapsed>8){this.pitRequested=false;this.pitTime=5;this.speed=0;this.tell('피트 작업 중 · 타이어 교체와 수리',5);return}
  const prev=this.pos,f=this.track.sample(this.pos);const steer=clamp(input.steer||0,-1,1);this.steer=lerp(this.steer,steer,Math.min(1,dt*8));
  this.draft=this.bots.some(b=>{const gap=b.pos-this.pos;return gap>5&&gap<45&&Math.abs(b.x-this.x)<1.5});
  const max=this.perf.max*(1-this.damage*.002)*(this.draft?1.04:1)*(this.fuel<=0?.5:1);const brake=input.brake?this.perf.brake*tyreGrip(this.wet,this.tyre,this.perf.wetSkill):0;
  this.speed=clamp(this.speed+(brake?-brake:input.gas?this.perf.accel*(1-.48*this.speed/max):-3.8)*dt,0,max);
  const safe=cornerLimit(f.curvature,this.grip),excess=Math.max(0,this.speed-safe);this.skid=clamp(excess/26,0,1);
  const turnRate=Math.min(1,this.speed/10)*(4.5+this.perf.grip*2.2)*(.2+.8*this.speed/this.perf.max)*(1-this.skid*.4)*tyreGrip(this.wet,this.tyre,this.perf.wetSkill);
  this.x+=this.steer*turnRate*dt-f.curvature*this.speed*this.speed*.045/this.grip*dt;
  this.speed=Math.max(0,this.speed-excess*.7*dt);this.wear=clamp(this.wear+this.speed*.0018*(1.4-this.perf.tyreSkill*.4)*(1+this.skid*2+(this.tyre==='wet'&&this.wet<.2?2:0))*dt,0,100);this.fuel=Math.max(0,this.fuel-this.speed*.004*dt);
  const wall=this.track.config.width/2-1.05;
  if(Math.abs(this.x)>wall){const side=Math.sign(this.x),severity=clamp(this.speed/90*(.55+Math.abs(this.steer)*.6+this.skid*.3),.1,1);this.x=side*wall;this.impact(severity,side);this.speed=Math.max(0,this.speed-10*dt)}
  if(this.recovery>0||this.engineRepairTime>0)return;
  this.pos+=this.speed*dt;
  for(const b of this.bots){const gap=mod(b.pos-this.pos+this.track.length/2,this.track.length)-this.track.length/2;if(Math.abs(gap)<4&&Math.abs(b.x-this.x)<1.9){const severity=clamp(Math.abs(this.speed-b.speed)/65+.25+Math.abs(this.steer)*.18,.15,1);this.impact(severity,this.x>=b.x?-1:1)}}
  if(Math.floor(prev/this.track.length)<Math.floor(this.pos/this.track.length)){
   const boundary=(Math.floor(prev/this.track.length)+1)*this.track.length,crossing=this.elapsed-dt+dt*(boundary-prev)/(this.pos-prev),lap=crossing-this.lapStart;
   this.laps.push(lap);this.best=Math.min(this.best,lap);this.lapStart=crossing;this.tell('마지막 한 바퀴!');
   if(this.pos>=this.track.length*2){this.pos=this.track.length*2;this.elapsed=crossing;this.status='finished';this.finishRank=1+this.bots.filter(b=>b.finish!==null&&b.finish<=crossing).length}
  }
 }
}
