export const DESIGN_CANVAS={width:1440,height:900};

// All positions use the 1440 × 900 internal canvas. Anchored objects use a
// bottom-centre visual anchor; mobile positions keep controls inside the
// horizontally cropped cover view.
export const SCENE_LAYOUT={
  garden:{
    groundBaseline:790,
    midgroundHorizon:555,
    layers:{
      sky:{x:0,y:0,w:1440,h:900,fit:'cover'},
      // The source PNG has substantial transparent space below and above the
      // visible fence. Top anchoring preserves the visible bottom edge at the
      // same y as the distant grass in `path` (about design y=555).
      vegetation:{x:-30,y:5,w:1500,h:550,fit:'cover',position:'center top'},
      path:{x:0,y:45,w:1440,h:960,fit:'cover',position:'center bottom'},
      trunk:{x:205,y:70,w:560,h:735},
      canopy:{x:5,y:-90,w:1090,h:655},
      bloom:{x:5,y:-90,w:1090,h:655}
    },
    treeCrownZones:[
      {x:.29,y:.29},{x:.37,y:.22},{x:.45,y:.31},{x:.25,y:.38},
      {x:.51,y:.24},{x:.38,y:.39},{x:.20,y:.27},{x:.48,y:.42}
    ],
    branchZones:[{x:.34,y:.43},{x:.43,y:.38},{x:.28,y:.47},{x:.49,y:.48}],
    gramophone:{x:1082,y:758,w:185,mx:900,my:748,mw:110,artScale:1.34,artX:0,artY:7},
    collection:{x:1242,y:770,w:186,mx:900,my:500,mw:105},
    pets:[
      {x:575,y:797,w:150,mx:625,my:794,mw:142,artScale:1.28,artY:8},
      {x:710,y:797,w:150,mx:760,my:794,mw:142,artScale:1.28,artY:8}
    ],
    // Tree-root memorial: visually larger than one pet, but kept behind the
    // pet group and clear of the gramophone/record collection.
    memorial:{x:900,y:790,w:180,mx:540,my:792,mw:160,artScale:1.30,artY:2},
    phantom:{x:900,y:780,w:132,mx:900,my:785,mw:118,artScale:1.3,artY:6}
  },
  home:{
    groundBaseline:790,
    midgroundHorizon:610,
    layers:{
      sky:{x:0,y:0,w:1440,h:900,fit:'cover'},
      wall:{x:0,y:0,w:1440,h:705,fit:'cover',position:'center top'},
      ground:{x:0,y:195,w:1440,h:805,fit:'cover',position:'center bottom'},
      house:{x:18,y:110,w:720,h:650},
      trunk:{x:500,y:30,w:480,h:760},
      canopy:{x:280,y:-105,w:1080,h:620},
      table:{x:330,y:570,w:560,h:330}
    },
    treeCrownZones:[
      {x:.48,y:.24},{x:.56,y:.20},{x:.63,y:.28},{x:.44,y:.34},
      {x:.68,y:.22},{x:.58,y:.36},{x:.51,y:.31},{x:.66,y:.37}
    ],
    branchZones:[{x:.52,y:.40},{x:.62,y:.39},{x:.47,y:.45},{x:.67,y:.44}],
    gramophone:{x:1090,y:752,w:180,mx:900,my:748,mw:110,artScale:1.34,artX:0,artY:7},
    collection:{x:1248,y:770,w:180,mx:900,my:500,mw:105},
    pets:[
      {x:670,y:802,w:148,mx:640,my:798,mw:138,artScale:1.28,artY:8},
      {x:804,y:802,w:148,mx:770,my:798,mw:138,artScale:1.28,artY:8}
    ],
    // Yard-tree side grass. The stronger visual scale compensates for the
    // source PNG's generous alpha padding while its foot remains at y=790.
    memorial:{x:925,y:790,w:165,mx:535,my:792,mw:155,artScale:1.30,artY:2},
    phantom:{x:955,y:784,w:130,mx:900,my:790,mw:116,artScale:1.3,artY:6}
  }
};

const hashOf=value=>{
  let hash=2166136261;
  for(const char of String(value))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
  return hash;
};

export function stableZonePositions(items,zones){
  const used=new Set();
  return items.map(item=>{
    const seed=hashOf(item.sourceRecordId);
    let index=seed%zones.length;
    for(let step=0;step<zones.length&&used.has(index);step++)index=(index+1)%zones.length;
    used.add(index);
    const zone=zones[index];
    // Small deterministic jitter keeps larger groups organic without changing
    // after refresh. The clamp stays inside the declared crown region.
    const dx=((seed>>>8)%9-4)/1000;
    const dy=((seed>>>16)%7-3)/1000;
    return {...item,layoutPoint:{x:zone.x+dx,y:zone.y+dy}};
  });
}

export const layerStyle=box=>[
  `--x:${box.x}px`,`--y:${box.y}px`,`--w:${box.w}px`,`--h:${box.h}px`,
  `--fit:${box.fit||'contain'}`,`--object-position:${box.position||'center'}`
].join(';');

export const anchorStyle=slot=>[
  `--x:${slot.x}px`,`--y:${slot.y}px`,`--w:${slot.w}px`,
  `--mx:${slot.mx??slot.x}px`,`--my:${slot.my??slot.y}px`,`--mw:${slot.mw??slot.w}px`,
  `--art-scale:${slot.artScale||1}`,`--art-x:${slot.artX||0}%`,`--art-y:${slot.artY||0}%`
].join(';');

