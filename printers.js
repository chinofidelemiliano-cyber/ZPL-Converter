export const legacySpeedIps={A:2,B:3,C:4,D:6,E:8};
const groups={
 'Industrial':['ZT111','ZT211','ZT231','ZT410','ZT420','ZT411','ZT421','ZT510','ZT610','ZT620','ZT210','ZT220','ZT230','Z4M','Z6M','Z4Mplus','Z6Mplus','ZM400','ZM600','Z4000','Z6000','105SL','105SLPlus','90XiIII','96XiIII','110XiIIIPlus','140XiIIIPlus','170XiIIIPlus','220XiIIIPlus','110Xi4','140Xi4','170Xi4','220Xi4','S4M','S600','R110Xi','R170Xi','R110Xi4','RZ400','RZ600','ZT411 RFID','ZT421 RFID','ZT610 RFID','ZT620 RFID'],
 'Sobremesa':['ZD220','ZD230','ZD411','ZD421','ZD611','ZD621','ZD410','ZD420','ZD500','ZD500R','ZD620','ZD510-HC','ZD411-HC','ZD421-HC','ZD611-HC','ZD621-HC','ZD621R','ZD888','ZD888T','GC420d','GC420t','GK420d','GK420t','GX420d','GX420t','GX430t','GT800','GK888d','GK888t','LP2824','LP2824 Plus','TLP2824','TLP2824 Plus','LP2844','LP2844-Z','TLP2844','TLP2844-Z','TLP3842','TLP3844-Z','R2844-Z','R402','DA402','T402'],
 'Móvil':['ZQ110','ZQ112','ZQ120','ZQ210','ZQ220','ZQ220 Plus','ZQ310','ZQ320','ZQ310 Plus','ZQ320 Plus','ZQ510','ZQ520','ZQ511','ZQ521','ZQ610','ZQ620','ZQ630','ZQ610 Plus','ZQ620 Plus','ZQ630 Plus','ZQ630 RFID','ZQ511 RFID','ZQ521 RFID','QL220','QL220 Plus','QL320','QL320 Plus','QL420','QL420 Plus','QLn220','QLn320','QLn420','P4T','RP4T','RW220','RW420','MZ220','MZ320','iMZ220','iMZ320','EM220','EM220II'],
 'Motor de impresión':['ZE500-4','ZE500-6','ZE511','ZE521','ZE511 RFID','ZE521 RFID','110PAX4','170PAX4','110PAX3','170PAX3'],
 'Tarjetas':['ZC100','ZC300','ZC350','ZC10L','ZXP Series 1','ZXP Series 3','ZXP Series 7','ZXP Series 8','ZXP Series 9','P100i','P110i','P120i','P330i','P430i','P630i','P640i'],
 'Pulseras':['HC100']
};
const known={
 Z4M:{dpi:[203,300],maxWidth:104},Z6M:{dpi:[203,300],maxWidth:168},Z4Mplus:{dpi:[203,300],maxWidth:104},Z6Mplus:{dpi:[203,300],maxWidth:168},
 ZT411:{dpi:[203,300,600],maxWidth:104},ZT421:{dpi:[203,300],maxWidth:168},ZT610:{dpi:[203,300,600],maxWidth:104},ZT620:{dpi:[203,300],maxWidth:168},
 ZD220:{dpi:[203],maxWidth:104,maxSpeed:4},ZD230:{dpi:[203],maxWidth:104,maxSpeed:6},
 ZD411:{dpi:[203,300],maxWidth:56},ZD611:{dpi:[203,300],maxWidth:56},ZD410:{dpi:[203,300],maxWidth:56},
 ZD421:{dpi:[203,300],maxWidth:104},ZD621:{dpi:[203,300],maxWidth:104},ZD420:{dpi:[203,300],maxWidth:104},ZD620:{dpi:[203,300],maxWidth:104},
 GK420d:{dpi:[203],maxWidth:104,maxSpeed:5},GK420t:{dpi:[203],maxWidth:104,maxSpeed:5},GX430t:{dpi:[300],maxWidth:104,maxSpeed:4},
 ZT210:{dpi:[203,300],maxWidth:104},ZT220:{dpi:[203,300],maxWidth:104},ZT230:{dpi:[203,300],maxWidth:104},ZT510:{dpi:[203,300],maxWidth:104},
 ZM400:{dpi:[203,300,600],maxWidth:104},ZM600:{dpi:[203,300],maxWidth:168},'110Xi4':{dpi:[203,300,600],maxWidth:104},'170Xi4':{dpi:[203,300],maxWidth:168},'220Xi4':{dpi:[203,300],maxWidth:216}
};
const notZpl=new Set(['ZQ110','EM220','EM220II','LP2824','TLP2824','LP2844','TLP2844','TLP3842']);
export const printerModels=[{id:'manual',name:'Otro modelo / configuración manual',family:'Personalizado',zpl:null,dpi:null,maxWidth:null,maxSpeed:null}];
for(const [family,names] of Object.entries(groups))for(const name of names){
 const info=known[name];
 printerModels.push({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,family,zpl:family==='Tarjetas'||notZpl.has(name)?false:info?true:null,dpi:info?.dpi||null,maxWidth:info?.maxWidth||null,maxSpeed:info?.maxSpeed||null});
}
export function profileById(id,custom=[]){return [...printerModels,...custom].find(profile=>profile.id===id)||printerModels[0];}
export function validatePrinter(profile,{width,dpi,speed}){
 if(profile.zpl===false)throw new Error(`${profile.name}: este perfil no utiliza ZPL para imprimir. Selecciona una impresora ZPL o un perfil manual confirmado.`);
 if(profile.dpi&&!profile.dpi.includes(dpi))throw new Error(`${profile.name}: elige una resolución disponible en el perfil (${profile.dpi.join(', ')} dpi).`);
 if(profile.maxWidth&&width>profile.maxWidth+.001)throw new Error(`${profile.name}: el ancho máximo de referencia es ${profile.maxWidth} mm. Reduce el ancho de la etiqueta.`);
 const ips=legacySpeedIps[speed]??Number(speed);
 if(speed!==''&&profile.maxSpeed&&ips>profile.maxSpeed)throw new Error(`${profile.name}: el perfil admite hasta ${profile.maxSpeed} pulgadas/s. Elige una velocidad menor.`);
}
export function customProfile({name,dpi,maxWidth,maxSpeed,zpl}){
 const clean=String(name||'').trim();if(!clean||clean.length>80)throw new Error('Escribe un nombre de modelo de hasta 80 caracteres.');
 if(![203,300,600].includes(Number(dpi))||!Number.isFinite(Number(maxWidth))||Number(maxWidth)<1||Number(maxWidth)>300)throw new Error('Indica una resolución válida y un ancho entre 1 y 300 mm.');
 if(maxSpeed!==''&&(!Number.isInteger(Number(maxSpeed))||Number(maxSpeed)<1||Number(maxSpeed)>14))throw new Error('La velocidad máxima debe ser un entero de 1 a 14 pulgadas/s o quedar vacía.');
 if(!['yes','no','unknown'].includes(zpl))throw new Error('Confirma si el modelo usa ZPL.');
 return {id:'custom-'+clean.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:clean,family:'Personalizado',dpi:[Number(dpi)],maxWidth:Number(maxWidth),maxSpeed:maxSpeed===''?null:Number(maxSpeed),zpl:zpl==='unknown'?null:zpl==='yes'};
}
