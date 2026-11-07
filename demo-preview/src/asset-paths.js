// Single source of truth for replaceable P0/P1 scene artwork.
// Paths are relative to assets/generated/source; see docs/runtime-asset-map.md.
export const ASSETS={
  garden:{
    sky:'garden/mg-garden-bg-sky-dawn@2x.png',
    vegetation:'garden/mg-garden-bg-vegetation@2x.png',
    path:'garden/mg-garden-mid-ground-path@2x.png',
    trunk:'garden/mg-garden-tree-trunk@2x.png',
    canopy:'garden/mg-garden-tree-canopy-base@2x.png',
    growth:{buds:'garden/mg-garden-tree-buds@2x.png','early-bloom':'garden/mg-garden-tree-early-bloom@2x.png','full-bloom':'garden/mg-garden-tree-full-bloom@2x.png'},
    flower:'garden/mg-garden-flower-memory-01-open@2x.png',
    leaf:'garden/mg-garden-leaf-memory-01@2x.png',
    foregroundLeft:'garden/mg-garden-foreground-hydrangea-left@2x.png',
    foregroundRight:'garden/mg-garden-foreground-leaves-right@2x.png'
  },
  home:{
    sky:'home/mg-home-bg-sky-dawn@2x.png',
    wall:'home/mg-home-bg-wall-mountain@2x.png',
    house:'home/mg-home-mid-house-main@2x.png',
    trunk:'home/mg-home-mid-yard-tree-trunk@2x.png',
    canopy:'home/mg-home-mid-yard-tree-canopy@2x.png',
    windowsill:'home/mg-home-mid-windowsill@2x.png',
    table:'home/mg-home-mid-dining-table@2x.png',
    photoRack:'home/mg-home-mid-photo-rack@2x.png'
  },
  audio:{
    gramophone:'audio/mg-audio-gramophone-body@2x.png',
    rack:'audio/mg-audio-record-rack@2x.png',
    record:'audio/mg-audio-record-black-01@2x.png'
  },
  pets:{
    a:{rest:'pets/pet-a-rest.png',curious:'pets/pet-a-curious.png',active:'pets/pet-a-active.png'},
    b:{rest:'pets/pet-b-rest.png',curious:'pets/pet-b-curious.png',active:'pets/pet-b-active.png'},
    celebrate:'pets/pets-celebrate.png'
  },
  memorial:{base:'memorial/alignment-memorial-base.png',light:'memorial/alignment-memorial-light.png',ring:'memorial/alignment-memorial-ring.png',repair:'memorial/alignment-memorial-repair-texture.png'},
  phantom:{idle:'phantom/knot-phantom-idle.png',focus:'phantom/knot-phantom-focus.png'},
  veil:{desktop:'veil/memory-veil-desktop.png',mobile:'veil/memory-veil-mobile.png'}
};
export const assetRoot=new URL('../assets/generated/source/',import.meta.url).href;

