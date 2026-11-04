import {rasterToZpl,applyPrintSettings} from './converter.js?v=native-v10';
import {drawEditor,initEditor,useEditorFont,addEditorElement,editorPrintJob,editorHasContent,editorEmptyMessage,editorScene,selectEditorItem,moveEditorItem,commitEditorPosition} from './editor.js?v=native-v10';
import {initUnits,readMm,fromMm,unitLabel,writeMm} from './units.js?v=native-v10';
import {mediaSettings,applyMedia} from './media.js?v=native-v10';
import {buildPuzzle} from './puzzle.js?v=native-v10';
import {initGallery} from './gallery.js?v=native-v10';
import {installFieldHelp} from './field-help.js?v=native-v10';
import {initPositioning} from './positioning.js?v=native-v10';
import {currentPrinter,initPrinterCatalog} from './printer-ui.js?v=native-v10';
import {validatePrinter} from './printers.js?v=native-v10';
import {initZplViewer} from './zpl-viewer.js?v=native-v10';
import {initImageCrop} from './crop.js?v=native-v10';
import {initPreferences} from './preferences.js?v=native-v10';
const $=id=>document.getElementById(id);
let source=null,request=0,activeTab="image",positionController=null,cropController=null;
initUnits(render);
function status(message){$('status').textContent=message;}
function clear(){ $('puzzle-summary').textContent='';$('series-job-info').textContent='';$('series-job-info').hidden=true;$('sequence-preview').textContent='';$('element-commands').textContent=''; $('code').value='';$('copy').disabled=$('download').disabled=true;$('preview').hidden=true;$('empty').hidden=false; }
function render(options={}){
 if(!['image','editor','puzzle'].includes(activeTab))return;
 updateThermalUi();
 $('editor-error').hidden=true;
 updateStock();
 $('thresholdValue').textContent=$('threshold').value;
 try{
 const mmW=readMm('width'),mmH=readMm('height'),dpi=Number($('dpi').value);
 if(mmW<1||mmW>300||mmH<1||mmH>300||!Number.isFinite(mmW+mmH))throw new Error('Usa un ancho entre 1 y 300 mm y un alto entre 1 y 300 mm.');
 const w=Math.round(mmW*dpi/25.4),h=Math.round(mmH*dpi/25.4);
 $('pw').value=w;$('ll').value=h;
 if(w*h>16000000)throw new Error('La etiqueta es demasiado grande. Reduce el tamaño o la resolución.');
 if(source&&activeTab==='image')cropController?.sync(source,mmW/mmH);
 const media=mediaSettings($('media').value,readMm('gap'),mmH,dpi);
 const thermal={method:$('print-method').value,darkness:$('darkness-mode').value==='custom'?($('darkness').value===''?NaN:Number($('darkness').value)):'',ribbon:$('print-method').value==='direct'?'unknown':$('ribbon-type').value,handling:$('handling-mode').value};
 const copies=Number($('copies').value),speed=$('speed').value;
 if(!source&&activeTab!=='editor')return;
 if(activeTab==='editor'&&!editorHasContent()){clear();$('empty').querySelector('p').textContent=editorEmptyMessage();status(editorEmptyMessage());return;}
 validatePrinter(currentPrinter(),{width:mmW,dpi,speed});
 const canvas=$('preview');
 if(activeTab==='puzzle'){
  const rows=Number($('puzzle-rows').value),cols=Number($('puzzle-cols').value);
  const result=buildPuzzle(source,canvas,{width:w,height:h,rows,cols,fit:$('puzzle-fit').value,threshold:Number($('threshold').value),invert:$('invert').checked,mode:$('mode').value,copies,speed,media:media.mode,thermal});
  $('code').value=result.zpl;canvas.hidden=false;$('empty').hidden=true;$('copy').disabled=$('download').disabled=false;
  const fmt=mm=>Number(fromMm(mm,$('units').value).toFixed(4));
  $('dimensions').textContent=`${rows} × ${cols} · ${result.count} piezas`;
  $('info').textContent=`Cada pieza: ${fmt(mmW)} × ${fmt(mmH)} ${unitLabel()} · ${dpi} dpi`;
  $('puzzle-summary').textContent=`Imagen armada: ${fmt(mmW*cols)} × ${fmt(mmH*rows)} ${unitLabel()}. ${result.count} piezas distintas × ${copies} copias = ${result.count*copies} etiquetas. Avance estimado del rollo: ${fmt(media.pitchMm*result.count*copies)} ${unitLabel()}${media.mode==='printer'?' (sin incluir separaciones desconocidas)':''}.`;
  status('Rompecabezas listo. El archivo ZPL incluye todas las piezas en orden.');return;
 }
 canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,w,h);
 let nativeZpl,imageZpl;
 if(activeTab==="editor"){
 nativeZpl=drawEditor(ctx,dpi,w,h);
 }else{
 const selectedArea=cropController?.selection();
 const scale=Math.min(w/source.width,h/source.height),iw=selectedArea?w:Math.max(1,Math.round(source.width*scale)),ih=selectedArea?h:Math.max(1,Math.round(source.height*scale));
 const imageCanvas=document.createElement('canvas');imageCanvas.width=iw;imageCanvas.height=ih;
 const imageCtx=imageCanvas.getContext('2d',{willReadFrequently:true});if(selectedArea)imageCtx.drawImage(source,selectedArea.x,selectedArea.y,selectedArea.width,selectedArea.height,0,0,iw,ih);else imageCtx.drawImage(source,0,0,iw,ih);
 const raster=rasterToZpl(imageCtx.getImageData(0,0,iw,ih).data,iw,ih,Number($('threshold').value),$('invert').checked,$('mode').value);
 imageCtx.putImageData(new ImageData(raster.preview,iw,ih),0,0);ctx.drawImage(imageCanvas,Math.floor((w-iw)/2),Math.floor((h-ih)/2));if(selectedArea)imageZpl=raster.zpl;
 }
 const zpl=activeTab==='editor'?nativeZpl:imageZpl??rasterToZpl(ctx.getImageData(0,0,w,h).data,w,h).zpl;
 if(typeof zpl!=='string')throw new Error('No se pudo generar ZPL nativo.');
 if(options.interactive){$('preview').hidden=false;$('empty').hidden=true;$('copy').disabled=$('download').disabled=true;return;}
 const job=activeTab==='editor'?editorPrintJob(w,h,dpi,copies,speed,media.mode,thermal):{zpl:applyMedia(applyPrintSettings(zpl,copies,speed,thermal),media.mode),total:copies,hasSequence:false};
 $('code').value=job.zpl;$('series-job-info').hidden=!job.hasSequence;$('series-job-info').textContent=job.hasSequence?`${job.numbers} números distintos × ${copies} copias de cada uno = ${job.total} etiquetas. Se imprimen primero las copias de un número y luego el siguiente.`:'';
 $('copies').previousElementSibling.textContent=job.hasSequence?'Copias de cada número · ^PQ':'Cantidad de etiquetas · ^PQ';$('preview').hidden=false;$('empty').hidden=true;
 $('copy').disabled=$('download').disabled=false;$('dimensions').textContent=`${w} × ${h} dots`;
 $('info').textContent=`${Number(fromMm(mmW,$('units').value).toFixed(4))} × ${Number(fromMm(mmH,$('units').value).toFixed(4))} ${unitLabel()} · ${dpi} dpi · ${job.total} etiqueta(s)`;status('Conversión lista. Puedes copiar o descargar el código.');
 }catch(error){clear();$('empty').querySelector('p').textContent=error.message;if(activeTab==='editor'){$('editor-error').textContent=error.message;$('editor-error').hidden=false;}status(error.message);}finally{positionController?.refresh();}
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
for(const id of ['width','height','dpi','threshold','invert','mode','copies','speed','media','gap','puzzle-rows','puzzle-cols','puzzle-fit','print-method','darkness-mode','darkness','ribbon-type','stock-type','handling-mode'])$(id).addEventListener('input',render);
for(const event of ['dragover','dragleave','drop'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.toggle('dragging',event==='dragover');if(event==='drop')load(e.dataTransfer.files[0]);});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('code').value);status('Código copiado.');}catch{ $('code').select();status('Selecciona y copia el código con Ctrl+C o Cmd+C.');}});
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([$('code').value],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=activeTab==='puzzle'?'rompecabezas.zpl':'etiqueta.zpl';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Archivo ZPL descargado.');});

for(const [id,measurement] of [['pw','width'],['ll','height']])$(id).addEventListener('input',()=>{
 const dots=$(id).value===''?NaN:Number($(id).value);writeMm(measurement,Number.isInteger(dots)?dots*25.4/Number($('dpi').value):NaN);render();
});
cropController=initImageCrop({onChange:()=>render(),onBusy:()=>{$('copy').disabled=$('download').disabled=true;status('Ajustando área: al soltar se actualizarán la vista previa y el ZPL.');}});
initEditor(render,status);
installFieldHelp();
positionController=initPositioning({scene:editorScene,select:selectEditorItem,move:moveEditorItem,commit:commitEditorPosition});
initPrinterCatalog(render);initZplViewer();initPreferences();
const routes={preferences:'/configuracion.html',models:'/impresoras.html',viewer:'/visor-zpl.html',image:'/index.html',editor:'/editor.html',puzzle:'/rompecabezas.html',gallery:'/fuentes.html'};
const sections={preferences:['Configuración de página','Elige colores, tema y comodidad de lectura para tu navegador.'],models:['Modelos Zebra','Busca tu impresora y configura sus opciones de referencia.'],viewer:['Previsualizar código ZPL','Pega un código y convierte sus campos en una imagen de etiqueta.'],image:['Imagen a ZPL','Convierte tus imágenes a blanco y negro o grises con puntos.'],editor:['Crea tu etiqueta desde cero','Texto, QR, códigos de barras y recuadros con comandos ZPL nativos.'],puzzle:['Rompecabezas de etiquetas','Divide una imagen completa en piezas para imprimir y ensamblar.'],gallery:['Fuentes y muestrario','Explora fuentes residentes y elementos para tu impresora Zebra.']};
function switchTab(tab,navigate=true){
 if(navigate&&location.pathname!==routes[tab])history.pushState({section:tab},'',routes[tab]);
 document.body.dataset.page=tab;document.title=sections[tab][0]+' · Label Studio';$('section-title').textContent=sections[tab][0];$('section-description').textContent=sections[tab][1];

 for(const t of ['image','editor','puzzle','gallery','models','viewer','preferences']){ $('tab-'+t).classList.toggle('active',t===tab);$('tab-'+t).setAttribute('aria-pressed',String(t===tab));if(t===tab)$('tab-'+t).setAttribute('aria-current','page');else $('tab-'+t).removeAttribute('aria-current'); }
 $('positioning-tools').hidden=tab!=='editor';$('section-current').textContent=sections[tab][0];$('section-menu').open=false;
 activeTab=tab;
 $('gallery').hidden=tab!=='gallery';$('models').hidden=tab!=='models';$('viewer').hidden=tab!=='viewer';$('preferences').hidden=tab!=='preferences';$('workspace').hidden=['gallery','models','viewer','preferences'].includes(tab);
 if(['gallery','models','viewer','preferences'].includes(tab)){positionController?.refresh();return;}
 $('image-tools').hidden=$('image-adjustments').hidden=!['image','puzzle'].includes(tab);$('editor-tools').hidden=tab!=='editor';$('puzzle-tools').hidden=tab!=='puzzle';
 $('image-area-controls').hidden=tab!=='image';
 $('print-settings').open=tab!=='editor';if(tab==='editor')$('zpl-output').open=false;
 $('preview-note').textContent=tab==='editor'?'Vista previa aproximada. Las fuentes, sus tamaños y los códigos nativos los interpreta la impresora.':'Vista previa del mapa de bits.';
 $('series-job-info').hidden=tab!=='editor';
 $('copies').previousElementSibling.textContent=tab==='puzzle'?'Copias por pieza · ^PQ':'Cantidad de etiquetas · ^PQ';
 clear();render();if(tab!=='editor'&&!source)status('Carga una imagen para empezar.');
}
for(const tab of ['image','editor','puzzle','gallery','models','viewer','preferences'])$('tab-'+tab).addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();switchTab(tab);});
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

function updateThermalUi(){
 const method=$('print-method').value,ribbon=$('ribbon-type');ribbon.disabled=method==='direct';if(method==='direct')ribbon.value='unknown';
 $('darkness-field').hidden=$('darkness-mode').value!=='custom';
 const notes={unknown:'Selecciona el consumible que instalaste. La aplicación no detecta ni cambia el ribbon físico.',wax:'Cera: habitual para etiquetas de papel. Confirma la combinación con tu proveedor.', 'wax-resin':'Cera/resina: habitual para papel tratado y algunos sintéticos. Verifica compatibilidad.',resin:'Resina: habitual para materiales sintéticos compatibles, como poliéster. Requiere una combinación de ribbon y etiqueta adecuada.'};
 $('ribbon-note').textContent=method==='direct'?'Térmica directa: utiliza etiqueta termosensible y no utiliza ribbon.':notes[ribbon.value];
 $('thermal-summary').textContent=(method==='direct'?'^MTD · térmica directa':method==='transfer'?'^MTT · transferencia térmica':'Método configurado en la impresora')+($('darkness-mode').value==='custom'?` · ~SD${$('darkness').value} · intensidad térmica (no °C)`:' · oscuridad configurada en la impresora')+'. El ribbon y el material son referencias del consumible, no comandos ZPL.';
}
