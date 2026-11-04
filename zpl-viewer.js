import {parseZpl} from './zpl-parser.js?v=native-v10';
import {renderZplLabel} from './zpl-renderer.js?v=native-v10';
export const zplExamples={
 text:'^XA\n^PW800\n^LL400\n^CI28\n^FO40,40\n^A0N,45,27\n^FDMi etiqueta de ejemplo^FS\n^FO40,110\n^GB720,240,3^FS\n^FO80,150\n^BQN,2,5\n^FDMA,https://example.com^FS\n^XZ',
 barcode:'^XA\n^PW800\n^LL400\n^FO40,35^A0N,35,21^FDProducto 123456^FS\n^FO40,110^BY3,3,130^BCN,130,Y,N^FD123456^FS\n^XZ',
 image:'~DGR:ICON.GRF,8,1,3C7EFFFFFFFF7E3C\n^XA\n^PW400\n^LL240\n^FO30,30^A0N,30,18^FDImagen guardada en ZPL^FS\n^FO140,100^XGR:ICON.GRF,10,10^FS\n^XZ'
};
export function initZplViewer(){
 const $=id=>document.getElementById(id);let parsed=null;
 function fail(message){$('zpl-view-warning-box').hidden=true;$('zpl-view-info').textContent='';$('zpl-view-error').textContent=message;$('zpl-view-error').hidden=false;$('zpl-view-canvas').hidden=true;$('zpl-view-download').disabled=true;$('zpl-view-state').textContent='Sin vista previa';}
 function draw(){
  if(!parsed)return;
  try{const index=Number($('zpl-view-label').value)||0,label=parsed.labels[index],result=renderZplLabel(label,$('zpl-view-canvas'));$('zpl-view-error').hidden=true;$('zpl-view-canvas').hidden=false;$('zpl-view-download').disabled=!result.rendered;
   $('zpl-view-warnings').replaceChildren();for(const text of result.warnings){const item=globalThis.document.createElement('li');item.textContent=text;$('zpl-view-warnings').append(item);}
   $('zpl-view-warning-box').hidden=!result.warnings.length;$('zpl-view-state').textContent=result.warnings.length?'Vista parcial / aproximada':'Vista aproximada';
   const dpi=Number($('zpl-view-dpi').value);$('zpl-view-info').textContent=`${label.width} × ${label.height} dots · ${(label.width*25.4/dpi).toFixed(2)} × ${(label.height*25.4/dpi).toFixed(2)} mm a ${dpi} dpi · ^PQ ${label.copies}`;
  }catch(error){fail(error.message);}
 }
 $('zpl-view-render').addEventListener('click',()=>{try{parsed=parseZpl($('zpl-input').value);$('zpl-view-label').replaceChildren();parsed.labels.forEach((label,index)=>{const option=globalThis.document.createElement('option');option.value=index;option.textContent=`Etiqueta ${index+1} de ${parsed.labels.length}`;$('zpl-view-label').append(option);});draw();}catch(error){parsed=null;fail(error.message);}});
 $('zpl-view-label').addEventListener('change',draw);$('zpl-view-dpi').addEventListener('change',draw);
 $('zpl-view-example').addEventListener('change',event=>{if(zplExamples[event.target.value]){$('zpl-input').value=zplExamples[event.target.value];$('zpl-view-render').click();}});
 $('zpl-view-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;if(file.size>16000000){fail('El archivo supera 16 MB.');return;}try{$('zpl-input').value=await file.text();$('zpl-view-render').click();}catch{fail('No se pudo leer el archivo.');}});
 $('zpl-view-download').addEventListener('click',()=>{$('zpl-view-canvas').toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=globalThis.document.createElement('a');a.href=url;a.download='vista-etiqueta.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');});
}
