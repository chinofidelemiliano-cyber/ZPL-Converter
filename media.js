export function mediaSettings(mode,gapMm,labelHeightMm,dpi){
 if(!['gap','continuous','printer'].includes(mode))throw new Error('Selecciona un tipo de material válido.');
 if(mode==='gap'&&(!Number.isFinite(gapMm)||gapMm<=0||gapMm>25))throw new Error('El gap medido debe ser mayor que 0 y de hasta 25 mm.');
 const gap=mode==='gap'?gapMm:0;
 return {mode,gapMm:gap,pitchMm:labelHeightMm+gap,gapDots:Math.round(gap*dpi/25.4)};
}
export function applyMedia(zpl,mode){
 if(!['gap','continuous','printer'].includes(mode))throw new Error('Tipo de material inválido.');
 return zpl.replace('^XA\n','^XA\n'+(mode==='gap'?'^MNY\n':mode==='continuous'?'^MNN\n':''));
}
