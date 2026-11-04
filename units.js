export const toMm=(value,unit='mm')=>unit==='in'?value*25.4:value;
export const fromMm=(value,unit='mm')=>unit==='in'?value/25.4:value;
let unit='mm';
const fields=new Map();
export const unitLabel=()=>unit==='in'?'pulg':'mm';
export function readMm(id){return fields.get(id)?.mm??Number(document.getElementById(id).value);}
export function writeMm(id,mm){
 const field=fields.get(id),input=document.getElementById(id);
 if(field)field.mm=mm;
 input.value=Number.isFinite(mm)?String(Number(fromMm(mm,unit).toFixed(unit==='in'?6:4))):'';
}
export function initUnits(onChange){
 for(const id of ['width','height','element-x','element-y','element-w','element-h','font-size','line-width']){
  const input=document.getElementById(id);
  const field={mm:input.value===''?NaN:Number(input.value),min:input.getAttribute('min'),max:input.getAttribute('max'),step:input.step};fields.set(id,field);
  input.addEventListener('input',()=>{field.mm=input.value===''?NaN:toMm(Number(input.value),unit);});
 }
 document.getElementById('units').addEventListener('change',event=>{
  unit=event.target.value;
  for(const [id,field] of fields){
   const input=document.getElementById(id);writeMm(id,field.mm);
   for(const key of ['min','max'])if(field[key]!==null)input[key]=String(fromMm(Number(field[key]),unit));
   input.step=unit==='in'?'0.01':field.step;
  }
  for(const node of document.querySelectorAll('[data-measure-unit]'))node.textContent=unitLabel();
  for(const label of document.querySelectorAll('label[for]'))if(/\((mm|pulg)\)/.test(label.textContent))label.textContent=label.textContent.replace(/\((mm|pulg)\)/,`(${unitLabel()})`);
  document.getElementById('position-hint').textContent=`Añade elementos, selecciónalos en la lista y ajusta su posición en ${unit==='in'?'pulgadas':'milímetros'}.`;
  onChange();
 });
}
