import {rasterToZpl} from './converter.js';
const $=id=>document.getElementById(id);
let source=null,request=0;
function status(message){$('status').textContent=message;}
function clear(){ $('code').value='';$('copy').disabled=$('download').disabled=true;$('preview').hidden=true;$('empty').hidden=false; }
function render(){
 $('thresholdValue').textContent=$('threshold').value;
 if(!source)return;
 try{
 const mmW=Number($('width').value),mmH=Number($('height').value),dpi=Number($('dpi').value);
 if(mmW<1||mmW>200||mmH<1||mmH>300||!Number.isFinite(mmW+mmH))throw new Error('Usa un ancho entre 1 y 200 mm y un alto entre 1 y 300 mm.');
 const w=Math.round(mmW*dpi/25.4),h=Math.round(mmH*dpi/25.4);
 if(w*h>16000000)throw new Error('La etiqueta es demasiado grande. Reduce el tamaño o la resolución.');
 const canvas=$('preview');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,w,h);
 const scale=Math.min(w/source.width,h/source.height),iw=Math.max(1,Math.round(source.width*scale)),ih=Math.max(1,Math.round(source.height*scale));
 const imageCanvas=document.createElement('canvas');imageCanvas.width=iw;imageCanvas.height=ih;
 const imageCtx=imageCanvas.getContext('2d',{willReadFrequently:true});imageCtx.drawImage(source,0,0,iw,ih);
 const raster=rasterToZpl(imageCtx.getImageData(0,0,iw,ih).data,iw,ih,Number($('threshold').value),$('invert').checked);
 imageCtx.putImageData(new ImageData(raster.preview,iw,ih),0,0);ctx.drawImage(imageCanvas,Math.floor((w-iw)/2),Math.floor((h-ih)/2));
 const result=rasterToZpl(ctx.getImageData(0,0,w,h).data,w,h);
 $('code').value=result.zpl;$('preview').hidden=false;$('empty').hidden=true;
 $('copy').disabled=$('download').disabled=false;$('dimensions').textContent=`${w} × ${h} dots`;
 $('info').textContent=`${mmW} × ${mmH} mm · ${dpi} dpi`;status('Conversión lista. Puedes copiar o descargar el código.');
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
for(const id of ['width','height','dpi','threshold','invert'])$(id).addEventListener('input',render);
for(const event of ['dragover','dragleave','drop'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.toggle('dragging',event==='dragover');if(event==='drop')load(e.dataTransfer.files[0]);});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('code').value);status('Código copiado.');}catch{ $('code').select();status('Selecciona y copia el código con Ctrl+C o Cmd+C.');}});
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([$('code').value],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='etiqueta.zpl';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Archivo ZPL descargado.');});
