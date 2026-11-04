export function decodeField(value,indicator=null,ci=28){
 if(!indicator)return value;
 const bytes=[];let plain='';const flush=()=>{bytes.push(...new TextEncoder().encode(plain));plain='';};
 for(let i=0;i<value.length;i++){
  if(value[i]===indicator&&/^[0-9a-f]{2}$/i.test(value.slice(i+1,i+3))){flush();bytes.push(parseInt(value.slice(i+1,i+3),16));i+=2;}else plain+=value[i];
 }
 flush();return new TextDecoder(ci===28?'utf-8':'windows-1252').decode(new Uint8Array(bytes));
}
export function decodeGraphic(data,total,rowBytes){
 if(!Number.isInteger(total)||!Number.isInteger(rowBytes)||total<1||rowBytes<1||total%rowBytes||total>2000000)throw new Error('Dimensiones del gráfico inválidas o demasiado grandes.');
 if(data.includes(':Z64:')||data.includes(':B64:'))throw new Error('El visor local aún no admite gráficos Z64/B64. Usa ^GFA ASCII o descomprime la imagen antes.');
 const expected=total*2,rowLength=rowBytes*2;let hex='',repeat=0;
 const append=text=>{if(hex.length+text.length>expected)throw new Error('El gráfico contiene más datos de los declarados.');hex+=text;};
 for(const char of data.replace(/\s/g,'')){
  if(/[0-9A-Fa-f]/.test(char)){append(char.repeat(repeat||1));repeat=0;}
  else if(/[G-Y]/.test(char))repeat+=char.charCodeAt(0)-70;
  else if(/[g-z]/.test(char))repeat+=(char.charCodeAt(0)-102)*20;
  else if(char===','||char==='!'){append((char===','?'0':'F').repeat(rowLength-hex.length%rowLength));repeat=0;}
  else if(char===':'){if(hex.length<rowLength||hex.length%rowLength)throw new Error('Repetición de fila gráfica inválida.');append(hex.slice(-rowLength));repeat=0;}
  else throw new Error('Compresión o carácter gráfico no compatible.');
  if(repeat>expected)throw new Error('Repetición gráfica demasiado larga.');
 }
 if(repeat||hex.length!==expected)throw new Error('Los datos del gráfico no coinciden con su tamaño declarado.');
 return Uint8Array.from({length:total},(_,i)=>parseInt(hex.slice(i*2,i*2+2),16));
}
const number=(text,fallback=0)=>{const value=Number(text);return text!==''&&Number.isFinite(value)?value:fallback;};
export function parseZpl(source){
 if(typeof source!=='string'||source.length>16000000)throw new Error('El código debe ser texto y no superar los 16 MB.');
 if(!source.includes('^XA'))throw new Error('No se encontró el inicio de etiqueta ^XA.');
 const labels=[],resources=new Map();let label=null,field=null,defaults,origin,by,ci=28;
 const warnings=new Set();
 const reset=()=>({x:0,y:0,font:defaults.font,size:defaults.size,charWidth:defaults.charWidth,rotation:'N',kind:'text',indicator:null,block:null,data:null});
 const position=()=>({x:field.x+origin.x-origin.shift,y:field.y+origin.y+origin.top});
 const graphic=(type,data,total,rowBytes)=>({kind:'graphic',encoding:type,data,total,rowBytes});
 let commandCount=0;
 const commandPattern=/[\^~]([A-Z@][A-Z0-9@])([^\^~]*)/g;let match;
 while((match=commandPattern.exec(source))){
  if(++commandCount>100000)throw new Error('Demasiados comandos para el visor local.');
  const command=match[1],raw=match[2],args=raw.trim().split(',');
  if(command==='DG'){
   const [name,total,rowBytes,...rest]=args;resources.set(name,graphic('A',rest.join(','),number(total),number(rowBytes)));continue;
  }
  if(command==='XA'){
   if(label)throw new Error('Hay una etiqueta ^XA sin cerrar con ^XZ.');
   if(labels.length>=1000)throw new Error('El visor admite hasta 1000 etiquetas por archivo.');
   defaults={font:'0',size:30,charWidth:18};origin={x:0,y:0,shift:0,top:0};by={width:2,ratio:3,height:80};ci=28;label={width:800,height:400,widthExplicit:false,heightExplicit:false,fields:[],warnings:[],copies:1};field=reset();continue;
  }
  if(!label)continue;
  if(command==='XZ'){labels.push(label);label=null;field=null;continue;}
  if(command==='PW'){label.width=number(args[0],800);label.widthExplicit=true;}
  else if(command==='LL'){label.height=number(args[0],400);label.heightExplicit=true;}
  else if(command==='LH'){origin.x=number(args[0]);origin.y=number(args[1]);}
  else if(command==='LS')origin.shift=number(args[0]);
  else if(command==='LT')origin.top=number(args[0]);
  else if(command==='CI')ci=number(args[0],28);
  else if(command==='CF'){defaults={font:args[0]||'0',size:number(args[1],30),charWidth:number(args[2],number(args[1],30)*.6)};field={...field,...defaults};}
  else if(command==='FO'||command==='FT'){field.x=number(args[0]);field.y=number(args[1]);field.baseline=command==='FT';}
  else if(command[0]==='A'){
   const rotation=args[0]?.[0]||'N';field.font=command[1];field.rotation=rotation;field.size=number(args[1],defaults.size);field.charWidth=number(args[2],field.size*.6);
   if(command==='A@')label.warnings.push('Las fuentes por archivo ^A@ se muestran con una tipografía aproximada.');
  }
  else if(command==='FH')field.indicator=raw[0]&&!/\s/.test(raw[0])?raw[0]:'_';
  else if(command==='FB')field.block={width:number(args[0],label.width),lines:number(args[1],1),spacing:number(args[2]),align:args[3]||'L'};
  else if(command==='BY')by={width:number(args[0],2),ratio:number(args[1],3),height:number(args[2],80)};
  else if(['B3','BC','BE','B8','BU','B2'].includes(command)){
   const heightIndex=command==='B3'?2:1,showIndex=command==='B3'?3:2;
   Object.assign(field,{kind:'barcode',format:{B3:'CODE39',BC:'CODE128',BE:'EAN13',B8:'EAN8',BU:'UPC',B2:'ITF'}[command],rotation:args[0]||'N',height:number(args[heightIndex],by.height),showText:args[showIndex]!=='N',module:by.width,ratio:by.ratio});
  }
  else if(command==='BQ')Object.assign(field,{kind:'qr',rotation:args[0]||'N',module:number(args[2],3)});
  else if(['GB','GC','GE'].includes(command))Object.assign(field,{kind:'shape',shape:command,width:number(args[0],1),height:command==='GC'?number(args[0],1):number(args[1],1),thickness:number(args[command==='GC'?1:2],1),color:args[command==='GC'?2:3]||'B'});
  else if(command==='GF'){const [encoding,total,used,rowBytes,...data]=args;Object.assign(field,graphic(encoding, data.join(','),number(total),number(rowBytes)));}
  else if(command==='XG'){
   const stored=resources.get(args[0]);if(!stored)label.warnings.push('No se encontró el gráfico '+args[0]+'. No se consultan archivos de la impresora.');
   else Object.assign(field,stored,{scaleX:number(args[1],1),scaleY:number(args[2],1)});
  }
  else if(command==='FD')field.data=decodeField(raw,field.indicator,ci);
  else if(command==='SN'){field.data=decodeField(args[0],field.indicator,ci);label.warnings.push('^SN muestra el valor inicial. Las repeticiones y consecutivos de la impresora no se expanden.');}
  else if(command==='FS'){
   if(field.data!==null||field.kind==='shape'||field.kind==='graphic'){if(label.fields.length>=5000)throw new Error('Demasiados campos en una etiqueta.');label.fields.push({...field,...position()});}field=reset();
  }
  else if(command==='PQ')label.copies=number(args[0],1);
  else if(!['PR','MN','MD','SD','FX','MM','MT','JZ','JH','MC','PM','LR','PO','FW','FS'].includes(command))label.warnings.push('Comando no compatible: '+command+'. La vista puede estar incompleta.');
  else if(['PO','FW','LR','PM'].includes(command)&&args[0]&&!['N','0'].includes(args[0]))label.warnings.push('La transformación ^'+command+' no se simula.');
 }
 if(label)throw new Error('Falta ^XZ para cerrar la última etiqueta.');
 if(!labels.length)throw new Error('No se encontraron etiquetas completas.');
 for(const item of labels){
  if(!Number.isInteger(item.width)||!Number.isInteger(item.height)||item.width<1||item.height<1||item.width>10000||item.height>10000||item.width*item.height>16000000)throw new Error('El tamaño de una etiqueta es inválido o supera 16 millones de puntos.');
  if(!item.widthExplicit)item.warnings.push('No se indicó ^PW. El visor supone un ancho de 800 dots.');
  if(!item.heightExplicit)item.warnings.push('No se indicó ^LL. El visor supone un largo de 400 dots.');
  item.warnings=[...new Set(item.warnings)];
 }
 return {labels,warnings:[...warnings]};
}
