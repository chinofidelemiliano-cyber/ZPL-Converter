import {printerModels,profileById,customProfile,legacySpeedIps} from './printers.js?v=native-v9';
let selected=printerModels[0],custom=[];
export const currentPrinter=()=>selected;
export function initPrinterCatalog(onApply){
 const $=id=>document.getElementById(id);let browsing=selected;
 try{for(const item of JSON.parse(localStorage.getItem('label-studio-printer-profiles')||'[]'))custom.push(customProfile({name:item.name,dpi:item.dpi?.[0],maxWidth:item.maxWidth,maxSpeed:item.maxSpeed??'',zpl:item.zpl===null?'unknown':item.zpl?'yes':'no'}));}catch{custom=[];}
 const all=()=>[...printerModels,...custom];
 function fillSelect(){
  const active=$('active-printer');active.replaceChildren();
  for(const profile of all()){const option=document.createElement('option');option.value=profile.id;option.textContent=profile.name;active.append(option);}active.value=selected.id;
 }
 function details(profile){
  browsing=profile;$('printer-detail-title').textContent=profile.name;$('printer-detail-grid').replaceChildren();
  const rows=[['Familia',profile.family],['ZPL',profile.zpl===true?'Perfil ZPL de referencia':profile.zpl===false?'Este perfil no usa ZPL para imprimir':'Por confirmar en el manual / firmware'],['Resoluciones',profile.dpi?profile.dpi.join(' / ')+' dpi':'Dependen de la variante; completa un perfil personalizado'],['Ancho imprimible',profile.maxWidth?profile.maxWidth+' mm':'No verificado'],['Velocidad máxima',profile.maxSpeed?profile.maxSpeed+' pulgadas/s (referencia)':'No verificada para todas las resoluciones'],['Opciones de la aplicación',profile.zpl===false?'El convertidor ZPL no aplica a este modelo':'Texto, barras, QR, imágenes, copias, material y velocidad ZPL']];
  for(const [label,value] of rows){const card=document.createElement('div');card.className='option-card';const title=document.createElement('strong');title.textContent=label;const text=document.createElement('p');text.textContent=value;card.append(title,text);$('printer-detail-grid').append(card);}
  $('printer-use').disabled=false;
 }
 function list(){
  const query=$('printer-search').value.trim().toLowerCase(),family=$('printer-family').value,items=all().filter(p=>(!family||p.family===family)&&(p.name+' '+p.family).toLowerCase().includes(query));
  $('printer-list').replaceChildren();$('printer-count').textContent=`${items.length} de ${all().length} perfiles. Catálogo de referencia ampliable; no es un inventario exhaustivo de todas las variantes.`;
  for(const profile of items){const button=document.createElement('button');button.className='printer-item';const name=document.createElement('strong');name.textContent=profile.name;const note=document.createElement('small');note.textContent=profile.family+' · '+(profile.zpl===false?'Sin ZPL':profile.zpl===true?'Perfil ZPL':'Compatibilidad por confirmar');button.append(name,note);button.addEventListener('click',()=>details(profile));$('printer-list').append(button);}
 }
 function apply(profile,persist=true){
  selected=profile;$('active-printer').value=profile.id;
  const dpi=$('dpi'),speed=$('speed');let changed=[];
  for(const option of dpi.options)option.disabled=!!profile.dpi&&!profile.dpi.includes(Number(option.value));
  if(dpi.selectedOptions[0]?.disabled){dpi.value=String(profile.dpi[0]);changed.push('resolución '+dpi.value+' dpi');}
  for(const option of speed.options){const ips=legacySpeedIps[option.value]??Number(option.value);option.disabled=option.value!==''&&!!profile.maxSpeed&&ips>profile.maxSpeed;}
  if(speed.selectedOptions[0]?.disabled){speed.value='';changed.push('velocidad configurada en la impresora');}
  $('active-printer-note').textContent=profile.name+(profile.maxWidth?' · ancho máximo de referencia '+profile.maxWidth+' mm':' · ancho por confirmar')+(profile.zpl===false?' · este modelo no imprime ZPL':profile.zpl===null?' · confirma el lenguaje antes de imprimir':'')+'.';
  $('printer-status').textContent='Perfil aplicado: '+profile.name+(changed.length?'. Ajustes: '+changed.join(', '):'')+'. El ancho no se recorta automáticamente.';
  if(persist)try{localStorage.setItem('label-studio-active-printer',profile.id);}catch{$('printer-status').textContent+=' El navegador no permitió guardar la selección.';}
  onApply();
 }
 for(const family of [...new Set(all().map(p=>p.family))]){const option=document.createElement('option');option.value=family;option.textContent=family;$('printer-family').append(option);}
 $('printer-search').addEventListener('input',list);$('printer-family').addEventListener('change',list);
 $('active-printer').addEventListener('change',event=>apply(profileById(event.target.value,custom)));
 $('printer-use').addEventListener('click',()=>apply(browsing));
 $('printer-custom-save').addEventListener('click',()=>{
  try{const profile=customProfile({name:$('printer-custom-name').value,dpi:$('printer-custom-dpi').value,maxWidth:$('printer-custom-width').value,maxSpeed:$('printer-custom-speed').value,zpl:$('printer-custom-zpl').value});custom=custom.filter(p=>p.id!==profile.id);custom.push(profile);let saved=true;try{localStorage.setItem('label-studio-printer-profiles',JSON.stringify(custom));}catch{saved=false;}fillSelect();list();details(profile);$('printer-status').textContent=saved?'Perfil personalizado guardado en este navegador. Pulsa Usar este modelo para aplicarlo.':'Perfil disponible en esta sesión; el navegador no permitió guardarlo.';}catch(error){$('printer-status').textContent=error.message;}
 });
 fillSelect();list();details(profileById('z4m'));let saved='manual';try{saved=localStorage.getItem('label-studio-active-printer')||'manual';}catch{}apply(profileById(saved,custom),false);
}
