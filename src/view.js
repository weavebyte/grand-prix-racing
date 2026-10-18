import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import skyBytes from '../assets/environment/sky.hdr';
import asphaltURL from '../assets/environment/asphalt.jpg';
import {MECHANIC_UNIFORMS} from './mechanic-uniforms.js';
import {MECHANIC_RUNS} from './mechanic-runs.js';
import handURL from '../assets/people/bare-hand.png';
import crowdURL from '../assets/people/spectators.png';
import {TEAM_LOGOS,SPONSORS,SPONSOR_LOGOS} from './branding.js';
import {CollisionSmoke} from './smoke.js';
import {TEAMS} from './data.js';
import {clamp,mod} from './model.js';
import {wheelAngle,surfaceTexture} from './details.js';
const V=THREE.Vector3;
export class WorldView{
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(76,1,.055,1500);this.scene.add(this.camera);this.camera.rotation.order='YXZ';this.geometry=new THREE.BoxGeometry(1,1,1);this.rounded=new RoundedBoxGeometry(1,1,1,3,.12);this.sphere=new THREE.SphereGeometry(.5,16,12);this.cylinder=new THREE.CylinderGeometry(.5,.5,1,16);this.cone=new THREE.ConeGeometry(.5,1,24);this.materials=new Map();this.brandMaterials=new Map();
  const hdr=new HDRLoader().parse(skyBytes.buffer);this.sky=new THREE.DataTexture(hdr.data,hdr.width,hdr.height,THREE.RGBAFormat,hdr.type);this.sky.mapping=THREE.EquirectangularReflectionMapping;this.sky.flipY=true;this.sky.colorSpace=THREE.LinearSRGBColorSpace;this.sky.minFilter=THREE.LinearFilter;this.sky.magFilter=THREE.LinearFilter;this.sky.needsUpdate=true;this.scene.environment=this.sky;this.scene.environmentIntensity=.35;
  this.asphalt=new THREE.TextureLoader().load(asphaltURL);this.asphalt.colorSpace=THREE.SRGBColorSpace;this.asphalt.wrapS=this.asphalt.wrapT=THREE.RepeatWrapping;this.asphalt.anisotropy=this.renderer.capabilities.getMaxAnisotropy();
  const pixels=new Uint8Array(128*128*4);for(let i=0;i<128*128;i++){const v=208+((i*47+i*i*7)%40);pixels.set([v,v,v,255],i*4)}this.texture=new THREE.DataTexture(pixels,128,128);this.texture.magFilter=THREE.LinearFilter;this.texture.minFilter=THREE.LinearMipmapLinearFilter;this.texture.generateMipmaps=true;this.texture.wrapS=this.texture.wrapT=THREE.RepeatWrapping;this.texture.needsUpdate=true;
  this.light=new THREE.HemisphereLight(0xffffff,0x58754a,2.1);this.scene.add(this.light);this.sun=new THREE.DirectionalLight(0xfff0d6,2.4);this.sun.position.set(-150,300,-200);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-75,right:75,top:75,bottom:-75,near:1,far:220});this.sun.shadow.bias=-.0005;this.sun.shadow.normalBias=.05;this.scene.add(this.sun,this.sun.target);
  this.environment=new THREE.Group();this.scene.add(this.environment);this.cars=new THREE.Group();this.scene.add(this.cars);this.cockpit=new THREE.Group();this.camera.add(this.cockpit);
  this.rain=new THREE.Group();this.camera.add(this.rain);const p=[];for(let i=0;i<330;i++){const x=(Math.random()-.5)*35,y=Math.random()*24-9,z=-Math.random()*40-2;p.push(x,y,z,x-.08,y-.6,z)}
  this.rainGeo=new THREE.BufferGeometry();this.rainGeo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));this.rainLines=new THREE.LineSegments(this.rainGeo,new THREE.LineBasicMaterial({color:0xc4deed,transparent:true,opacity:.5}));this.rain.add(this.rainLines);
  const smokeCanvas=document.createElement('canvas');smokeCanvas.width=128;smokeCanvas.height=128;const smokeCtx=smokeCanvas.getContext('2d');const smokeGradient=smokeCtx.createRadialGradient(64,64,0,64,64,64);smokeGradient.addColorStop(0,'rgba(155,160,164,.8)');smokeGradient.addColorStop(.35,'rgba(126,132,138,.55)');smokeGradient.addColorStop(1,'rgba(120,126,132,0)');smokeCtx.fillStyle=smokeGradient;smokeCtx.fillRect(0,0,128,128);this.smokeTexture=new THREE.CanvasTexture(smokeCanvas);this.smokeTexture.colorSpace=THREE.SRGBColorSpace;
  this.facade=surfaceTexture('facade');this.facade.anisotropy=8;
  this.cloth=surfaceTexture('cloth');this.rubber=surfaceTexture('rubber');this.grass=surfaceTexture('cloth');this.grass.repeat.set(170,170);
  this.mechanicMaterials=new Map();
  this.handTexture=new THREE.TextureLoader().load(handURL);this.handTexture.colorSpace=THREE.SRGBColorSpace;
  this.crowdTexture=new THREE.TextureLoader().load(crowdURL);this.crowdTexture.colorSpace=THREE.SRGBColorSpace;this.crowdTexture.anisotropy=8;
  this.handMaterial=new THREE.MeshBasicMaterial({map:this.handTexture,transparent:true,alphaTest:.35,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  this.crowdMaterial=new THREE.MeshStandardMaterial({map:this.crowdTexture,transparent:false,alphaTest:.6,side:THREE.DoubleSide,roughness:1});
  this.rubberMaterial=new THREE.MeshStandardMaterial({color:0xcccccc,map:this.rubber,bumpMap:this.rubber,bumpScale:.002,roughness:.95});
  this.resize();
 }
 material(color){if(!this.materials.has(color))this.materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.12}));return this.materials.get(color)}
 cube(parent,x,y,z,w,h,d,color,rot=0){const m=new THREE.Mesh(this.rounded,this.material(color));m.castShadow=true;m.receiveShadow=true;m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.y=rot;parent.add(m);return m}
 shape(parent,geometry,x,y,z,w,h,d,color){const m=new THREE.Mesh(geometry,this.material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 tube(parent,points,r,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new V(...p)));const geo=new THREE.TubeGeometry(curve,32,r,10,false);const mesh=new THREE.Mesh(geo,this.material(color));mesh.userData.ownedGeometry=true;mesh.castShadow=true;parent.add(mesh);return mesh}
 load(track,team,driver,bots=[]){
  this.track=track;this.config=track.config;this.baseSky=new THREE.Color(this.config.sky);this.scene.background=this.sky;this.scene.fog=new THREE.Fog(this.config.sky,150,680);
  for(const o of [...this.environment.children]){this.environment.remove(o);o.traverse(c=>{if(c.userData.ownedGeometry)c.geometry.dispose();if(c.userData.ownedMap)c.material.map.dispose();if(c.userData.ownedMaterial)c.material.dispose()});if(o.isInstancedMesh)o.dispose()}
  for(const group of [this.cars,this.cockpit]){group.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose()});group.clear()}this.batches=new Map();this.buildingMaterials=[];
  const put=(x,y,z,w,h,d,color,rotation=0,shape='box')=>{const key=color+'|'+shape;if(!this.batches.has(key))this.batches.set(key,{color,shape,items:[]});this.batches.get(key).items.push([x,y,z,w,h,d,rotation])};
  const points=track.frames.map(f=>f.p),minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minZ=Math.min(...points.map(p=>p.z)),maxZ=Math.max(...points.map(p=>p.z));
  this.bounds={minX,maxX,minZ,maxZ};const theme=this.config.theme,night=theme==='night',roadHalf=this.config.width/2;
  put((minX+maxX)/2,-2,(minZ+maxZ)/2,maxX-minX+1000,2,maxZ-minZ+1000,this.config.ground);
  if(this.roadMaterial)this.roadMaterial.dispose();this.roadMaterial=new THREE.MeshStandardMaterial({color:0xffffff,map:this.asphalt,roughness:.94,metalness:.02});this.ribbon(-roadHalf,roadHalf,.02,this.roadMaterial);
  this.ribbon(-roadHalf-.7,-roadHalf,.04,this.material(0xe6e4d1));this.ribbon(roadHalf,roadHalf+.7,.04,this.material(0xe6e4d1));
  for(let i=0;i<track.frames.length;i+=2){const f=track.sample(i*track.step),yaw=Math.atan2(f.tangent.x,f.tangent.z);for(const side of [-1,1]){const q=f.p.clone().addScaledVector(f.right,side*(roadHalf+.4));put(q.x,q.y+.08,q.z,.8,.16,track.step*2.05,i%4?0xf2eee1:0xd8433e,yaw);const wall=f.p.clone().addScaledVector(f.right,side*(roadHalf+1.2));put(wall.x,wall.y+.65,wall.z,.65,1.3,track.step*2.04,Math.floor(i/8)%2?0xeee9db:night?0x6461b8:0x237c76,yaw)}
   if(i%6===0){const q=f.p.clone();put(q.x,q.y+.04,q.z,.12,.025,3,0xd8ddd0,yaw)}
  }
  const nearTrack=(p,r)=>track.frames.some((f,i)=>i%8===0&&f.p.distanceTo(p)<roadHalf+r);
  for(let i=0;i<track.frames.length;i+=13){const f=track.sample(i*track.step);for(const side of [-1,1]){const p=f.p.clone().addScaledVector(f.right,side*(roadHalf+14+(i%5)*4));if(nearTrack(p,7))continue;const yaw=Math.atan2(f.tangent.x,f.tangent.z),seed=i+side*7;
   if(theme==='harbor'||theme==='korea'||night){
    const height=night?28+(i%7)*9:12+(i%5)*4;
    const building=new THREE.Group();building.position.set(p.x,p.y-1,p.z);building.rotation.y=yaw;
    const tex=this.facade.clone();tex.repeat.set(1,Math.max(1,height/12));tex.needsUpdate=true;
    const mat=new THREE.MeshStandardMaterial({color:night?0x7d8795:[0xe5d7c3,0xc9ccc3,0xe8ccae,0xd5d0c5][i%4],map:tex,roughness:.88,metalness:.04});
    const body=new THREE.Mesh(this.geometry,mat);body.scale.set(12,height,13);body.position.y=height/2;body.castShadow=true;body.receiveShadow=true;building.add(body);
    body.userData.ownedMaterial=true;body.userData.ownedMap=true;
    for(const yy of [1,height-1,height])this.cube(building,0,yy,0,12.5,.22,13.5,0xb4b0a4);
    if(!night){
     const roof=this.shape(building,new THREE.ConeGeometry(9.3,2.3,4),0,height+1.1,0,1,1,1,0x98694f);roof.rotation.y=Math.PI/4;roof.userData.ownedGeometry=true;
     for(let floor=3;floor<height-1;floor+=3.2)for(const side of [-1,1]){
      this.cube(building,0,floor,side*6.8,10,.16,1.1,0xc7bca9);
      this.cube(building,0,floor+.7,side*7.2,10,.045,.04,0x434a4d);
      for(let rail=-5;rail<=5;rail+=.65)this.cube(building,rail,floor+.35,side*7.2,.025,.7,.025,0x434a4d);
     }
    }
    this.environment.add(building);
   }else{
    const trunk=theme==='sakura'?0x6b5a50:0x5b5041;
    put(p.x,p.y+2,p.z,.48,6,.48,trunk,0,'cylinder');
    const colors=theme==='sakura'?[0xc991a1,0xddb6bf,0x9f7985]:[0x304b2d,0x415d34,0x566a40];
    for(let j=0;j<18;j++){
     const a=j*2.399,spread=1.3+(j%4)*.55,yy=4.5+(j%5)*.65;
     const xx=p.x+Math.cos(a)*spread,zz=p.z+Math.sin(a)*spread;
     put(xx,p.y+yy,zz,2.6+(j%3)*.4,2.2+(j%2)*.7,2.5,colors[j%3],a,'sphere');
    }
   }

   if(i%39===0){const q=f.p.clone().addScaledVector(f.right,side*(roadHalf+2.3));put(q.x,3.6+q.y,q.z,.35,7,.35,0x454f53);put(q.x,q.y+7.2,q.z,2.8,.4,1.2,night?0xffe2ac:0xe5e4d2)}
  }}
  // Grandstands and trackside infrastructure.
  const start=track.sample(0),yaw=Math.atan2(start.tangent.x,start.tangent.z);
  for(let side of [-1,1]){const p=start.p.clone().addScaledVector(start.right,side*(roadHalf+17));for(let j=0;j<4;j++)put(p.x+start.right.x*side*j*1.7,1+j,p.z+start.right.z*side*j*1.7,7+j*2,2,32,j%2?0xc2c7c2:0x8298a1,yaw);}
  for(const distance of [0,track.length*.34,track.length*.69])this.addSpectators(track.sample(distance),roadHalf,put);
  const gantry=track.sample(20);for(const side of [-1,1]){const q=gantry.p.clone().addScaledVector(gantry.right,side*(roadHalf+.6));put(q.x,q.y+4,q.z,.7,8,.7,0x34434c)}put(gantry.p.x,gantry.p.y+7.8,gantry.p.z,this.config.width+2,1.5,1.5,0x203c3f,-Math.atan2(gantry.tangent.x,-gantry.tangent.z));
  for(let i=0;i<12;i++){const q=start.p.clone().addScaledVector(start.right,(i/12-.5)*this.config.width);put(q.x,q.y+.055,q.z,this.config.width/12,.04,1.4,i%2?0xffffff:0x161f25,yaw)}
  if(theme==='harbor'){put(minX-180,-.6,(minZ+maxZ)/2,230,.2,maxZ-minZ+400,0x58aebc);for(let i=0;i<6;i++){put(minX-120-i%2*40,-.1,minZ+i*80,14,2,30,0xf1eadd);put(minX-120-i%2*40,2,minZ+i*80,9,3,12,0xc8e6e9)}}
  if(theme==='sakura'){put(maxX+230,40,minZ-130,260,90,230,0x768892,0,'cone');put(maxX+230,80,minZ-130,65,23,58,0xe0e4e2,0,'cone')}
  if(theme==='korea'){
   for(let i=0;i<7;i++)put(minX-220+i*100,20,minZ-160-(i%2)*60,150,70+(i%3)*25,160,0x638274,0,'cone');
   const gate=track.sample(45).p;put(gate.x-14,3,gate.z,1,6,1,0x983d35);put(gate.x+14,3,gate.z,1,6,1,0x983d35);put(gate.x,6.3,gate.z,30,.9,4,0x294c50);put(gate.x,7.2,gate.z,24,.8,3,0x294c50);
  }
  // Steel catch fencing, narrow posts, and horizontal guardrails.
  for(let i=0;i<track.frames.length;i+=4){const f=track.sample(i*track.step),yaw=Math.atan2(f.tangent.x,f.tangent.z);for(const side of [-1,1]){const q=f.p.clone().addScaledVector(f.right,side*(roadHalf+1.65));put(q.x,q.y+1.7,q.z,.09,3.4,.09,0x7e878c,0,'cylinder');for(const yy of [1.6,2.2,2.8,3.3])put(q.x,q.y+yy,q.z,.025,.025,track.step*4.02,0x8e979b,yaw)}}
  const dummy=new THREE.Object3D();for(const {color,shape,items} of this.batches.values()){const geometry=shape==='sphere'?this.sphere:shape==='cylinder'?this.cylinder:shape==='cone'?this.cone:this.geometry;let material=this.material(color);if(color===this.config.ground){material=new THREE.MeshStandardMaterial({color,map:this.grass,roughness:1})}if(color===0x58aebc){material=new THREE.MeshStandardMaterial({color:0x317a8b,roughness:.17,metalness:.45})}const mesh=new THREE.InstancedMesh(geometry,material,items.length);if(color===this.config.ground||color===0x58aebc)mesh.userData.ownedMaterial=true;mesh.castShadow=shape!=='sphere'||color!==0xf0f1f2;mesh.receiveShadow=true;items.forEach(([x,y,z,w,h,d,rot],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,rot,0);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();this.environment.add(mesh)}this.batches=null;
  this.botModels=bots.map(b=>{const g=this.makeCar(TEAMS[b.team].color,b.team);this.cars.add(g);return g});this.buildCockpit(TEAMS[team].color,driver);this.brandCar(this.cockpit,team,true);this.buildMechanics(TEAMS[team].color,TEAMS[team].id);this.buildSmoke();this.resize();
 }
 ribbon(left,right,y,material){const verts=[],norms=[],uvs=[],indices=[],count=this.track.frames.length;for(let i=0;i<=count;i++){const f=this.track.sample(i*this.track.step);for(const offset of [left,right]){const p=f.p.clone().addScaledVector(f.right,offset);verts.push(p.x,p.y+y,p.z);norms.push(0,1,0);uvs.push(offset===left?0:3,i*this.track.step/6)}if(i<count){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(norms,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);material.side=THREE.DoubleSide;const mesh=new THREE.Mesh(geo,material);mesh.userData.ownedGeometry=true;mesh.receiveShadow=true;this.environment.add(mesh)}
 tyre(parent,x,y,z,r,width){
  const pivot=new THREE.Group();pivot.position.set(x,y,z);parent.add(pivot);
  const spin=new THREE.Group();pivot.add(spin);pivot.userData.spin=spin;pivot.userData.radius=r;pivot.userData.front=z<0;
  (parent.userData.tyres??=[]).push(pivot);
  const tread=new THREE.Mesh(new THREE.CylinderGeometry(r,r,width,48),this.rubberMaterial);tread.rotation.z=Math.PI/2;tread.castShadow=true;tread.userData.ownedGeometry=true;spin.add(tread);
  for(const side of [-1,1]){
   const disc=this.shape(spin,this.cylinder,side*(width/2+.003),0,0,r*1.3,.012,r*1.3,0x30343a);disc.rotation.z=Math.PI/2;
   for(let k=0;k<10;k++){
    const a=k*Math.PI/5;const spoke=this.cube(spin,side*(width/2+.012),Math.sin(a)*r*.35,Math.cos(a)*r*.35,.014,r*.08,r*.65,0x727a80);spoke.rotation.x=-a;
   }
   const hub=this.shape(spin,this.cylinder,side*(width/2+.018),0,0,r*.28,.025,r*.28,0xc4c8ca);hub.rotation.z=Math.PI/2;
   const ring=new THREE.Mesh(new THREE.TorusGeometry(r*.86,.009,8,48),this.material(0xd0b84f));ring.rotation.y=Math.PI/2;ring.position.x=side*(width/2+.01);ring.userData.ownedGeometry=true;spin.add(ring);
   // Sidewall lettering-like bars and one inspection mark make rotation visible.
   for(let k=0;k<7;k++){const a=k*.12+.3;const mark=this.cube(spin,side*(width/2+.014),Math.sin(a)*r*.76,Math.cos(a)*r*.76,.008,r*.06,r*.025,0xd0b84f);mark.rotation.x=-a;}
  }
  for(let k=0;k<24;k++){const a=k*Math.PI/12;const seam=this.cube(spin,0,Math.sin(a)*(r+.001),Math.cos(a)*(r+.001),width*.92,.004,.009,k===0?0x8a8a81:0x303234);seam.rotation.x=-a;}
  return pivot;
 }
 animateTyres(group,speed,dt,steer=0){for(const pivot of group.userData.tyres??[]){pivot.userData.spin.rotation.x=wheelAngle(pivot.userData.spin.rotation.x,speed,dt,pivot.userData.radius);pivot.rotation.y=pivot.userData.front?-steer*.22:0}}
 bareHand(parent,side){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.16,.24),this.handMaterial);
  mesh.position.set(side*.232,-.036,.09);mesh.scale.x=side<0?1:-1;
  mesh.userData.ownedGeometry=true;mesh.renderOrder=4;parent.add(mesh);
 }
 addSpectators(frame,roadHalf,put){
  const yaw=Math.atan2(frame.tangent.x,frame.tangent.z);
  for(const side of [-1,1])for(let row=0;row<4;row++){
   const center=frame.p.clone().addScaledVector(frame.right,side*(roadHalf+10+row*1.8));
   put(center.x,center.y+(.7+row*.7)/2,center.z,1.8,.7+row*.7,26,0x858d90,yaw);
   for(let section=-1;section<=1;section++){
    const p=center.clone().addScaledVector(frame.tangent,section*7.4);
    const crowd=new THREE.Mesh(new THREE.PlaneGeometry(7.2,2.4),this.crowdMaterial);
    crowd.position.copy(p);crowd.position.y+=1.9+row*.7;
    crowd.rotation.y=Math.atan2(-side*frame.right.x,-side*frame.right.z);
    crowd.userData.ownedGeometry=true;this.environment.add(crowd);
   }
  }
 }

 brandMaterial(teamIndex,kind){
  const t=TEAMS[teamIndex],key=t.id+kind;if(this.brandMaterials.has(key))return this.brandMaterials.get(key);
  let texture;
  if(kind==='logo')texture=new THREE.TextureLoader().load(TEAM_LOGOS[t.id]);
  else if(SPONSOR_LOGOS[t.id])texture=new THREE.TextureLoader().load(SPONSOR_LOGOS[t.id]);
  else{
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');
   ctx.clearRect(0,0,512,256);ctx.fillStyle=t.id==='aston'?'#70c7db':t.id==='alpine'?'#f7a5cf':t.id==='mercedes'?'#36dfcd':'#ff594d';ctx.font=t.id==='redbull'?'66px Arial':'bold 70px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(SPONSORS[t.id],256,128,480);texture=new THREE.CanvasTexture(canvas);
  }
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  const material=new THREE.MeshBasicMaterial({map:texture,color:kind==='logo'&&t.id!=='ferrari'?(t.id==='redbull'?'#e52332':t.color):0xffffff,transparent:true,alphaTest:.1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false});
  this.brandMaterials.set(key,material);return material;
 }
 brandCar(group,teamIndex,cockpit){
  const decal=(kind,x,y,z,w,h,rx=0,ry=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),this.brandMaterial(teamIndex,kind));m.position.set(x,y,z);m.rotation.set(rx,ry,0);m.userData.ownedGeometry=true;m.userData.branding=kind;group.add(m);return m};
  if(cockpit){
   // Both marks sit above the steering wheel, on the visible nose and halo.
   this.cube(group,0,-.675,-2.35,.36,.025,1.05,0x101820);
   decal('logo',0,-.659,-2.66,.30,.32,-Math.PI/2);
   decal('sponsor',0,-.658,-2.16,.30,.30,-Math.PI/2);
   this.cube(group,-.31,.045,-1.46,.20,.095,.022,0x101820);
   this.cube(group,.31,.045,-1.46,.20,.095,.022,0x101820);
   decal('logo',-.31,.045,-1.444,.16,.085);
   decal('sponsor',.31,.045,-1.444,.095,.085);
  }else{
   decal('sponsor',.5,1.055,2.082,.30,.25);
   decal('logo',-.5,1.055,2.083,.46,.24);
   decal('logo',0,.9,-.85,.43,.3,-Math.PI/2);
   for(const side of [-1,1]){
    decal('sponsor',side*.925,.57,.55,.5,.35,0,side*Math.PI/2);
    decal('logo',side*.821,.75,1.8,.42,.32,0,side*Math.PI/2);
   }
  }
 }

 makeCar(color,teamIndex=null){
  const g=new THREE.Group();
  this.shape(g,this.sphere,0,.55,0,1.25,.65,4.3,color);
  this.cube(g,0,.35,-2.1,1.9,.08,.65,color);this.cube(g,0,1.05,1.8,1.9,.28,.55,color);
  for(const side of [-1,1]){
   this.cube(g,side*.78,.7,1.8,.07,.6,.65,0x22272c);
   this.shape(g,this.sphere,side*.62,.55,.55,.6,.55,1.8,color);
   for(const z of [-1.3,1.3])this.tyre(g,side*.9,.44,z,.42,.4);
  }
  this.shape(g,this.sphere,0,.8,.15,.65,.45,1.1,0x171c22);
  this.shape(g,this.sphere,0,1.03,.15,.42,.48,.48,color);
  this.shape(g,this.sphere,0,1.08,-.04,.35,.12,.12,0x101b29);
  if(teamIndex!==null)this.brandCar(g,teamIndex,false);
  return g;
 }

 buildCockpit(color){const g=this.cockpit;g.userData.tyres=[];this.shape(g,this.sphere,0,-.83,-2.3,.46,.28,3,color);this.shape(g,this.sphere,0,-.72,-.9,1.16,.5,1.4,color);for(const side of [-1,1]){this.tyre(g,side*.76,-.74,-1.9,.3,.26);this.tube(g,[[side*.2,-.78,-1],[side*.76,-.74,-1.9]],.023,0x22262b);this.tube(g,[[side*.25,-.75,-2.2],[side*.76,-.74,-1.9]],.018,0x22262b);this.shape(g,this.sphere,side*.48,-.64,-.5,.2,.23,1.1,color)}
  this.tube(g,[[-.55,-.43,-.55],[-.62,-.04,-1.08],[-.4,.04,-1.45],[0,.07,-1.54],[.4,.04,-1.45],[.62,-.04,-1.08],[.55,-.43,-.55]],.028,0x30353a);this.tube(g,[[0,.07,-1.54],[0,-.35,-1.55],[0,-.59,-1.4]],.018,0x30353a);
  this.wheel=new THREE.Group();this.wheel.position.set(0,-.36,-.72);g.add(this.wheel);this.cube(this.wheel,0,0,0,.43,.155,.055,0x171e24);this.cube(this.wheel,0,.014,.032,.16,.085,.009,0x08343c);
  for(const side of [-1,1]){this.tube(this.wheel,[[side*.16,.07,0],[side*.235,.09,0],[side*.255,0,0],[side*.22,-.105,0],[side*.15,-.07,0]],.027,0x171b20);this.bareHand(this.wheel,side);for(let j=0;j<3;j++){const b=this.shape(this.wheel,this.cylinder,side*(.12+j*.035),.025,.036,.021,.009,.021,j===0?0xd9504b:j===1?0x85b9ed:0xd7cf77);b.rotation.x=Math.PI/2}}
  for(let i=0;i<7;i++)this.cube(this.wheel,(i-3)*.022,.086,.02,.011,.006,.008,i<4?0x7cdba7:0xe94c4e);
  this.arms=[-1,1].map(side=>{const arm=new THREE.Group();g.add(arm);const mesh=this.shape(arm,new THREE.CylinderGeometry(.036,.06,1,24),0,0,0,1,1,1,color);mesh.userData.ownedGeometry=true;mesh.material=new THREE.MeshStandardMaterial({color,map:this.cloth,roughness:1});mesh.userData.ownedMaterial=true;this.tube(arm,[[0,-.45,.054],[0,0,.048],[0,.45,.036]],.0018,0xd1d2cc);return {side,mesh:arm}});
 }
 mechanicMaterialFor(teamId,running=false){
  const key=teamId+(running?':run':':repair');
  if(!this.mechanicMaterials.has(key)){
   const texture=new THREE.TextureLoader().load((running?MECHANIC_RUNS:MECHANIC_UNIFORMS)[teamId]);texture.colorSpace=THREE.SRGBColorSpace;
   this.mechanicMaterials.set(key,new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.5,side:THREE.DoubleSide,toneMapped:false}));
  }
  return this.mechanicMaterials.get(key);
 }
 buildRunningMechanic(parent,teamId){
  const runner=new THREE.Mesh(new THREE.PlaneGeometry(1,1),this.mechanicMaterialFor(teamId,true));
  runner.userData.ownedGeometry=true;runner.userData.photographicRunner=true;runner.userData.team=teamId;
  runner.position.y=.15;parent.add(runner);return runner;
 }
 setMechanicRunFrame(runner,frame){
  const column=frame%2,row=Math.floor(frame/2),u=column*.5,v=(1-row)*.5;
  const uv=runner.geometry.attributes.uv;
  uv.setXY(0,u,v+.5);uv.setXY(1,u+.5,v+.5);uv.setXY(2,u,v);uv.setXY(3,u+.5,v);uv.needsUpdate=true;
  runner.userData.frame=frame;
 }
 buildMechanics(color,teamId){
  const uniform=this.mechanicMaterialFor(teamId);
  this.pitCrew=new THREE.Group();this.cockpit.add(this.pitCrew);this.pitCrew.visible=false;this.mechanics=[];
  for(const side of [-1,1]){
   const worker=new THREE.Group();this.pitCrew.add(worker);worker.position.set(side*1.18,-.65,-1.95);
   const arm=new THREE.Group();worker.add(arm);
   const person=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.575),uniform);person.position.y=.05;person.scale.x=side<0?1:-1;person.userData.ownedGeometry=true;person.userData.photographicMechanic=true;person.userData.team=teamId;arm.add(person);
   const spare=new THREE.Group();worker.add(spare);this.tyre(spare,side*.24,-.1,-.2,.28,.21);
   const runner=this.buildRunningMechanic(worker,teamId);
   this.mechanics.push({worker,arm,spare,side,runner});
  }
 }
 updateMechanics(race){
  const repair=race.engineRepairTime||0,remaining=repair||race.pitTime||0;
  this.pitCrew.visible=remaining>0;if(!this.pitCrew.visible)return;
  const duration=repair?(race.engineRepairDuration||6):5,progress=duration-remaining,travel=.9;
  const phase=progress<travel?'arriving':remaining<travel?'leaving':'repairing';
  this.pitCrew.userData.phase=phase;
  const distance=phase==='arriving'?1-progress/travel:phase==='leaving'?1-remaining/travel:0;
  for(const {worker,arm,spare,side,runner} of this.mechanics){
   worker.position.x=side*(1.18+Math.max(0,distance)*4.2);worker.position.z=repair?-2.35:-1.95;
   const running=phase!=='repairing',stride=progress*19+side;
   runner.visible=running;arm.visible=!running;spare.visible=!running&&!repair;
   const image=runner.material.map?.image,aspect=image?image.width/image.height:2/3;
   runner.scale.set((side<0?1:-1)*(phase==='leaving'?-1:1)*1.9*aspect,1.9,1);
   runner.position.y=.15+Math.abs(Math.sin(stride))*.025;
   this.setMechanicRunFrame(runner,Math.floor(progress*12)%4);
   arm.rotation.z=side*Math.sin(progress*18)*.018;arm.position.y=Math.sin(progress*9)*.015;
   spare.position.x=-side*.25*Math.sin(Math.min(1,progress/3)*Math.PI);spare.rotation.x=progress*3;
  }
 }

 buildSmoke(){
  this.smokeState=new CollisionSmoke();this.smokeCloud=new THREE.Group();this.cockpit.add(this.smokeCloud);this.smokeCloud.visible=false;
  for(let i=0;i<24;i++){
   const material=new THREE.SpriteMaterial({map:this.smokeTexture,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
   const puff=new THREE.Sprite(material);puff.userData.ownedMaterial=true;puff.userData.phase=i/24;puff.userData.side=i%2?1:-1;this.smokeCloud.add(puff);
  }
 }
 updateSmoke(race,dt){
  this.smokeCloud.visible=this.smokeState.update(race,dt);if(!this.smokeCloud.visible)return;
  const age=this.smokeState.age,strength=this.smokeState.strength;
  for(const puff of this.smokeCloud.children){
   const phase=puff.userData.phase,t=age-phase*.65;
   const fade=Math.max(0,1-Math.max(0,t)/2.55);puff.material.opacity=t<0?0:fade*(.35+strength*.3);
   puff.position.set(puff.userData.side*(.25+phase*.2)+Math.sin(phase*19+t)*Math.max(0,t)*.15,-.73+Math.max(0,t)*(.3+phase*.2),-2.3-phase*.5-Math.max(0,t)*race.speed*.012);
   const size=.16+Math.max(0,t)*(.35+strength*.15);puff.scale.set(size,size,1);puff.material.rotation=phase*6+Math.max(0,t)*.16;
  }
 }

 update(race,dt){const f=this.track.sample(race.pos);const cameraPoint=f.p.clone().addScaledVector(f.right,race.x);this.camera.position.copy(cameraPoint);this.camera.position.y+=1.38+(race.recovery>0?Math.sin(race.recovery/race.recoveryDuration*Math.PI)*1.2:0);
  this.camera.rotation.set(-.025,Math.atan2(-f.tangent.x,-f.tangent.z)-race.steer*.025,race.roll-race.steer*.014,'YXZ');
  const wet=race.wet,night=this.config.theme==='night';this.scene.backgroundIntensity=night?.035:1-wet*.65;this.scene.backgroundBlurriness=wet*.2;this.scene.fog.color.copy(this.baseSky).lerp(new THREE.Color(night?0x1b273a:0x718995),wet*.75);this.scene.fog.far=680-wet*290;this.light.intensity=night?.45:.9-wet*.3;this.sun.intensity=night?.15:1.7-wet*1.3;this.roadMaterial.color.set(wet>.4?0x909ba5:0xffffff);this.roadMaterial.roughness=1-wet*.65;this.sun.position.copy(cameraPoint).add(new V(-45,80,25));this.sun.target.position.copy(cameraPoint);this.sun.target.updateMatrixWorld();
  this.rain.visible=wet>.05;this.rainLines.material.opacity=wet*.52;const attr=this.rainGeo.attributes.position;for(let i=0;i<attr.count;i+=2){let yy=attr.getY(i)-dt*(19+race.speed*.1);if(yy<-10)yy=14;attr.setY(i,yy);attr.setY(i+1,yy-.6)}attr.needsUpdate=true;
  for(let i=0;i<race.bots.length;i++){const b=race.bots[i],g=this.botModels[i];if(!g)continue;const q=this.track.sample(b.pos);g.position.copy(q.p).addScaledVector(q.right,b.x);g.rotation.y=Math.atan2(-q.tangent.x,-q.tangent.z);this.animateTyres(g,b.finish!==null?0:b.speed,dt)}
  this.updateMechanics(race);this.updateSmoke(race,dt);
  this.animateTyres(this.cockpit,race.speed,dt,race.steer);
  this.wheel.rotation.z=-race.steer*.48;for(const {side,mesh} of this.arms){const from=new V(side*.39,-.64,-.23),to=new V(side*.22,-.04,.06).applyAxisAngle(new V(0,0,1),this.wheel.rotation.z).add(this.wheel.position);mesh.position.copy(from).lerp(to,.5);mesh.scale.y=from.distanceTo(to);mesh.quaternion.setFromUnitVectors(new V(0,1,0),to.clone().sub(from).normalize())}
  this.renderer.render(this.scene,this.camera);
 }
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix()}
}
export function drawMap(canvas,track,race=null){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);const pts=track.frames.map(f=>f.p),xs=pts.map(p=>p.x),zs=pts.map(p=>p.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs),scale=Math.min((w-36)/(maxX-minX),(h-36)/(maxZ-minZ));const map=p=>[w/2+(p.x-(minX+maxX)/2)*scale,h/2+(p.z-(minZ+maxZ)/2)*scale];ctx.lineJoin='round';ctx.lineWidth=race?8:6;ctx.strokeStyle='#253e45';ctx.beginPath();pts.forEach((p,i)=>{const [x,y]=map(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#92b9ac';ctx.stroke();const start=map(pts[0]);ctx.fillStyle='#fff3ce';ctx.fillRect(start[0]-4,start[1]-4,8,8);if(race){for(const b of race.bots){const [x,y]=map(track.sample(b.pos).p);ctx.fillStyle=TEAMS[b.team].color;ctx.fillRect(x-3,y-3,6,6)}const f=track.sample(race.pos),[x,y]=map(f.p);ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(f.tangent.x,-f.tangent.z));ctx.fillStyle='#e7ff98';ctx.strokeStyle='#122b25';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(6,6);ctx.lineTo(0,3);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}}
