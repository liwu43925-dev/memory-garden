import {writeFile} from 'node:fs/promises';

const debugPort=Number(process.env.CDP_PORT||9224);
const previewUrl=process.env.PREVIEW_URL||'http://127.0.0.1:58078/r/group-home/space/home';
const viewportWidth=Number(process.env.VIEWPORT_WIDTH||1440);
const viewportHeight=Number(process.env.VIEWPORT_HEIGHT||1000);
const screenshotPath=process.env.SCREENSHOT_PATH||'work/page-a-home-interactions.png';
const targets=await fetch(`http://127.0.0.1:${debugPort}/json`).then(response=>response.json());
const target=targets.find(item=>item.type==='page');
if(!target)throw new Error('No debuggable page target found');

const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
let requestId=0;
const pending=new Map();
socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(!message.id)return;
  const handlers=pending.get(message.id);
  if(!handlers)return;
  pending.delete(message.id);
  if(message.error)handlers.reject(new Error(message.error.message));
  else handlers.resolve(message.result);
});
const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++requestId;
  pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
});
const evaluate=async expression=>{
  const response=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(response.exceptionDetails)throw new Error(response.exceptionDetails.text);
  return response.result.value;
};
const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const click=selector=>evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)return false;element.click();return true})()`);
const closeModal=async()=>{await click('[data-modal-close]');await wait(60)};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:viewportWidth,height:viewportHeight,deviceScaleFactor:1,mobile:viewportWidth<768});
await send('Page.navigate',{url:previewUrl});
await wait(1400);

const results={url:await evaluate('location.href')};

await click('[data-help]');
await wait(60);
results.helpOpen=await evaluate(`(()=>{
  const dialog=document.querySelector('[role="dialog"]');
  const buttons=[...document.querySelectorAll('[data-modal-close]')];
  const style=element=>{const value=getComputedStyle(element);return {zIndex:value.zIndex,pointerEvents:value.pointerEvents,disabled:element.disabled,box:element.getBoundingClientRect().toJSON()}};
  return {dialog:!!dialog,focused:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent?.trim(),buttons:buttons.map(button=>({text:button.textContent.trim(),...style(button)})),backdrop:style(document.querySelector('[data-modal-bg]')),modal:style(dialog)};
})()`);
await evaluate(`(()=>{const button=[...document.querySelectorAll('[data-modal-close]')].find(item=>item.textContent.includes('知道了'));button.click();return true})()`);
await wait(60);
results.ackClose=await evaluate(`({closed:!document.querySelector('[role="dialog"]'),focusLabel:document.activeElement?.getAttribute('aria-label'),focusText:document.activeElement?.textContent?.trim()})`);

await click('[data-help]');await wait(40);await click('[data-modal-close]');await wait(60);
results.xClose=await evaluate(`({closed:!document.querySelector('[role="dialog"]'),focusLabel:document.activeElement?.getAttribute('aria-label')})`);

await click('[data-help]');await wait(40);
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
await wait(60);
results.escapeClose=await evaluate(`({closed:!document.querySelector('[role="dialog"]'),focusLabel:document.activeElement?.getAttribute('aria-label')})`);

results.keyboardImagery=await evaluate(`(()=>{const element=document.querySelector('.crown-imagery[data-action="open-imagery"]');if(!element)return {status:'MOCK_ABSENT'};element.focus();return {focused:document.activeElement===element,label:element.getAttribute('aria-label')}})()`);
if(results.keyboardImagery.status!=='MOCK_ABSENT'){
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  await wait(60);
  results.keyboardImagery.dialog=await evaluate(`!!document.querySelector('.detail-panel')`);
  await click('[data-close]');await wait(40);
}

results.memorialBefore=await evaluate(`(()=>{
  const element=document.querySelector('[data-memorial]');
  if(!element)return {exists:false};
  const box=element.getBoundingClientRect();
  const style=getComputedStyle(element);
  const images=[...element.querySelectorAll('img')].map(image=>({src:new URL(image.src).pathname,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,complete:image.complete}));
  const top=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
  return {exists:true,alignmentId:element.dataset.alignmentId||document.querySelector('[data-alignment-source]')?.dataset.alignmentSource||'align-demo-1',box:box.toJSON(),zIndex:style.zIndex,pointerEvents:style.pointerEvents,inViewport:box.right>0&&box.bottom>0&&box.left<innerWidth&&box.top<innerHeight,topElement:top?.className||top?.tagName,topWithin:element.contains(top),images};
})()`);

await click('[data-gramophone]');await wait(50);
results.gramophone=await evaluate(`document.querySelector('[role="dialog"]')?.innerText||''`);
await closeModal();

await click('[data-pet]');await wait(50);
results.pet=await evaluate(`document.querySelector('[role="dialog"]')?.innerText||''`);
await closeModal();

const imageObject=await evaluate(`document.querySelector('.crown-imagery[data-object]')?.dataset.object||null`);
results.imageImagery={id:imageObject};
if(imageObject){await click(`.crown-imagery[data-object="${imageObject}"]`);await wait(60);results.imageImagery.detail=await evaluate(`document.querySelector('.detail-panel')?.innerText||''`);await click('[data-close]');await wait(40)}

const discObject=await evaluate(`document.querySelector('.collection-disc[data-object]')?.dataset.object||null`);
results.disc={id:discObject};
if(discObject){await click(`.collection-disc[data-object="${discObject}"]`);await wait(60);results.disc.detail=await evaluate(`document.querySelector('.detail-panel')?.innerText||''`);await click('[data-load-disc]');await wait(650);results.disc.loaded=await evaluate(`({selected:sessionStorage.getItem('mg-current-disc'),discPresent:!!document.querySelector('[data-gramophone] .loaded-disc'),selectedText:document.querySelector('.collection-disc[aria-pressed="true"]')?.innerText||''})`);await click('[data-gramophone]');await wait(60);results.disc.playFeedback=await evaluate(`document.querySelector('[role="dialog"]')?.innerText||''`);await closeModal()}

await click('[data-pet]');await wait(40);await click('[data-quiet]');await wait(80);
results.petSleep=await evaluate(`({stored:localStorage.getItem('mg-pets-quiet'),pressed:document.querySelector('[data-quiet]')?.getAttribute('aria-pressed'),petLabel:document.querySelector('[data-pet]')?.getAttribute('aria-label')})`);

await click('[data-memorial]');await wait(60);
results.memorialClick=await evaluate(`document.querySelector('[role="dialog"]')?.innerText||''`);
await closeModal();

results.sceneHitTest=await evaluate(`(()=>[...document.querySelectorAll('.scene-hit, .collection-heading, .collection-disc')].map(element=>{const box=element.getBoundingClientRect();const style=getComputedStyle(element);const top=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);return {name:element.getAttribute('aria-label')||element.textContent.trim().slice(0,30),action:element.dataset.action||null,id:element.dataset.id||null,box:box.toJSON(),pointerEvents:style.pointerEvents,zIndex:style.zIndex,disabled:element.disabled,topWithin:element.contains(top),topElement:top?.getAttribute?.('aria-label')||top?.className||top?.tagName}}))()`);
results.sensitiveLeakTerms=await evaluate(`(()=>{const text=document.body.innerText;return ['临时调整了计划','希望计划更稳定','具体原因和时间安排还需要确认'].filter(term=>text.includes(term))})()`);
results.realPointerProof=[];
await evaluate(`(()=>{window.__realPointerEvents=[];const log=e=>window.__realPointerEvents.push({type:e.type,target:e.target?.tagName+'.'+(e.target?.className||''),action:e.target?.dataset?.action||null});document.addEventListener('pointerdown',log,true);document.addEventListener('click',log,true);return true})()`);
for(const selector of ['.crown-imagery[data-action="open-imagery"]','[data-gramophone]','.collection-disc','.pet-a','.memorial']){
  const point=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}})()`);
  if(!point){results.realPointerProof.push({selector,status:'MOCK_ABSENT'});continue}
  const hit=await evaluate(`(()=>{const x=${point.x},y=${point.y},h=document.elementFromPoint(x,y),s=h&&getComputedStyle(h);return {tag:h?.tagName,class:h?.className,action:h?.dataset?.action||null,id:h?.dataset?.id||null,zIndex:s?.zIndex||null,pointerEvents:s?.pointerEvents||null}})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});
  await wait(100);
  const feedback=await evaluate(`(()=>({dialog:document.querySelector('[role="dialog"]')?.innerText?.split('\\n').slice(0,3).join(' | ')||null,detail:document.querySelector('.detail-panel')?.innerText?.split('\\n').slice(0,3).join(' | ')||null,live:document.querySelector('#live-region')?.textContent||''}))()`);
  results.realPointerProof.push({selector,point,hit,feedback});
  await evaluate(`document.querySelector('[data-modal-close],[data-close]')?.click()`);await wait(40);
}
results.realPointerEvents=await evaluate('window.__realPointerEvents');

const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
await writeFile(screenshotPath,Buffer.from(screenshot.data,'base64'));
console.log(JSON.stringify(results,null,2));
socket.close();
