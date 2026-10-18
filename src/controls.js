// Use physical key codes so WASD works with Korean input and Caps Lock too.
const ACTIONS={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',Space:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
export class KeyboardControls{
 constructor(){this.pressed=new Set()}
 keydown(code){if(!ACTIONS[code])return false;this.pressed.add(code);return true}
 keyup(code){this.pressed.delete(code)}
 clear(){this.pressed.clear()}
 read(){const actions=new Set([...this.pressed].map(code=>ACTIONS[code]));return {gas:actions.has('gas')&&!actions.has('brake'),brake:actions.has('brake'),steer:Number(actions.has('right'))-Number(actions.has('left'))}}
}
