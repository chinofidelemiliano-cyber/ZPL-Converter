const valid=(width,height,aspect)=>{if(![width,height,aspect].every(n=>Number.isFinite(n)&&n>0))throw new Error('Dimensiones del recorte inválidas.');};
export function centeredCrop(width,height,aspect){
 valid(width,height,aspect);const w=Math.min(width,height*aspect),h=w/aspect;
 return {x:(width-w)/2,y:(height-h)/2,width:w,height:h};
}
export function moveCrop(crop,x,y,width,height){
 return {...crop,x:Math.max(0,Math.min(width-crop.width,x)),y:Math.max(0,Math.min(height-crop.height,y))};
}
export function fitCrop(crop,width,height,aspect){
 valid(width,height,aspect);if(!crop)return centeredCrop(width,height,aspect);
 const cx=crop.x+crop.width/2,cy=crop.y+crop.height/2,w=Math.min(Math.sqrt(crop.width*crop.height*aspect),width,height*aspect),h=w/aspect;
 return moveCrop({width:w,height:h},cx-w/2,cy-h/2,width,height);
}
export function zoomCrop(crop,factor,width,height){
 if(!Number.isFinite(factor)||factor<=0)throw new Error('Zoom de recorte inválido.');
 const aspect=crop.width/crop.height,w=Math.min(width,height*aspect,Math.max(Math.min(width,height*aspect)*.02,crop.width*factor)),h=w/aspect;
 return moveCrop({width:w,height:h},crop.x+(crop.width-w)/2,crop.y+(crop.height-h)/2,width,height);
}
export function resizeCrop(crop,corner,point,width,height){
 const east=corner.includes('e'),south=corner.includes('s'),aspect=crop.width/crop.height;
 const anchor={x:east?crop.x:crop.x+crop.width,y:south?crop.y:crop.y+crop.height};
 const maxW=Math.min(east?width-anchor.x:anchor.x,(south?height-anchor.y:anchor.y)*aspect);
 const minW=Math.min(maxW,Math.max(1,Math.min(width,height)*.02));
 const w=Math.max(minW,Math.min(maxW,Math.max((point.x-anchor.x)*(east?1:-1),(point.y-anchor.y)*(south?1:-1)*aspect))),h=w/aspect;
 return {x:east?anchor.x:anchor.x-w,y:south?anchor.y:anchor.y-h,width:w,height:h};
}
export function initImageCrop({onChange,onBusy}){
 const $=id=>document.getElementById(id),canvas=$('crop-canvas'),mode=$('image-area-mode');
 let source=null,area=null,aspect=1,base=null,drag=null,pending=null,frame=0,timer=0;
 function corners(){return {nw:[area.x,area.y],ne:[area.x+area.width,area.y],sw:[area.x,area.y+area.height],se:[area.x+area.width,area.y+area.height]};}
 function draw(){
  $('crop-editor').hidden=!source||mode.value!=='crop';if(!source||!area||!base)return;
  const ctx=canvas.getContext('2d'),sx=canvas.width/source.width,sy=canvas.height/source.height,x=area.x*sx,y=area.y*sy,w=area.width*sx,h=area.height*sy;
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,0);ctx.fillStyle='rgba(15,35,26,.58)';ctx.fillRect(0,0,canvas.width,y);ctx.fillRect(0,y+h,canvas.width,canvas.height-y-h);ctx.fillRect(0,y,x,h);ctx.fillRect(x+w,y,canvas.width-x-w,h);
  const display=canvas.getBoundingClientRect(),scale=display.width?canvas.width/display.width:1,handle=10*scale;
  ctx.strokeStyle='#2cab79';ctx.lineWidth=2*scale;ctx.strokeRect(x,y,w,h);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=scale;
  for(const fraction of [1/3,2/3]){ctx.beginPath();ctx.moveTo(x+w*fraction,y);ctx.lineTo(x+w*fraction,y+h);ctx.moveTo(x,y+h*fraction);ctx.lineTo(x+w,y+h*fraction);ctx.stroke();}
  ctx.fillStyle='white';ctx.strokeStyle='#207f5f';for(const [cx,cy] of Object.values(corners())){ctx.fillRect(cx*sx-handle/2,cy*sy-handle/2,handle,handle);ctx.strokeRect(cx*sx-handle/2,cy*sy-handle/2,handle,handle);}
  $('crop-info').textContent=`Área de origen: ${Math.round(area.width)} × ${Math.round(area.height)} px · posición ${Math.round(area.x)}, ${Math.round(area.y)}. Proporción de la etiqueta: ${Number(aspect.toFixed(4))}:1.`;
 }
 function sync(next,nextAspect){
  if(!next)return;valid(next.width,next.height,nextAspect);
  if(source!==next){source=next;aspect=nextAspect;area=centeredCrop(source.width,source.height,aspect);base=document.createElement('canvas');const scale=Math.min(1,1000/Math.max(source.width,source.height));base.width=Math.max(1,Math.round(source.width*scale));base.height=Math.max(1,Math.round(source.height*scale));base.getContext('2d').drawImage(source,0,0,base.width,base.height);canvas.width=base.width;canvas.height=base.height;draw();}
  else if(Math.abs(aspect-nextAspect)>1e-10){aspect=nextAspect;area=fitCrop(area,source.width,source.height,aspect);draw();}
  else $('crop-editor').hidden=mode.value!=='crop';
 }
 const point=event=>{const rect=canvas.getBoundingClientRect();return {x:(event.clientX-rect.left)*source.width/rect.width,y:(event.clientY-rect.top)*source.height/rect.height};};
 function applyPending(){frame=0;if(!pending||!drag)return;const p=pending;pending=null;area=drag.corner?resizeCrop(drag.area,drag.corner,p,source.width,source.height):moveCrop(drag.area,drag.area.x+p.x-drag.point.x,drag.area.y+p.y-drag.point.y,source.width,source.height);draw();}
 canvas.addEventListener('pointerdown',event=>{
  if(!source||mode.value!=='crop'||event.button!==0)return;event.preventDefault();clearTimeout(timer);const p=point(event),rect=canvas.getBoundingClientRect();let corner=null;
  for(const [name,[x,y]] of Object.entries(corners()))if(Math.hypot((p.x-x)*rect.width/source.width,(p.y-y)*rect.height/source.height)<=14){corner=name;break;}
  if(!corner&&(p.x<area.x||p.x>area.x+area.width||p.y<area.y||p.y>area.y+area.height))area=moveCrop(area,p.x-area.width/2,p.y-area.height/2,source.width,source.height);
  drag={area:{...area},point:p,corner};canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});onBusy();draw();
 });
 canvas.addEventListener('pointermove',event=>{if(!drag)return;pending=point(event);if(!frame)frame=requestAnimationFrame(applyPending);});
 const finish=event=>{if(!drag)return;if(frame)cancelAnimationFrame(frame);applyPending();drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);onChange();};
 canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
 canvas.addEventListener('keydown',event=>{
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!delta||!area)return;event.preventDefault();const scale=event.shiftKey?10:1;
  area=moveCrop(area,area.x+delta[0]*Math.max(1,area.width/100)*scale,area.y+delta[1]*Math.max(1,area.height/100)*scale,source.width,source.height);onBusy();draw();clearTimeout(timer);timer=setTimeout(onChange,150);
 });
 mode.addEventListener('change',()=>{draw();onChange();});
 for(const [id,factor] of [['crop-zoom-in',.8],['crop-zoom-out',1.25]])$(id).addEventListener('click',()=>{if(!source)return;area=zoomCrop(area,factor,source.width,source.height);draw();onChange();});
 $('crop-center').addEventListener('click',()=>{if(!source)return;area=moveCrop(area,(source.width-area.width)/2,(source.height-area.height)/2,source.width,source.height);draw();onChange();});
 $('crop-reset').addEventListener('click',()=>{if(!source)return;area=centeredCrop(source.width,source.height,aspect);draw();onChange();});
 const observer=new ResizeObserver(()=>{if(source)draw();});observer.observe(canvas);
 return {sync,selection:()=>mode.value==='crop'&&area?{...area}:null};
}
