// 第 11 步：仅对已确认的数据变化做即时、可中断的反馈。
// 不产生随机/定时的“成长”动画，也不承担业务状态判断。
const PREF_KEY='mg-motion-reduced';

export const readMotionPreference=()=>localStorage.getItem(PREF_KEY)==='true'||matchMedia('(prefers-reduced-motion: reduce)').matches;
export const saveMotionPreference=value=>localStorage.setItem(PREF_KEY,String(Boolean(value)));

export function cueChange(state,{type,imageryId=null,sourceRecordId=null,message}){
  state.motionCue={type,imageryId,sourceRecordId,message,at:Date.now()};
}

export function bindSceneMotion({root,state,onRender,onAnnounce}){
  const canvas=root.querySelector('.scene-canvas');
  if(!canvas)return()=>{};
  const camera=state.camera||{x:0,y:0,zoom:1}; state.camera=camera;
  const apply=()=>{canvas.style.setProperty('--scene-pan-x',`${camera.x}px`);canvas.style.setProperty('--scene-pan-y',`${camera.y}px`);canvas.style.setProperty('--scene-zoom',String(camera.zoom));};
  const move=(x,y)=>{camera.x=Math.max(-150,Math.min(150,camera.x+x));camera.y=Math.max(-90,Math.min(90,camera.y+y));apply()};
  const zoom=delta=>{camera.zoom=Math.max(.9,Math.min(1.25,Math.round((camera.zoom+delta)*100)/100));apply()};
  const command=action=>{if(action==='left')move(40,0);else if(action==='right')move(-40,0);else if(action==='up')move(0,30);else if(action==='down')move(0,-30);else if(action==='zoom-in')zoom(.08);else if(action==='zoom-out')zoom(-.08);else {camera.x=0;camera.y=0;camera.zoom=1;apply()}onAnnounce?.('场景视角已调整')};
  const controls=root.querySelector('[data-scene-controls]');
  const trigger=controls?.querySelector('[data-scene-control-trigger]');
  const panel=controls?.querySelector('.scene-control-panel');
  const openControls=()=>{if(!controls||!panel||!trigger)return;state.sceneControlsOpen=true;controls.classList.add('is-open');panel.hidden=false;controls.querySelector('[data-scene-control-dismiss]')?.removeAttribute('hidden');trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-label','关闭场景控制');panel.querySelector('[data-camera], [data-motion-toggle], [data-scene-control-close]')?.focus()};
  const closeControls=({restoreFocus=true}={})=>{if(!controls||!panel||!trigger)return;state.sceneControlsOpen=false;controls.classList.remove('is-open');panel.hidden=true;controls.querySelector('[data-scene-control-dismiss]')?.setAttribute('hidden','');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','打开场景控制');if(restoreFocus)trigger.focus()};
  trigger?.addEventListener('click',()=>state.sceneControlsOpen?closeControls():openControls());
  controls?.querySelectorAll('[data-scene-control-close], [data-scene-control-dismiss]').forEach(button=>button.addEventListener('click',()=>closeControls()));
  const outside=event=>{if(state.sceneControlsOpen&&controls&&!controls.contains(event.target)){event.preventDefault();closeControls()}};
  const escape=event=>{if(event.key==='Escape'&&state.sceneControlsOpen){event.preventDefault();closeControls()}};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  let drawerStart=null;
  const dragHandle=controls?.querySelector('[data-scene-control-drag]');
  const drawerDown=event=>{drawerStart={x:event.clientX,y:event.clientY}};
  const drawerUp=event=>{if(!drawerStart)return;const dx=event.clientX-drawerStart.x,dy=event.clientY-drawerStart.y;drawerStart=null;if(dy>56&&Math.abs(dy)>Math.abs(dx))closeControls()};
  dragHandle?.addEventListener('pointerdown',drawerDown);
  dragHandle?.addEventListener('pointerup',drawerUp);
  root.querySelectorAll('[data-camera]').forEach(button=>button.addEventListener('click',()=>command(button.dataset.camera)));
  root.querySelector('[data-motion-toggle]')?.addEventListener('click',event=>{const requested=!state.reduceMotion;const systemReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;state.reduceMotion=requested||systemReduced;saveMotionPreference(requested);state.sceneControlsOpen=true;event.currentTarget.setAttribute('aria-pressed',String(state.reduceMotion));onAnnounce?.(systemReduced&&!requested?'系统已启用减少动态效果':state.reduceMotion?'已减少动态效果':'已恢复必要动态反馈');onRender();requestAnimationFrame(()=>root.querySelector('[data-motion-toggle]')?.focus())});
  const motionMedia=matchMedia('(prefers-reduced-motion: reduce)');
  const systemMotionChanged=event=>{const stored=localStorage.getItem('mg-motion-reduced');const next=stored==='true'||event.matches;if(next===state.reduceMotion)return;state.reduceMotion=next;state.sceneControlsOpen=true;onRender();requestAnimationFrame(()=>root.querySelector('[data-motion-toggle]')?.focus())};
  motionMedia.addEventListener?.('change',systemMotionChanged);
  const keydown=event=>{if(event.target!==canvas&&!event.target.closest?.('[data-scene-controls]'))return;const keys={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down','+':'zoom-in','=':'zoom-in','-':'zoom-out',r:'reset',R:'reset','0':'reset'};if(keys[event.key]){event.preventDefault();command(keys[event.key])}};
  root.addEventListener('keydown',keydown);
  let start=null;
  const down=event=>{if(event.target.closest?.('.scene-hit,[data-action]')){start=null;return}if(event.pointerType==='mouse'&&event.button!==0)return;start={x:event.clientX,y:event.clientY};try{canvas.setPointerCapture?.(event.pointerId)}catch{/* Synthetic or cancelled pointers have no active capture. */}};
  const drag=event=>{if(!start)return;move(event.clientX-start.x,event.clientY-start.y);start={x:event.clientX,y:event.clientY}};
  const up=()=>{start=null};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',drag);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  apply();
  return()=>{root.removeEventListener('keydown',keydown);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',drag);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);dragHandle?.removeEventListener('pointerdown',drawerDown);dragHandle?.removeEventListener('pointerup',drawerUp);motionMedia.removeEventListener?.('change',systemMotionChanged)};
}

export function applyCue(root,state,onAnnounce){
  const cue=state.motionCue;if(!cue)return;
  const target=cue.imageryId?root.querySelector(`[data-object="${CSS.escape(cue.imageryId)}"]`):cue.type==='alignment'?root.querySelector('[data-memorial]'):cue.type==='record'?root.querySelector('[data-collection]'):null;
  if(target){
    target.classList.add('motion-cue',`motion-cue-${cue.type}`);target.focus({preventScroll:true});
    if(!cue.announced){cue.announced=true;onAnnounce?.(`${cue.message}。可点击查看为什么出现这个变化。`)}
    const finish=()=>{target.classList.remove('motion-cue',`motion-cue-${cue.type}`);state.motionCue=null;clearTimeout(state.motionTimer)};
    target.addEventListener('pointerdown',finish,{once:true});target.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')finish()},{once:true});
    clearTimeout(state.motionTimer);state.motionTimer=setTimeout(finish,state.reduceMotion?120:720);
  }
}
