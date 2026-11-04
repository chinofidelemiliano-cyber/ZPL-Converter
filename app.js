import {rasterToZpl,applyPrintSettings} from './converter.js?v=native-v3';
import {drawEditor,initEditor,useEditorFont,addEditorElement} from './editor.js?v=native-v3';
import {initUnits,readMm,fromMm,unitLabel,writeMm} from './units.js?v=native-v3';
import {mediaSettings,applyMedia} from './media.js?v=native-v3';
import {buildPuzzle} from './puzzle.js?v=native-v3';
import {initGallery} from './gallery.js?v=native-v3';
const $=id=>document.getElementById(id);
let source=null,request=0,activeTab="image";
initUnits(render);
function status(message){$('status').textContent=message;}
function clear(){ $('puzzle-summary').textContent='';$('element-commands').textContent=''; $('code').value='';$('copy').disabled=$('download').disabled=true;$('preview').hidden=true;$('empty').hidden=false; }
function render(){
 updateStock();
 $('thresholdValue').textContent=$('threshold').value;
 try{
 const mmW=readMm('width'),mmH=readMm('height'),dpi=Number($('dpi').value);
 if(mmW<1||mmW>200||mmH<1||mmH>300||!Number.isFinite(mmW+mmH))throw new Error('Usa un ancho entre 1 y 200 mm y un alto entre 1 y 300 mm.');
 const w=Math.round(mmW*dpi/25.4),h=Math.round(mmH*dpi/25.4);
 $('pw').value=w;$('ll').value=h;
 if(w*h>16000000)throw new Error('La etiqueta es demasiado grande. Reduce el tamaño o la resolución.');
 const media=mediaSettings($('media').value,readMm('gap'),mmH,dpi);
 const copies=Number($('copies').value),speed=$('speed').value===''?'':Number($('speed').value);
 if(!source&&activeTab!=='editor')return;
 const canvas=$('preview');
 if(activeTab==='puzzle'){
  const rows=Number($('puzzle-rows').value),cols=Number($('puzzle-cols').value);
  const result=buildPuzzle(source,canvas,{width:w,height:h,rows,cols,fit:$('puzzle-fit').value,threshold:Number($('threshold').value),invert:$('invert').checked,mode:$('mode').value,copies,speed,media:media.mode});
  $('code').value=result.zpl;canvas.hidden=false;$('empty').hidden=true;$('copy').disabled=$('download').disabled=false;
  const fmt=mm=>Number(fromMm(mm,$('units').value).toFixed(4));
  $('dimensions').textContent=`${rows} × ${cols} · ${result.count} piezas`;
  $('info').textContent=`Cada pieza: ${fmt(mmW)} × ${fmt(mmH)} ${unitLabel()} · ${dpi} dpi`;
  $('puzzle-summary').textContent=`Imagen armada: ${fmt(mmW*cols)} × ${fmt(mmH*rows)} ${unitLabel()}. ${result.count} piezas distintas × ${copies} copias = ${result.count*copies} etiquetas. Avance estimado del rollo: ${fmt(media.pitchMm*result.count*copies)} ${unitLabel()}${media.mode==='printer'?' (sin incluir separaciones desconocidas)':''}.`;
  status('Rompecabezas listo. El archivo ZPL incluye todas las piezas en orden.');return;
 }
 canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,w,h);
 let nativeZpl;
 if(activeTab==="editor"){
 nativeZpl=drawEditor(ctx,dpi,w,h);
 }else{
 const scale=Math.min(w/source.width,h/source.height),iw=Math.max(1,Math.round(source.width*scale)),ih=Math.max(1,Math.round(source.height*scale));
 const imageCanvas=document.createElement('canvas');imageCanvas.width=iw;imageCanvas.height=ih;
 const imageCtx=imageCanvas.getContext('2d',{willReadFrequently:true});imageCtx.drawImage(source,0,0,iw,ih);
 const raster=rasterToZpl(imageCtx.getImageData(0,0,iw,ih).data,iw,ih,Number($('threshold').value),$('invert').checked,$('mode').value);
 imageCtx.putImageData(new ImageData(raster.preview,iw,ih),0,0);ctx.drawImage(imageCanvas,Math.floor((w-iw)/2),Math.floor((h-ih)/2));
 }
 const zpl=activeTab==='editor'?nativeZpl:rasterToZpl(ctx.getImageData(0,0,w,h).data,w,h).zpl;
 if(typeof zpl!=='string')throw new Error('No se pudo generar ZPL nativo.');
 $('code').value=applyMedia(applyPrintSettings(zpl,copies,speed),media.mode);$('preview').hidden=false;$('empty').hidden=true;
 $('copy').disabled=$('download').disabled=false;$('dimensions').textContent=`${w} × ${h} dots`;
 $('info').textContent=`${Number(fromMm(mmW,$('units').value).toFixed(4))} × ${Number(fromMm(mmH,$('units').value).toFixed(4))} ${unitLabel()} · ${dpi} dpi · ${$('copies').value} etiqueta(s)`;status('Conversión lista. Puedes copiar o descargar el código.');
 }catch(error){clear();status(error.message);}
}
async function load(file){
 if(!file)return;
 const id=++request;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)){status('Selecciona una imagen PNG, JPG o WEBP.');return;}
 if(file.size>20*1024*1024){status('La imagen debe pesar menos de 20 MB.');return;}
 try{const bitmap=await createImageBitmap(file);if(id!==request){bitmap.close();return;}
 if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error('La imagen supera los 40 megapíxeles. Reduce su tamaño.');}
 source?.close();source=bitmap;$('filename').textContent=file.name;render();
 }catch(error){status('No se pudo cargar la imagen. '+error.message);}
}
$('file').addEventListener('change',e=>load(e.target.files[0]));
for(const id of ['width','height','dpi','threshold','invert','mode','copies','speed','media','gap','puzzle-rows','puzzle-cols','puzzle-fit'])$(id).addEventListener('input',render);
for(const event of ['dragover','dragleave','drop'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.toggle('dragging',event==='dragover');if(event==='drop')load(e.dataTransfer.files[0]);});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('code').value);status('Código copiado.');}catch{ $('code').select();status('Selecciona y copia el código con Ctrl+C o Cmd+C.');}});
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([$('code').value],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=activeTab==='puzzle'?'rompecabezas.zpl':'etiqueta.zpl';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Archivo ZPL descargado.');});

for(const [id,measurement] of [['pw','width'],['ll','height']])$(id).addEventListener('input',()=>{
 const dots=$(id).value===''?NaN:Number($(id).value);writeMm(measurement,Number.isInteger(dots)?dots*25.4/Number($('dpi').value):NaN);render();
});
initEditor(render,status);
const routes={image:'/index.html',editor:'/editor.html',puzzle:'/rompecabezas.html',gallery:'/fuentes.html'};
const sections={image:['Imagen a ZPL','Convierte tus imágenes a blanco y negro o grises con puntos.'],editor:['Crea tu etiqueta desde cero','Texto, QR, códigos de barras y recuadros con comandos ZPL nativos.'],puzzle:['Rompecabezas de etiquetas','Divide una imagen completa en piezas para imprimir y ensamblar.'],gallery:['Fuentes y muestrario','Explora fuentes residentes y elementos para tu impresora Zebra.']};
function switchTab(tab,navigate=true){
 if(navigate&&location.pathname!==routes[tab])history.pushState({section:tab},'',routes[tab]);
 document.body.dataset.page=tab;document.title=sections[tab][0]+' · Label Studio';$('section-title').textContent=sections[tab][0];$('section-description').textContent=sections[tab][1];

 for(const t of ['image','editor','puzzle','gallery']){ $('tab-'+t).classList.toggle('active',t===tab);$('tab-'+t).setAttribute('aria-pressed',String(t===tab));if(t===tab)$('tab-'+t).setAttribute('aria-current','page');else $('tab-'+t).removeAttribute('aria-current'); }
 $('gallery').hidden=tab!=='gallery';$('workspace').hidden=tab==='gallery';
 if(tab==='gallery')return;
 activeTab=tab;
 $('image-tools').hidden=$('image-adjustments').hidden=!['image','puzzle'].includes(tab);$('editor-tools').hidden=tab!=='editor';$('puzzle-tools').hidden=tab!=='puzzle';
 if(tab==='editor')$('zpl-output').open=true;
 $('preview-note').textContent=tab==='editor'?'Vista previa aproximada. Las fuentes, sus tamaños y los códigos nativos los interpreta la impresora.':'Vista previa del mapa de bits.';
 $('copies').previousElementSibling.textContent=tab==='puzzle'?'Copias por pieza · ^PQ':'Cantidad de etiquetas · ^PQ';
 clear();render();if(tab!=='editor'&&!source)status('Carga una imagen para empezar.');
}
for(const tab of ['image','editor','puzzle','gallery'])$('tab-'+tab).addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();switchTab(tab);});
addEventListener('popstate',()=>switchTab(Object.keys(routes).find(key=>routes[key].replace('.html','')===location.pathname.replace('.html',''))||'image',false));
switchTab(document.body.dataset.page||'image',false);
initGallery(font=>{switchTab('editor');useEditorFont(font);},type=>{switchTab('editor');addEditorElement(type);});

function updateStock(){
 const mode=$('media').value;$('gap-field').hidden=mode!=='gap';$('gap-diagram').hidden=mode!=='gap';
 try{
  const settings=mediaSettings(mode,readMm('gap'),readMm('height'),Number($('dpi').value));
  const fmt=mm=>Number(fromMm(mm,$('units').value).toFixed(4));
  $('stock-summary').textContent=mode==='gap'?`Largo ${fmt(readMm('height'))} + gap ${fmt(settings.gapMm)} = paso ${fmt(settings.pitchMm)} ${unitLabel()}.`:mode==='continuous'?'Material continuo: el avance corresponde al largo de la etiqueta.':'Se conserva la configuración de material de la impresora; el gap físico no se estima.';
 }catch(error){$('stock-summary').textContent=error.message;}
}
