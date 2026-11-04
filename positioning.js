export function clampPosition(x,y,bounds,label){
 return {x:Math.max(0,Math.min(Math.max(0,label.width-bounds.width),x)),y:Math.max(0,Math.min(Math.max(0,label.height-bounds.height),y))};
}
export function alignedPosition(bounds,label,horizontal,vertical){
 const x=horizontal==='left'?0:horizontal==='right'?label.width-bounds.width:(label.width-bounds.width)/2;
 const y=vertical==='top'?0:vertical==='bottom'?label.height-bounds.height:(label.height-bounds.height)/2;
 return clampPosition(x,y,bounds,label);
}
export function hitTest(items,x,y){return [...items].reverse().find(item=>x>=item.x&&y>=item.y&&x<=item.x+item.width&&y<=item.y+item.height);}
export function initPositioning({scene,select,move,commit}){
 const $=id=>document.getElementById(id),canvas=$('preview'),outline=$('preview-selection'),target=$('preview-target');
 let drag=null,frame=0,pending=null,timer=0;
 const active=()=>document.body.dataset.page==='editor'&&!canvas.hidden;
 const enabled=()=>active()&&$('manual-position').checked;
 function refresh(){
  const state=scene(),items=active()?state.items:[];
  const signature=items.map(i=>i.id+':'+i.label).join('|');
  if(target.dataset.signature!==signature){target.dataset.signature=signature;target.replaceChildren();for(const item of items){const option=document.createElement('option');option.value=String(item.id);option.textContent=item.label;target.append(option);}}
  const item=items.find(i=>i.id===state.selected)||items[0];
  if(item)target.value=String(item.id);target.disabled=!items.length;
  for(const button of document.querySelectorAll('[data-align]'))button.disabled=!item;
  if(!item||!enabled()){outline.hidden=true;return;}
  const rect=canvas.getBoundingClientRect(),area=canvas.parentElement.getBoundingClientRect();
  outline.hidden=false;outline.style.left=rect.left-area.left+item.x*rect.width/canvas.width+'px';outline.style.top=rect.top-area.top+item.y*rect.height/canvas.height+'px';outline.style.width=item.width*rect.width/canvas.width+'px';outline.style.height=item.height*rect.height/canvas.height+'px';
  $('position-feedback').textContent=`${item.label} · X ${Math.round(item.x)}, Y ${Math.round(item.y)} dots`;
 }
 function applyPending(){frame=0;if(pending){move(pending.id,pending.x,pending.y,true);pending=null;refresh();}}
 target.addEventListener('change',()=>{select(Number(target.value));refresh();canvas.focus({preventScroll:true});});
 canvas.addEventListener('pointerdown',event=>{
  if(!enabled()||event.button!==0)return;
  const rect=canvas.getBoundingClientRect(),state=scene(),x=(event.clientX-rect.left)*canvas.width/rect.width,y=(event.clientY-rect.top)*canvas.height/rect.height;
  const item=hitTest(state.items,x,y);if(!item)return;
  event.preventDefault();clearTimeout(timer);select(item.id);canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
  drag={id:item.id,px:event.clientX,py:event.clientY,x:item.x,y:item.y};refresh();
 });
 canvas.addEventListener('pointermove',event=>{
  if(!drag||!enabled())return;
  const rect=canvas.getBoundingClientRect();pending={id:drag.id,x:drag.x+(event.clientX-drag.px)*canvas.width/rect.width,y:drag.y+(event.clientY-drag.py)*canvas.height/rect.height};
  if(!frame)frame=requestAnimationFrame(applyPending);
 });
 function finish(event){if(!drag)return;if(frame)cancelAnimationFrame(frame);applyPending();drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);commit();refresh();}
 canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
 canvas.addEventListener('keydown',event=>{
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!delta||!enabled())return;
  const state=scene(),item=state.items.find(i=>i.id===state.selected)||state.items[0];if(!item)return;
  event.preventDefault();const step=event.shiftKey?10:1;move(item.id,item.x+delta[0]*step,item.y+delta[1]*step,true);refresh();clearTimeout(timer);timer=setTimeout(()=>{commit();refresh();},140);
 });
 for(const button of document.querySelectorAll('[data-align]'))button.addEventListener('click',()=>{
  const state=scene(),item=state.items.find(i=>i.id===state.selected)||state.items[0];if(!item)return;
  const [h,v]=button.dataset.align.split('-'),position=alignedPosition(item,state,h,v);move(item.id,position.x,position.y,false);refresh();canvas.focus({preventScroll:true});
 });
 $('manual-position').addEventListener('change',refresh);
 const observer=new ResizeObserver(refresh);observer.observe(canvas);observer.observe(canvas.parentElement);
 return {refresh};
}
