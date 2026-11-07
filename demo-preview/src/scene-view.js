import {ASSETS,assetRoot} from './asset-paths.js';
import {CONTENT} from './content.js';
const base=assetRoot;
const art=(file,cls,alt='')=>`<img class="${cls}" src="${base+file}" alt="${alt}" decoding="async" width="1254" height="1254">`;
const obj=(id,label,file,cls,escape)=>`<button class="scene-hit ${cls}" data-object="${escape(id)}" aria-label="${escape(label)}">${art(file,'object-art','')}<span class="scene-hit-label">${escape(label)}</span></button>`;
export function renderScene({state,header,icon,esc,detailPanel,modal}){
 const home=state.scene==='home', maps=state.mappings;
 const flowers=maps.filter(m=>m.type==='flower'||m.type==='leaf');
 const branches=maps.filter(m=>m.type==='branch');
 const discs=maps.filter(m=>m.type==='record');
 const alignReady=state.align?.participants?.every(p=>p.submitted&&p.reviewed);
 const stage=flowers.length<=3?'buds':flowers.length<=9?'early-bloom':'full-bloom';
 const name=home?CONTENT.scenes.home:CONTENT.scenes.garden;
 const back=home?ASSETS.home.sky:ASSETS.garden.sky;
 const petState=state.quiet?'rest':maps.length?'curious':'rest';
 return `${header(true)}<main id="main" class="scene-page illustrated ${home?'home-scene':'garden-scene'} ${state.veil?'veiled':''}" tabindex="-1">
 <div class="scene-canvas" aria-label="${name}意象场景">
   ${art(back,'layer sky')}
   ${home?
    art(ASSETS.home.wall,'layer home-wall')+
    art(ASSETS.home.house,'layer house')+
    art(ASSETS.home.trunk,'layer home-trunk')+
    art(ASSETS.home.canopy,'layer home-canopy')+
    art(ASSETS.home.windowsill,'layer windowsill')+
    art(ASSETS.home.table,'layer table')+
    art(ASSETS.home.photoRack,'layer photo-rack')
   :art(ASSETS.garden.vegetation,'layer vegetation')+
    art(ASSETS.garden.path,'layer path')+
    art(ASSETS.garden.trunk,'layer trunk')+
    art(ASSETS.garden.canopy,'layer canopy')+
    art(ASSETS.garden.growth[stage],'layer bloom')}
   ${art(ASSETS.audio.gramophone,'layer gramophone')}
   ${art(ASSETS.audio.rack,'layer rack')}
   ${flowers.slice(0,10).map((m,i)=>obj(m.id,'照片意象：'+m.title,m.type==='leaf'?ASSETS.garden.leaf:ASSETS.garden.flower,'flower flower-'+i,esc)).join('')}
   ${branches.slice(0,6).map((m,i)=>obj(m.id,'心愿枝叶：'+m.title,ASSETS.garden.leaf,'branch branch-'+i,esc)).join('')}
   ${discs.slice(0,4).map((m,i)=>obj(m.id,'记忆唱片：'+m.title,ASSETS.audio.record,'disc disc-'+i,esc)).join('')}
   <button class="scene-hit pet pet-a" data-pet aria-label="查看双人桌宠状态">${art(ASSETS.pets.a[petState],'object-art')}</button>
   <button class="scene-hit pet pet-b" data-pet aria-label="查看双人桌宠状态">${art(ASSETS.pets.b[petState],'object-art')}</button>
   ${alignReady?`<button class="scene-hit memorial" data-memorial aria-label="查看双方确认的对齐纪念物">${art(ASSETS.memorial.base,'object-art')}${art(ASSETS.memorial.light,'object-art light')}</button>`:''}
   ${!alignReady&&state.align?`<button class="scene-hit phantom" data-phantom aria-label="查看尚未完成的理解差异">${art(ASSETS.phantom.idle,'object-art')}</button>`:''}
   ${art(ASSETS.garden.foregroundLeft,'layer foreground-left')}
   ${art(ASSETS.garden.foregroundRight,'layer foreground-right')}
   ${state.veil?art(ASSETS.veil.desktop,'layer veil-layer'):''}
 </div>
 <nav class="scene-switcher card" aria-label="场景切换"><button data-scene="garden" aria-current="${!home?'page':'false'}">花园</button><button data-scene="home" aria-current="${home?'page':'false'}">老屋·庭院</button></nav>
 <section class="scene-note card"><h1>${name}</h1><p>${maps.length?`当前关系组有 ${flowers.length} 个图片意象、${branches.length} 个心愿枝叶、${discs.length} 张唱片。`:'当前关系组暂无已映射意象。添加并确认记录后，场景才会生长。'}</p><button class="text-button" data-why>为什么出现这个变化？</button></section>
 <section class="record-shelf card"><h2>记忆唱片</h2>${discs.length?`<div class="records">${discs.map(m=>`<button class="record-disc" data-object="${esc(m.id)}" aria-label="选择唱片：${esc(m.title)}">${art(ASSETS.audio.record,'record-image')}<span>${esc(m.title)}</span></button>`).join('')}</div><button class="btn small" data-play>${icon(state.playing?'pause':'play')}${state.playing?'暂停':'播放所选唱片'}</button><label>唱片音量 <input type="range" min="0" max="100" value="${state.audioVolume??50}" data-volume></label><button class="btn small" data-caption>字幕${state.captions===false?'关':'开'}</button>`:'<p>暂无已映射音频。</p>'}</section>
 <div class="pet-status card"><span>双人桌宠：${state.quiet?'休眠':'休息 / 好奇'}</span><button class="btn small" data-quiet>${state.quiet?'唤醒':'一键休眠'}</button></div>
 <button class="fixed-archive" data-tab="archive">${icon('book')}查看文字档案与对齐记录${icon('arrow')}</button>
 ${state.selected?detailPanel():''}${state.modal?modal():''}
 </main>`;
}

