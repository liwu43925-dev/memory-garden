import {ASSETS,assetRoot} from './asset-paths.js';
import {CONTENT} from './content.js';
import {DESIGN_CANVAS,SCENE_LAYOUT,stableZonePositions,layerStyle,anchorStyle} from './scene-layout.js';

const art=(file,cls,alt='',style='')=>`<img class="${cls}" src="${assetRoot+file}" alt="${alt}" decoding="async" width="1254" height="1254"${style?` style="${style}"`:''}>`;
const layer=(file,cls,box)=>art(file,`layer layer-box ${cls}`,'',layerStyle(box));
const anchor=(slot,extra='')=>`${anchorStyle(slot)};${extra}`;

const imageryButton=(mapping,label,file,cls,esc,point,scale=1)=>{
  const x=Math.round(point.x*DESIGN_CANVAS.width);
  const y=Math.round(point.y*DESIGN_CANVAS.height);
  return `<button type="button" class="scene-hit crown-imagery ${cls}" data-action="open-imagery" data-id="${esc(mapping.imageryId)}" data-object="${esc(mapping.imageryId)}" data-record-id="${esc(mapping.sourceRecordId)}" aria-label="${esc(label)}" style="--x:${x}px;--y:${y}px;--mx:${x}px;--my:${y}px;--w:${Math.round(68*scale)}px;--mw:${Math.round(62*scale)}px;--art-scale:1.25;--art-x:0%;--art-y:3%">${art(file,'object-art')}<span class="scene-hit-label">${esc(label)}</span></button>`;
};

function recordCollection(records,layout,esc,currentDiscId){
  const style=anchorStyle(layout.collection);
  return `<section class="record-collection" aria-label="记忆唱片收藏" style="${style}">
    <button type="button" class="collection-heading" data-action="open-collection" data-id="collection" data-collection aria-expanded="true">
      <span>记忆唱片</span><small>${records.length?records.length+' 张':'暂无唱片'}</small>
    </button>
    ${records.length?`<div class="collection-slots">${records.slice(0,4).map((m,i)=>{const selected=m.imageryId===currentDiscId;return `<button type="button" class="collection-disc ${i===0?'first':''} ${selected?'is-selected':''}" data-action="open-imagery" data-id="${esc(m.imageryId)}" data-object="${esc(m.imageryId)}" data-record-id="${esc(m.sourceRecordId)}" aria-label="唱片：${esc(m.title)}，${esc(m.date||'日期未提供')}${selected?'，已装入留声机':''}" aria-pressed="${selected}">${art(ASSETS.audio.record,'disc-art')}<span>${esc(m.title)}</span><small>${selected?'已装入 · ':''}${esc(m.date||'日期未提供')}</small></button>`}).join('')}</div>`:'<p class="collection-empty">新增并确认音频后，唱片会收进这里。</p>'}
  </section>`;
}

function audioPlayer(state,records,esc){
  const current=records.find(item=>item.imageryId===state.currentDiscId);
  if(!current)return '';
  const selected=current?`${current.title}（演示）`:'尚未选择唱片';
  const progress=Math.round((state.audioProgress||0)*100);
  return `<section class="audio-player card" aria-label="记忆唱片播放器">
    <strong>记忆唱片</strong><p data-player-status>${esc(selected)}</p>
    <div class="audio-player-controls"><button type="button" class="btn small" data-play ${current?'':'disabled'} aria-pressed="${state.playing===true}">${state.playing?'暂停':'播放'}</button><button type="button" class="btn small" data-stop ${current?'':'disabled'}>停止</button><button type="button" class="btn small" data-caption aria-pressed="${state.captions!==false}">字幕${state.captions===false?'关':'开'}</button></div>
    <label>进度 <input type="range" min="0" max="100" value="${progress}" data-progress ${current?'':'disabled'}></label>
    <label>唱片音量 <input type="range" min="0" max="100" value="${state.audioVolume??50}" data-volume ${current?'':'disabled'}></label>
    ${state.captions!==false&&current?'<small>由记录转译 · 不展示原始表达</small>':''}
  </section>`;
}

function sceneLayers(scene,layout,stage){
  if(scene==='home')return [
    layer(ASSETS.home.sky,'sky',layout.layers.sky),
    layer(ASSETS.home.wall,'home-wall',layout.layers.wall),
    layer(ASSETS.garden.path,'home-ground',layout.layers.ground),
    layer(ASSETS.home.house,'house',layout.layers.house),
    layer(ASSETS.home.trunk,'home-trunk',layout.layers.trunk),
    layer(ASSETS.home.canopy,'home-canopy',layout.layers.canopy),
    layer(ASSETS.home.table,'table',layout.layers.table)
  ].join('');
  return [
    layer(ASSETS.garden.sky,'sky',layout.layers.sky),
    layer(ASSETS.garden.vegetation,'vegetation',layout.layers.vegetation),
    layer(ASSETS.garden.path,'path',layout.layers.path),
    layer(ASSETS.garden.trunk,'trunk',layout.layers.trunk),
    layer(ASSETS.garden.canopy,'canopy',layout.layers.canopy),
    layer(ASSETS.garden.growth[stage],'bloom',layout.layers.bloom)
  ].join('');
}

export function renderScene({state,header,icon,esc,detailPanel,modal}){
  const scene=state.scene==='home'?'home':'garden';
  const layout=SCENE_LAYOUT[scene];
  const maps=state.mappings;
  const photos=maps.filter(m=>['flower','petal','leaf'].includes(m.imageryType));
  const branches=maps.filter(m=>m.imageryType==='branch');
  const records=maps.filter(m=>m.imageryType==='record');
  const plants=maps.filter(m=>m.imageryType==='plant');
  const positionedPhotos=stableZonePositions(photos,layout.treeCrownZones);
  const positionedBranches=stableZonePositions(branches,layout.branchZones);
  const stage=photos.length<=3?'buds':photos.length<=9?'early-bloom':'full-bloom';
  const name=scene==='home'?CONTENT.scenes.home:CONTENT.scenes.garden;
  const petState=state.quiet||maps.length===0?'rest':state.motionCue?.type==='alignment'?'celebrate':state.motionCue?'active':'curious';
  const monument=state.monument;
  const phantom=state.align?.unresolved===true&&!monument;

  return `${header(true)}<main id="main" class="scene-page illustrated ${scene}-scene ${state.veil?'veiled':''} ${state.reduceMotion?'reduced-motion':''} ${plants.length?'has-environment-shift':''}" tabindex="-1">
    <div class="scene-viewport">
      <div class="scene-canvas" aria-label="${esc(name)}意象场景" tabindex="0">
        ${sceneLayers(scene,layout,stage)}
        ${positionedPhotos.map(m=>imageryButton(m,'图片意象：'+m.title,m.imageryType==='leaf'?ASSETS.garden.leaf:ASSETS.garden.flower,m.imageryType,esc,m.layoutPoint,m.imageryType==='petal'?.72:1)).join('')}
        ${positionedBranches.map(m=>imageryButton(m,'心愿枝叶：'+m.title,ASSETS.garden.leaf,'branch',esc,m.layoutPoint,.92)).join('')}
        ${plants.map((m,i)=>imageryButton(m,'植物与光影变化：'+m.title,ASSETS.garden.leaf,'plant',esc,{x:.18+i*.055,y:.72},.8)).join('')}
        <button type="button" class="scene-hit grounded gramophone ${state.playing?'is-playing':''}" data-action="toggle-gramophone" data-id="gramophone" data-gramophone aria-label="记忆留声机${state.playing?'，正在播放':''}" aria-pressed="${state.playing===true}" style="${anchorStyle(layout.gramophone)}">${art(ASSETS.audio.gramophone,'object-art')}${state.currentDiscId?art(ASSETS.audio.record,'loaded-disc'):''}<span class="scene-hit-label">记忆留声机</span></button>
        ${recordCollection(records,layout,esc,state.currentDiscId)}
        ${petState==='celebrate'?`<button type="button" class="scene-hit grounded pet pet-celebrate" data-action="open-pets" data-id="pets" data-pet aria-label="查看双人桌宠共同庆祝的近期变化" style="${anchor(layout.pets[0],`--w:${layout.pets[0].w+layout.pets[1].w}px;--mw:${layout.pets[0].mw+layout.pets[1].mw}px`)}">${art(ASSETS.pets.celebrate,'object-art')}</button>`:`<button type="button" class="scene-hit grounded pet pet-a" data-action="open-pets" data-id="pet-a" data-pet aria-label="查看双人桌宠近期变化" style="${anchor(layout.pets[0])}">${art(ASSETS.pets.a[petState],'object-art')}</button><button type="button" class="scene-hit grounded pet pet-b" data-action="open-pets" data-id="pet-b" data-pet aria-label="查看双人桌宠近期变化" style="${anchor(layout.pets[1])}">${art(ASSETS.pets.b[petState],'object-art')}</button>`}
        ${monument?`<button type="button" class="scene-hit grounded memorial" data-action="open-memorial" data-id="${esc(monument.latestAlignmentId)}" data-memorial data-alignment-id="${esc(monument.latestAlignmentId)}" aria-label="查看对齐纪念" style="${anchorStyle(layout.memorial)}">${art(ASSETS.memorial.base,'object-art')}${art(ASSETS.memorial.light,'object-art memorial-mark mark-light')}${monument.marks.slice(1).map((mark,i)=>art(i%2?ASSETS.memorial.repair:ASSETS.memorial.ring,'object-art memorial-mark')).join('')}<span class="scene-hit-label">对齐纪念</span></button>`:''}
        ${phantom?`<button type="button" class="scene-hit grounded phantom" data-action="open-phantom" data-id="phantom" data-phantom aria-label="查看尚未完成的理解差异" style="${anchorStyle(layout.phantom)}">${art(ASSETS.phantom.idle,'object-art phantom-idle')}${art(ASSETS.phantom.focus,'object-art phantom-focus')}<span class="scene-hit-label">尚未完成的理解差异</span></button>`:''}
        ${state.veil?`<picture class="layer veil-layer" aria-hidden="true"><source media="(max-width:767px)" srcset="${assetRoot+ASSETS.veil.mobile}"><img src="${assetRoot+ASSETS.veil.desktop}" alt="" decoding="async"></picture>`:''}
      </div>
      <div class="scene-control-shell ${state.sceneControlsOpen?'is-open':''}" data-scene-controls>
        <button type="button" class="scene-control-trigger" data-scene-control-trigger aria-expanded="${state.sceneControlsOpen===true}" aria-controls="scene-control-panel" aria-label="${state.sceneControlsOpen?'关闭':'打开'}场景控制" title="场景控制">
          ${icon('move')}<span>场景控制</span>
        </button>
        <button type="button" class="scene-control-scrim" data-scene-control-dismiss aria-label="关闭场景控制" tabindex="-1" ${state.sceneControlsOpen?'':'hidden'}></button>
        <section id="scene-control-panel" class="scene-control-panel" aria-label="场景漫游控制" ${state.sceneControlsOpen?'':'hidden'}>
          <div class="scene-control-head" data-scene-control-drag>
            <span class="scene-control-handle" aria-hidden="true"></span>
            <strong>探索控制</strong>
            <button type="button" class="scene-control-close" data-scene-control-close aria-label="关闭场景控制" title="关闭">${icon('close')}</button>
          </div>
          <div class="direction-pad" aria-label="移动场景">
            <button type="button" class="direction-up" data-camera="up" aria-label="向上移动场景" title="向上（↑ / W）">${icon('up')}<span>向上</span></button>
            <button type="button" class="direction-left" data-camera="left" aria-label="向左移动场景" title="向左（← / A）">${icon('left')}<span>向左</span></button>
            <button type="button" class="direction-reset" data-camera="reset" aria-label="复位场景视角" title="复位（R）">${icon('reset')}<span>复位</span></button>
            <button type="button" class="direction-right" data-camera="right" aria-label="向右移动场景" title="向右（→ / D）">${icon('right')}<span>向右</span></button>
            <button type="button" class="direction-down" data-camera="down" aria-label="向下移动场景" title="向下（↓ / S）">${icon('down')}<span>向下</span></button>
          </div>
          <div class="scene-control-secondary">
            <button type="button" data-camera="zoom-in" aria-label="放大场景" title="放大（+）">${icon('plus')}<span>放大</span></button>
            <button type="button" data-camera="zoom-out" aria-label="缩小场景" title="缩小（-）">${icon('minus')}<span>缩小</span></button>
            <button type="button" class="motion-preference" data-motion-toggle aria-label="减少动态效果" aria-pressed="${state.reduceMotion===true}" title="减少动态效果">${icon('motion')}<span>减少动态效果</span><b>${state.reduceMotion?'已开启':'未开启'}</b></button>
          </div>
          <p class="scene-control-hint">方向键或 WASD 移动，+ / − 缩放，R 复位</p>
        </section>
      </div>
    </div>
    <section class="scene-note card"><h1>${esc(name)}</h1><p>${maps.length?`演示数据：${photos.length} 个图片意象、${branches.length} 个心愿枝叶、${records.length} 张唱片。`:'当前关系组在此场景暂无已映射意象。'}</p><div class="scene-note-actions"><button type="button" class="text-button" data-why>为什么出现这个变化？</button><button type="button" class="text-button" data-quiet aria-pressed="${state.quiet===true}">${state.quiet?'唤醒桌宠':'让桌宠休眠'}</button></div></section>
    ${audioPlayer(state,records,esc)}
    ${state.selected?detailPanel():''}${state.modal?modal():''}
  </main>`;
}
