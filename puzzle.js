import {rasterToZpl,applyPrintSettings} from './converter.js?v=native-v9';
import {applyMedia} from './media.js?v=native-v9';
export function puzzleLayout(width,height,rows,cols){
 if(![width,height,rows,cols].every(Number.isInteger)||width<1||height<1||rows<1||rows>10||cols<1||cols>10)throw new Error('Usa de 1 a 10 filas y de 1 a 10 columnas.');
 if(width*height*rows*cols>16000000)throw new Error('El rompecabezas supera los 16 millones de puntos. Reduce filas, columnas, tamaño o resolución.');
 return {width:width*cols,height:height*rows,tiles:Array.from({length:rows*cols},(_,i)=>({row:Math.floor(i/cols)+1,col:i%cols+1,x:(i%cols)*width,y:Math.floor(i/cols)*height,width,height}))};
}
export function fitImage(sw,sh,dw,dh,fit){
 if(![sw,sh,dw,dh].every(n=>Number.isFinite(n)&&n>0)||!['contain','cover'].includes(fit))throw new Error('Ajuste de imagen inválido.');
 const scale=(fit==='cover'?Math.max:Math.min)(dw/sw,dh/sh);
 return {x:(dw-sw*scale)/2,y:(dh-sh*scale)/2,width:sw*scale,height:sh*scale};
}
export function buildPuzzle(source,preview,options){
 const {width,height,rows,cols,fit,threshold,invert,mode,copies,speed,media,thermal={}}=options;
 const layout=puzzleLayout(width,height,rows,cols);
 const canvas=document.createElement('canvas');canvas.width=layout.width;canvas.height=layout.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);
 const rect=fitImage(source.width,source.height,canvas.width,canvas.height,fit);
 // Convert the whole artwork once so error diffusion continues across tile borders.
 const image=document.createElement('canvas');image.width=canvas.width;image.height=canvas.height;
 const ic=image.getContext('2d',{willReadFrequently:true});ic.drawImage(source,rect.x,rect.y,rect.width,rect.height);
 const raster=rasterToZpl(ic.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,threshold,invert,mode);
 ctx.putImageData(new ImageData(raster.preview,canvas.width,canvas.height),0,0);
 // Keep empty fitting margins white even when the image is inverted.
 if(fit==='contain'){
  const left=Math.max(0,Math.round(rect.x)),top=Math.max(0,Math.round(rect.y));
  ctx.fillStyle='white';if(left){ctx.fillRect(0,0,left,canvas.height);ctx.fillRect(canvas.width-left,0,left,canvas.height);}if(top){ctx.fillRect(0,0,canvas.width,top);ctx.fillRect(0,canvas.height-top,canvas.width,top);}
 }
 const jobs=layout.tiles.map(tile=>{
  const result=rasterToZpl(ctx.getImageData(tile.x,tile.y,width,height).data,width,height);
  return applyMedia(applyPrintSettings(result.zpl,copies,speed,thermal),media);
 });
 preview.width=canvas.width;preview.height=canvas.height;const p=preview.getContext('2d');p.drawImage(canvas,0,0);
 // Guides belong only to the on-screen preview, never to the exported artwork.
 p.strokeStyle='#278163';p.lineWidth=Math.max(1,Math.round(canvas.width/600));p.font=`bold ${Math.max(12,Math.round(width/18))}px sans-serif`;p.textBaseline='top';
 for(const tile of layout.tiles){p.strokeRect(tile.x+.5,tile.y+.5,width-1,height-1);const text=`${tile.row} · ${tile.col}`;const fontSize=Math.max(12,Math.round(width/18));const labelWidth=p.measureText(text).width+8;p.fillStyle='#207f5f';p.fillRect(tile.x+4,tile.y+4,labelWidth,fontSize+6);p.fillStyle='white';p.fillText(text,tile.x+8,tile.y+6);}
 return {zpl:jobs.join('\n'),count:layout.tiles.length,layout};
}
