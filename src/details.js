import * as THREE from 'three';

// Distance/radius gives wheel angle in radians; zero speed keeps wheels still.
export function wheelAngle(angle, speed, dt, radius) {
 return (angle + speed * dt / radius) % (Math.PI * 2);
}
export function surfaceTexture(kind) {
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d');
 if(kind==='facade'){
  ctx.fillStyle='#bfb5a2';ctx.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=128){
   ctx.fillStyle='#918b7e';ctx.fillRect(0,y+119,512,5);ctx.fillStyle='#e0d8c8';ctx.fillRect(0,y+124,512,4);
   for(let x=0;x<512;x+=128){
    ctx.fillStyle='#625d54';ctx.fillRect(x+26,y+22,76,88);
    ctx.fillStyle='#e7e0cf';ctx.fillRect(x+29,y+18,70,86);
    const glass=ctx.createLinearGradient(x,y,x+70,y+110);glass.addColorStop(0,'#779aa5');glass.addColorStop(.48,'#344754');glass.addColorStop(.5,'#a3b5b8');glass.addColorStop(1,'#263843');ctx.fillStyle=glass;ctx.fillRect(x+34,y+24,60,74);
    ctx.fillStyle='#d2c7b2';ctx.fillRect(x+62,y+24,4,74);ctx.fillRect(x+34,y+58,60,3);
    ctx.fillStyle='#454d48';ctx.fillRect(x+15,y+24,10,78);ctx.fillRect(x+103,y+24,10,78);
    ctx.fillStyle='#a79c87';ctx.fillRect(x+21,y+103,86,6);
   }
  }
 }else{
  ctx.fillStyle=kind==='rubber'?'#282a2c':'#b0b0ab';ctx.fillRect(0,0,512,512);
 }
 let seed=73;for(let i=0;i<18000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%512;seed=(seed*1664525+1013904223)>>>0;const y=seed%512;ctx.fillStyle=i%2?'rgba(0,0,0,.07)':'rgba(255,255,255,.07)';ctx.fillRect(x,y,kind==='cloth'?2:1,kind==='cloth'?1:2)}
 if(kind==='cloth'){ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;for(let i=0;i<512;i+=4){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke()}}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
