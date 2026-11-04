export const toMm=(value,unit='mm')=>unit==='in'?value*25.4:value;
export const fromMm=(value,unit='mm')=>unit==='in'?value/25.4:value;
let unit='mm';const fields=new Map();
export const unitLabel=id=>(id?fields.get(id)?.unit:unit)==='in'?'pulg':'mm';
export function readMm(id){return fields.get(id)?.mm??Number(document.getElementById(id).value);}
export function writeMm(id,mm){
 const field=fields.get(id),input=document.getElementById(id),current=field?.unit||unit;
 if(field)field.mm=mm;
 input.value=Number.isFinite(mm)?String(Number(fromMm(mm,current).toFixed(current==='in'?6:4))):'';
}
function updateField(id){
 const field=fields.get(id),input=document.getElementById(id);writeMm(id,field.mm);
 for(const key of ['min','max'])if(field[key]!==null)input[key]=String(fromMm(Number(field[key]),field.unit));
 input.step=field.unit==='in'?'0.01':field.step;
 document.getElementById(id+'-unit').value=field.unit;
 const label=document.querySelector(`label[for="${id}"]`);
 if(label)label.textContent=label.textContent.replace(/\s*\((mm|pulg)\)/,'');
}
export function initUnits(onChange){
 for(const id of ['width','height','gap','element-x','element-y','element-w','element-h','font-size','line-width','companion-size']){
  const input=document.getElementById(id);if(!input)continue;
  const field={mm:input.value===''?NaN:Number(input.value),unit,min:input.getAttribute('min'),max:input.getAttribute('max'),step:input.step};fields.set(id,field);
  const control=document.createElement('div');control.className='measure-control';input.before(control);control.append(input);
  const select=document.createElement('select');select.id=id+'-unit';select.setAttribute('aria-label','Unidad de '+(document.querySelector(`label[for="${id}"]`)?.textContent||id));
  for(const [value,label] of [['mm','mm'],['in','pulgadas']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}control.append(select);
  input.parentElement.parentElement.querySelectorAll('[data-measure-unit]').forEach(node=>node.remove());
  input.addEventListener('input',()=>{field.mm=input.value===''?NaN:toMm(Number(input.value),field.unit);});
  select.addEventListener('change',()=>{field.unit=select.value;updateField(id);onChange();});updateField(id);
 }
 document.getElementById('units').addEventListener('change',event=>{
  unit=event.target.value;for(const [id,field] of fields){field.unit=unit;updateField(id);}onChange();
 });
}
