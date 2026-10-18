// Use physical key codes so WASD works with Korean input and Caps Lock too.
const ACTIONS={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',Space:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
export class KeyboardControls{
 constructor(){this.pressed=new Set()}
 keydown(code){if(!ACTIONS[code])return false;this.pressed.add(code);return true}
 keyup(code){this.pressed.delete(code)}
 clear(){this.pressed.clear()}
 read(){const actions=new Set([...this.pressed].map(code=>ACTIONS[code]));return {gas:actions.has('gas')&&!actions.has('brake'),brake:actions.has('brake'),steer:Number(actions.has('right'))-Number(actions.has('left'))}}
}

// Each finger owns its action; lifting one finger must not release another.
export class TouchControls{
 constructor(){this.pointers=new Map()}
 down(id,action){if(['left','right','gas','brake'].includes(action))this.pointers.set(id,action)}
 up(id){this.pointers.delete(id)}
 clear(){this.pointers.clear()}
 has(action){return [...this.pointers.values()].includes(action)}
 read(){return {gas:this.has('gas')&&!this.has('brake'),brake:this.has('brake'),steer:Number(this.has('right'))-Number(this.has('left'))}}
}
export function combineControls(keyboard,touch){const k=keyboard.read(),t=touch.read(),brake=k.brake||t.brake;return {gas:(k.gas||t.gas)&&!brake,brake,steer:Math.max(-1,Math.min(1,k.steer+t.steer))}}
